const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Enhanced configuration
dotenv.config();
const app = express();

// Improved CORS setup
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400
}));

// Better body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Secure file upload configuration
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

// Gemini AI with enhanced configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-pro",
    generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 2000
    }
});

// Enhanced medicine extraction
const extractDrugsFromText = (text) => {
    // Improved regex patterns
    const medicinePatterns = [
        /(?:\b|\d\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b(?!\s*(?:mg|ml|tablet|capsule)\b)/g,
        /\b([A-Z][a-z]+\s*(?:\d+[A-Za-z]*)*)\b/g,
        /(?:\b|\d\s+)([A-Z][a-z]+(?:mycin|cillin|pril|zole|dipine|olol|oxetine))\b/g
    ];

    const medicines = [];
    medicinePatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => medicines.push(match.trim()));
    });

    const commonWords = ['Take', 'Before', 'After', 'Meal', 'Tablet', 'Capsule', 'Morning', 'Night'];
    const dosagePattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(\d+\s*(?:mg|ml|g|mcg|IU)\b)/gi;
    const dosages = [];
    let dosageMatch;

    while ((dosageMatch = dosagePattern.exec(text)) !== null) {
        dosages.push({
            medicine: dosageMatch[1],
            dosage: dosageMatch[2]
        });
    }

    return {
        medicines: [...new Set(medicines)]
            .filter(med => med.length > 3 && !commonWords.includes(med)),
        dosages
    };
};

// Enhanced drug details fetching
const fetchDrugDetails = async (medicines) => {
    const results = [];
    const batchSize = 5; // Process 5 medicines at a time
    const batches = [];

    for (let i = 0; i < medicines.length; i += batchSize) {
        batches.push(medicines.slice(i, i + batchSize));
    }

    for (const batch of batches) {
        try {
            const prompt = `Provide details for these medicines: ${batch.join(', ')}. 
            Return a JSON array where each item has:
            - medicine: (string)
            - drugNames: [array]
            - sideEffects: [array]
            - remedies: [array]
            - description: (string)
            - precautions: [array]`;
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const data = JSON.parse(text);

            results.push(...data);
        } catch (error) {
            batch.forEach(medicine => {
                results.push({
                    medicine,
                    error: 'Failed to fetch details',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            });
        }
    }

    return results;
};

// Enhanced upload endpoint
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                error: 'NO_FILE',
                message: 'No PDF file uploaded',
                acceptedTypes: ['application/pdf']
            });
        }

        const startTime = Date.now();
        const data = await pdfParse(req.file.buffer);
        const extractionResult = extractDrugsFromText(data.text);
        
        if (extractionResult.medicines.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'NO_MEDICINES',
                message: 'No medicines detected in the prescription',
                extractedText: data.text.substring(0, 200) + '...'
            });
        }

        const drugDetails = await fetchDrugDetails(extractionResult.medicines);
        
        // Merge dosage information
        drugDetails.forEach(drug => {
            const dosageInfo = extractionResult.dosages.find(d => 
                d.medicine.toLowerCase() === drug.medicine.toLowerCase()
            );
            if (dosageInfo) drug.dosage = dosageInfo.dosage;
        });

        res.status(200).json({
            success: true,
            processingTime: `${(Date.now() - startTime)/1000}s`,
            fileInfo: {
                name: req.file.originalname,
                size: req.file.size,
                pages: data.numpages
            },
            medicines: drugDetails,
            warnings: drugDetails.filter(d => d.error)
        });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({
            success: false,
            error: 'PROCESSING_ERROR',
            message: 'Failed to process PDF',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Enhanced search endpoint
app.post('/api/search', async (req, res) => {
    try {
        let { medicines } = req.body;
        
        if (!medicines) {
            return res.status(400).json({ 
                success: false,
                error: 'MISSING_INPUT',
                message: 'Medicine names are required',
                example: { medicines: ["Paracetamol", "Ibuprofen"] }
            });
        }

        const medicinesArray = Array.isArray(medicines) ? medicines : [medicines];
        const drugDetails = await fetchDrugDetails(medicinesArray);
        
        res.status(200).json({
            success: true,
            count: drugDetails.length,
            results: drugDetails,
            warnings: drugDetails.filter(d => d.error)
        });

    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ 
            success: false,
            error: 'SEARCH_ERROR',
            message: 'Failed to search medicines',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.1.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log('Available Endpoints:');
    console.log(`- POST http://localhost:${PORT}/api/upload`);
    console.log(`- POST http://localhost:${PORT}/api/search`);
    console.log(`- GET  http://localhost:${PORT}/api/health`);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server terminated');
        process.exit(0);
    });
});