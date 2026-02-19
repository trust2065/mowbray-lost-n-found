import fetch from 'node-fetch';

export default async function handler(req, res) {
  // 處理 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { mode = 'generate', text, imageData, prompt, mimeType } = req.body;
  const API_KEY = process.env.VITE_GEMINI_API_KEY;

  if (!API_KEY) {
    console.error('Missing VITE_GEMINI_API_KEY in environment');
    return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
  }

  try {
    if (mode === 'embed') {
      const { taskType = 'RETRIEVAL_DOCUMENT' } = req.body;

      // 建議：檢查 text 是否存在，避免 Google 回傳 400
      if (!text) {
        return res.status(400).json({ error: 'Text content is required for embedding' });
      }

      const EMBED_MODEL = "gemini-embedding-001";

      // 確保 URL 的格式正確：models/{model_name}:embedContent
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Body 裡的 model 欄位也必須包含 models/ 前綴
            model: `models/${EMBED_MODEL}`,
            content: { parts: [{ text: text }] },
            task_type: taskType
          })
        }
      );

      const result = await response.json();
      if (!response.ok) {
        console.error('[Proxy] Google Embedding API Error:', result);
        return res.status(response.status).json({ error: 'Google API Error', details: result });
      }
      return res.status(200).json(result);
    }

    // Default: generateContent
    const MODEL_NAME = "gemini-1.5-flash-latest"; // Or gemini-2.0-flash-exp if available
    console.log('[Proxy] Generation request');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              imageData ? { inlineData: { mimeType: mimeType || "image/png", data: imageData } } : null
            ].filter(Boolean)
          }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    const result = await response.json();
    if (!response.ok) {
      console.error('[Proxy] Google Generation API Error:', result);
      return res.status(response.status).json({ error: 'Google API Error', details: result });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error('[Proxy] Critical Internal Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}