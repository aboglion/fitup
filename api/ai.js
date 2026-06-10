module.exports = async function handler(req, res) {
  // Set CORS headers so that client-side can call it if needed
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, systemPrompt } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt parameter' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'GEMINI_API_KEY environment variable is not configured. Please add it in your Vercel Dashboard.' 
    });
  }

  // Define candidate models in priority order
  const models = process.env.GEMINI_MODEL 
    ? [process.env.GEMINI_MODEL] 
    : ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7
        }
      };

      if (systemPrompt) {
        body.systemInstruction = {
          parts: [{ text: systemPrompt }]
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return res.status(200).json({ text });
      }

      const errorText = await response.text();
      console.warn(`Gemini API Error for model ${model}:`, errorText);
      
      let isTemporary = true;
      try {
        const parsed = JSON.parse(errorText);
        const code = parsed.error?.code;
        if (code === 400 || code === 403) {
          isTemporary = false;
        }
      } catch(e) {}

      lastError = { status: response.status, text: errorText };
      if (!isTemporary) {
        break;
      }
    } catch (error) {
      console.error(`Error calling model ${model}:`, error);
      lastError = { status: 500, text: error.message };
    }
  }

  return res.status(lastError?.status || 500).json({ 
    error: `Gemini API error: ${lastError?.text || 'Unknown error'}` 
  });
};
