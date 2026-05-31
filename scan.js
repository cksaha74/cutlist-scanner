export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageBase64, imageMime } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key not configured on server.' });

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

Return ONLY valid JSON, no other text, no markdown:
{"rows":[{"component":"1","material":"White","length":"1860","width":"600","qty":"4","edge_l":"1","edge_w":"2","holes":""}]}

Rules:
- Only rows with actual data (length or width filled in)
- Empty cells = empty string ""
- Numbers as strings
- Write full color name as written in the form`;

    // Try each model one by one until one works
    const models = [
      'google/gemma-4-31b-it:free',
      'meta-llama/llama-4-scout:free',
      'meta-llama/llama-4-maverick:free',
      'mistralai/mistral-small-3.1-24b-instruct:free',
      'deepseek/deepseek-v4-flash:free'
    ];

    let lastError = '';
    let rows = null;

    for (const model of models) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://cutlist-scanner.vercel.app',
            'X-Title': 'CutList Scanner'
          },
          body: JSON.stringify({
            model: model,
            max_tokens: 2000,
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: `data:${imageMime || 'image/jpeg'};base64,${imageBase64}` }
                },
                { type: 'text', text: prompt }
              ]
            }]
          })
        });

        const data = await response.json();

        if (!response.ok) {
          lastError = `${model}: ${data.error?.message || JSON.stringify(data.error)}`;
          continue; // try next model
        }

        const text = data.choices?.[0]?.message?.content || '';
        if (!text) {
          lastError = `${model}: empty response`;
          continue;
        }

        // Parse JSON
        const clean = text.replace(/```json|```/g, '').trim();
        const startIdx = clean.indexOf('{');
        const endIdx = clean.lastIndexOf('}');
        if (startIdx === -1 || endIdx === -1) {
          lastError = `${model}: no JSON found`;
          continue;
        }

        const jsonStr = clean.substring(startIdx, endIdx + 1);
        const parsed = JSON.parse(jsonStr);
        rows = parsed.rows || [];

        if (rows.length > 0) {
          // Success! Return with the model that worked
          return res.status(200).json({ rows, model_used: model });
        } else {
          lastError = `${model}: no rows found`;
          continue;
        }

      } catch (modelErr) {
        lastError = `${model}: ${modelErr.message}`;
        continue;
      }
    }

    // All models failed
    return res.status(500).json({
      error: `All free models unavailable. Last error: ${lastError}. Please try again in a few minutes or upgrade to paid plan.`
    });

  } catch (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}
