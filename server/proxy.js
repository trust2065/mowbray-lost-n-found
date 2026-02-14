import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting for Gemini API
const geminiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many requests to Gemini API, please try again later.',
    retryAfter: 60
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gemini API proxy endpoint
app.post('/api/gemini/analyze', geminiRateLimit, async (req, res) => {
  try {
    const { imageData, prompt } = req.body;

    if (!imageData || !prompt) {
      return res.status(400).json({
        error: 'Missing required fields: imageData and prompt'
      });
    }

    const API_KEY = process.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({
        error: 'API key not configured on server'
      });
    }

    const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/png", data: imageData } }
            ]
          }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Gemini API request failed',
        details: errorText
      });
    }

    const result = await response.json();
    res.json(result);

  } catch (error) {
    console.error('Proxy server error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
