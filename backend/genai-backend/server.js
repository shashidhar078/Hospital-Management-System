const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();
const app = express();

// CORS setup
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer setup for PDF upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Google Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

// Function to extract medicine names from text
const extractDrugsFromText = (text) => {
    const regex = /\b([A-Z][a-z]+(?:mycin|cillin|pril|zole|dipine|olol|caine|sartan|mab|nib)?)\b/g;
    const matches = text.match(regex) || [];
    const uniqueMatches = [...new Set(matches)];
    return uniqueMatches;
};

// Function to call Gemini AI with prompt
const fetchDrugDetails = async (medicines) => {
    const prompt = `
You are a medical assistant. Provide details in JSON format for the following medicines:
${medicines.join(', ')}

Format:
[
  {
    "medicine": "Paracetamol",
    "drugNames": ["Tylenol", "Panadol"],
    "sideEffects": ["Nausea", "Rash"],
    "remedies": ["Drink water", "Use antihistamines"],
    "description": "Used to treat pain and fever.",
    "precautions": ["Avoid alcohol", "Check liver health"]
  },
  ...
]
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean JSON if it has ``` markers
    const cleanJson = text.replace(/```(json)?/g, '').trim();
    return JSON.parse(cleanJson);
};

// Route: Upload PDF and analyze
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'PDF file is required' });
        }

        const data = await pdfParse(req.file.buffer);
        const medicines = extractDrugsFromText(data.text);

        if (medicines.length === 0) {
            return res.status(404).json({ message: 'No medicine names found' });
        }

        const drugDetails = await fetchDrugDetails(medicines);
        res.json({ medicines: drugDetails });

    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Failed to process the file or fetch drug info', message: err.message });
    }
});

// Route: Search by medicine name(s)
app.post('/api/search', async (req, res) => {
    try {
        let { medicines } = req.body;

        if (!medicines) {
            return res.status(400).json({ error: 'Please provide medicine name(s)' });
        }

        if (!Array.isArray(medicines)) {
            medicines = [medicines];
        }

        const drugDetails = await fetchDrugDetails(medicines);
        res.json({ medicines: drugDetails });

    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Failed to fetch drug info', message: err.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
