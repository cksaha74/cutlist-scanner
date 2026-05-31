export default async function handler(req, res) {
  // Allow CORS from your app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, imageMime } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured on server. Contact admin.' });
    }

    const prompt = `You are analyzing a handwritten carpenter's cutlist form. Extract ALL rows of data from the image.

The form has these columns:
No, Board Colour, Length, Width, Qty, Edge L, Edge W, Edge Type, Edge Colour, Glass Cutout, Potholes

Extract only the rows that have data filled in. For each row return exactly these fields:
- component: the row number (No column)
- material: the Board Colour value
- length: numeric value only
- width: numeric value only
- qty: numeric value only
- edge_l: Edge L value (number or empty)
- edge_w: Edge W value (number or empty)
- holes: Potholes value (number or empty)

Return ONLY valid JSON in this exact format, no other text:
{
  "rows": [
    {"component": "1", "material": "White", "length": "1860", "width": "600", "qty": "4", "edge_l": "1", "edge_w": "2", "holes": ""},
    ...
  ]
}

Important:
- Only include rows that have actual data (length or width filled in)
- If a cell is empty or unclear, use empty string ""
- Return numbers as strings
- Material/Board Colour: write the full color name as written`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://cutlist-scanner.vercel.app',
        'X-Title': 'CutList Scanner'
      },
      body: JSON.stringify({
        models: [
          'meta-llama/llama-4-maverick:free',
          'google/gemma-4-31b-it:free',
          'mistralai/mistral-small-3.1-24b-instruct:free'
        ],
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${imageMime || 'image/jpeg'};base64,${imageBase64}`
              }
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data.error?.message || data.error || JSON.stringify(data);
      return res.status(response.status).json({ error: `OpenRouter Error: ${msg}` });
    }

    const text = data.choices?.[0]?.message?.content || '';
    if (!text) {
      return res.status(500).json({ error: 'No response from AI model. Please try again.' });
    }

    // Parse JSON from response
    const clean = text.replace(/```json|```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      return res.status(500).json({ error: 'Could not parse AI response. Try again.' });
    }

    const rows = parsed.rows || [];
    if (rows.length === 0) {
      return res.status(400).json({ error: 'No data found in image. Ensure the form has filled rows and good lighting.' });
    }

    return res.status(200).json({ rows });

  } catch (err) {
    console.error('Scan error:', err);
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}
