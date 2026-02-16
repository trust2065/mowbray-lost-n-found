import fetch from 'node-fetch'; // 如果 Node 版本較舊需要，Node 18+ 已內建 fetch

export default async function handler(req, res) {
  // 處理 CORS（Vercel 預設支援，但可手動加強）
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { imageData, prompt } = req.body;
  const API_KEY = process.env.VITE_GEMINI_API_KEY;

  try {
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

    const result = await response.json();
    res.status(response.status).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}