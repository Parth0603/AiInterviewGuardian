import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Load environmental variables from parent directory .env
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// Set body size limit to 10MB to accommodate base64 high-res webcam snapshots
app.use(express.json({ limit: '10mb' }));

// Initialize Google Gen AI
let ai = null;

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
  console.warn('⚠️ WARNING: GEMINI_API_KEY is missing or holds placeholder value in .env.');
  console.warn('⚡ Gemini service will be bypassed. System will rely entirely on Groq LPU failover.');
} else {
  try {
    ai = new GoogleGenAI({ apiKey });
    console.log('✅ Gemini API client successfully initialized.');
  } catch (error) {
    console.error('❌ Failed to initialize Google Gen AI client:', error);
  }
}

// REST status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    gemini_active: !!ai,
    groq_active: !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'YOUR_GROQ_API_KEY_HERE'),
    grok_active: !!(process.env.XAI_API_KEY && process.env.XAI_API_KEY !== 'YOUR_XAI_API_KEY_HERE'),
    openrouter_active: !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'YOUR_OPENROUTER_API_KEY_HERE'),
    timestamp: new Date().toISOString()
  });
});

// Helper: Calls Groq LPU Inference Engine using Llama 4 Scout Vision model
async function callGroqFailover(base64Data, mimeType) {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey || groqApiKey === 'YOUR_GROQ_API_KEY_HERE') {
    throw new Error('GROQ_API_KEY_UNAVAILABLE');
  }

  console.log('🛰️ Initiating Llama 4 Scout Vision on Groq LPU Core...');

  // Format base64 image URL for Groq API
  const imageUrl = `data:${mimeType};base64,${base64Data}`;

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

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
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
    throw new Error(`Groq API failure: ${errText}`);
  }

  const completion = await response.json();
  const rawText = completion.choices[0].message.content;
  
  // Parse structured JSON
  const parsed = JSON.parse(rawText.trim());
  
  // Inject explicit failover warning indicator
  parsed.warnings = [
    ...(parsed.warnings || []),
    'FAILOVER ACTIVE: Powered by Groq LPU (Llama 4 Scout Vision)'
  ];
  
  return parsed;
}

// Helper: Calls xAI Grok API using grok-2-vision-latest model
async function callGrokFailover(base64Data, mimeType) {
  const xaiApiKey = process.env.XAI_API_KEY;
  if (!xaiApiKey || xaiApiKey === 'YOUR_XAI_API_KEY_HERE') {
    throw new Error('XAI_API_KEY_UNAVAILABLE');
  }

  console.log('🛰️ Initiating Grok Vision on xAI Core...');

  // Format base64 image URL for xAI API
  const imageUrl = `data:${mimeType};base64,${base64Data}`;

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
  
  // Parse structured JSON
  const parsed = JSON.parse(rawText.trim());
  
  // Inject explicit failover warning indicator
  parsed.warnings = [
    ...(parsed.warnings || []),
    'FAILOVER ACTIVE: Powered by xAI Grok (Grok Vision)'
  ];
  
  return parsed;
}

// Helper: Calls OpenRouter API using Gemini 2.5 Flash (or chosen vision model)
async function callOpenRouterFailover(base64Data, mimeType) {
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterApiKey || openRouterApiKey === 'YOUR_OPENROUTER_API_KEY_HERE') {
    throw new Error('OPENROUTER_API_KEY_UNAVAILABLE');
  }

  const model = process.env.OPENROUTER_VISION_MODEL || 'google/gemini-2.5-flash';
  console.log(`🛰️ Initiating OpenRouter Failover using model ${model}...`);

  // Format base64 image URL for OpenRouter API
  const imageUrl = `data:${mimeType};base64,${base64Data}`;

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
  
  // Parse structured JSON
  const parsed = JSON.parse(rawText.trim());
  
  // Inject explicit failover warning indicator
  parsed.warnings = [
    ...(parsed.warnings || []),
    `FAILOVER ACTIVE: Powered by OpenRouter (${model})`
  ];
  
  return parsed;
}

// REST analyze endpoint
app.post('/api/analyze', async (req, res) => {
  const { image } = req.body;

  try {
    if (!image) {
      return res.status(400).json({ error: 'Webcam snapshot image payload (base64) is required.' });
    }

    // Parse base64 parts
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    }

    // Phase 1: Try Gemini if initialized
    if (ai) {
      try {
        console.log(`📸 Querying Gemini: size=${base64Data.length} bytes, format=${mimeType}`);

        const prompt = `Assess candidate telemetry from this frame. Be extremely concise.
Evaluate:
1. Confidence (posture, calm facial features)
2. Attention (facing forward, eyes alert)
3. Gaze (alignment to lens)
4. Emotion (dominant micro-expression)`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            prompt,
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                confidence: { 
                  type: 'STRING', 
                  description: 'Confidence assessment statement. Strict max 4 words.' 
                },
                confidence_score: { 
                  type: 'INTEGER', 
                  description: 'Overall calculated confidence score from 0 to 100.' 
                },
                attention: { 
                  type: 'STRING', 
                  description: 'Attentiveness statement. Strict max 4 words.' 
                },
                attention_score: { 
                  type: 'INTEGER', 
                  description: 'Calculated attention/focus score from 0 to 100.' 
                },
                eye_contact: { 
                  type: 'STRING', 
                  description: 'Eye-gaze direction statement. Strict max 4 words.' 
                },
                eye_contact_score: { 
                  type: 'INTEGER', 
                  description: 'Calculated eye-contact percentage score from 0 to 100.' 
                },
                emotion: { 
                  type: 'STRING', 
                  description: 'The dominant emotion or micro-expression. Single word.' 
                },
                warnings: { 
                  type: 'ARRAY', 
                  items: { type: 'STRING' }, 
                  description: 'List active environmental threats (lighting, framing). Short items.' 
                },
                summary: { 
                  type: 'STRING', 
                  description: 'Consolidated strategic coaching tip. Strict max 15 words.' 
                }
              },
              required: [
                'confidence', 
                'confidence_score', 
                'attention', 
                'attention_score', 
                'eye_contact', 
                'eye_contact_score', 
                'emotion', 
                'warnings', 
                'summary'
              ]
            }
          }
        });

        const analysisResult = JSON.parse(response.text);
        console.log('🤖 Real Gemini Live analysis complete:', analysisResult);
        analysisResult.api_source = 'Google Gemini 2.5 Flash';
        return res.json(analysisResult);

      } catch (geminiError) {
        console.warn('⚠️ Gemini Analysis failed. Routing to Groq LPU failover...', geminiError.message);
      }
    } else {
      console.warn('⚠️ Gemini client not initialized. Routing directly to Groq LPU failover...');
    }

    // Phase 2: Groq Failover Routine
    try {
      const groqResult = await callGroqFailover(base64Data, mimeType);
      console.log('✅ Groq LPU Failover completed successfully:', groqResult);
      groqResult.api_source = 'Groq LPU (Llama 4 Scout)';
      return res.json(groqResult);
    } catch (groqError) {
      console.warn('⚠️ Groq LPU Analysis failed. Routing to OpenRouter failover...', groqError.message);
    }

    // Phase 3: OpenRouter Failover Routine
    try {
      const openRouterResult = await callOpenRouterFailover(base64Data, mimeType);
      console.log('✅ OpenRouter Failover completed successfully:', openRouterResult);
      openRouterResult.api_source = `OpenRouter (${process.env.OPENROUTER_VISION_MODEL || 'Gemini 2.5 Flash'})`;
      return res.json(openRouterResult);
    } catch (openRouterError) {
      console.warn('⚠️ OpenRouter Analysis failed. Routing to xAI Grok failover...', openRouterError.message);
    }

    // Phase 4: xAI Grok Failover Routine
    try {
      const grokResult = await callGrokFailover(base64Data, mimeType);
      console.log('✅ xAI Grok Failover completed successfully:', grokResult);
      grokResult.api_source = 'xAI Grok (Grok 2 Vision)';
      return res.json(grokResult);
    } catch (grokError) {
      console.error('❌ xAI Grok Failover failed or key missing:', grokError.message);
      
      // All active live AI services are exhausted or unavailable - trigger strict hard lockdown
      return res.status(429).json({ 
        error: 'QUOTA_EXHAUSTED', 
        message: 'All integrated live AI services (Gemini, Groq LPU, OpenRouter, and xAI Grok) are exhausted, decommissioned, or incorrect.' 
      });
    }

  } catch (error) {
    console.error('❌ General frame analysis processor error:', error);
    return res.status(500).json({ 
      error: 'Failed to process visual frame analysis.', 
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 AI Interview Guardian server running on http://localhost:${PORT}`);
});
