import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import handler from './proxy.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Increase payload size limit for base64 images
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Map the Vercel function route
app.post('/api/gemini/analyze', handler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
