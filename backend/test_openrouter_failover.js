import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const openRouterApiKey = process.env.OPENROUTER_API_KEY;
if (!openRouterApiKey || openRouterApiKey === 'YOUR_OPENROUTER_API_KEY_HERE') {
  console.error('❌ Error: OPENROUTER_API_KEY is not configured in your .env file.');
  process.exit(1);
}

const model = process.env.OPENROUTER_VISION_MODEL || 'google/gemini-2.5-flash';

// Standard 5x5 transparent PNG base64 payload
const mockBase64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';

async function testOpenRouterFailover() {
  console.log(`🛰️ Testing direct call to OpenRouter API with ${model}...`);
  const prompt = `Assess candidate telemetry from this frame. Be extremely concise.
Evaluate and return a structured JSON response matching this EXACT schema:
{
  "confidence": "Confidence assessment statement (Strict max 4 words)",
  "confidence_score": 0-100,
  "attention": "Attentiveness statement (Strict max 4 words)",
  "attention_score": 0-100,
  "eye_contact": "Eye-gaze direction statement (Strict max 4 words)",
  "eye_contact_score": 0-100,
  "emotion": "Single word micro-expression (e.g. Calm, Nervous, Engaged, Neutral)",
  "warnings": ["active environmental threats (e.g. low lighting)"],
  "summary": "Consolidated strategic coaching tip (strict max 15 words)"
}

Return raw JSON only matching the schema structure. Do not wrap in markdown or codeblocks.`;

  const imageUrl = `data:image/png;base64,${mockBase64Image}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-interview-guardian.com',
        'X-Title': 'AI Interview Guardian'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API failure: ${errText}`);
    }

    const completion = await response.json();
    const rawText = completion.choices[0].message.content;
    console.log('✅ OpenRouter Response Received Successfully!');
    console.log('Response Content:\n', JSON.stringify(JSON.parse(rawText.trim()), null, 2));
  } catch (error) {
    console.error('❌ OpenRouter Direct Test Failed:', error.message);
  }
}

testOpenRouterFailover();
