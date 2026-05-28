import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const xaiApiKey = process.env.XAI_API_KEY;
if (!xaiApiKey || xaiApiKey === 'YOUR_XAI_API_KEY_HERE') {
  console.error('❌ Error: XAI_API_KEY is not configured in your .env file.');
  process.exit(1);
}

// Minimal 2x2 transparent PNG base64 payload
const mockBase64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD7qdMQAAAAD0lEQVR42mP8z8AARAwDABi1AwGKo58GAAAAAElFTkSuQmCC';

async function testGrokFailover() {
  console.log('🛰&nbsp;Testing direct call to xAI Grok API with grok-2-vision-latest model...');
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
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${xaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-2-vision-latest',
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
      throw new Error(`xAI Grok API failure: ${errText}`);
    }

    const completion = await response.json();
    const rawText = completion.choices[0].message.content;
    console.log('✅ xAI Grok Response Received Successfully!');
    console.log('Response Content:\n', JSON.stringify(JSON.parse(rawText.trim()), null, 2));
  } catch (error) {
    console.error('❌ xAI Grok Direct Test Failed:', error.message);
  }
}

testGrokFailover();
