import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

// ✅ Tailwind doesn't need to be added as a plugin in Vite — it works via PostCSS
// ❌ So remove this: import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000', // 🔁 Forward frontend /api calls to backend
    },
  },
});
