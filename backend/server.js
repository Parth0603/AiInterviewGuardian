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

// Helper: Robustly extracts JSON from a model response (handles markdown code blocks)
function robustJsonParse(rawText) {
  let text = rawText.trim();
  // Strip markdown code blocks if wrapped
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]+?)```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }
  // Try direct parse
  try {
    return JSON.parse(text);
  } catch (e) {
    // Try extracting first { ... } block
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) {
      return JSON.parse(objMatch[0]);
    }
    throw new Error('No valid JSON found in response: ' + text.substring(0, 200));
  }
}

// Helper: Calls Groq LPU — tries llama-4-scout first, falls back to llama-3.2-11b-vision
async function callGroqFailover(base64Data, mimeType) {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey || groqApiKey === 'YOUR_GROQ_API_KEY_HERE') {
    throw new Error('GROQ_API_KEY_UNAVAILABLE');
  }

  const imageUrl = `data:${mimeType};base64,${base64Data}`;
  const prompt = `Assess this interview candidate's webcam frame. Return ONLY raw JSON:
{"confidence":"<max 4 words>","confidence_score":<0-100>,"attention":"<max 4 words>","attention_score":<0-100>,"eye_contact":"<max 4 words>","eye_contact_score":<0-100>,"emotion":"<single word>","warnings":[],"summary":"<max 15 words>"}`;

  // Try primary Groq vision model first, then fallback
  const groqModels = [
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'llama-3.2-11b-vision-preview'
  ];

  let lastErr = null;
  for (const model of groqModels) {
    try {
      console.log(`🛰️ Groq attempt: ${model}`);
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]}],
          response_format: { type: 'json_object' },
          max_tokens: 400,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        lastErr = new Error(`Groq (${model}) failure: ${errText}`);
        console.warn(`⚠️ Groq ${model} failed, trying next...`);
        continue;
      }

      const completion = await response.json();
      const parsed = robustJsonParse(completion.choices[0].message.content);
      parsed.warnings = [...(parsed.warnings || []), `FAILOVER ACTIVE: Groq (${model.split('/').pop()})` ];
      return parsed;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('All Groq models failed');
}

// Helper: Calls xAI Grok API — corrected model: grok-2-vision-1212
async function callGrokFailover(base64Data, mimeType) {
  const xaiApiKey = process.env.XAI_API_KEY;
  if (!xaiApiKey || xaiApiKey === 'YOUR_XAI_API_KEY_HERE') {
    throw new Error('XAI_API_KEY_UNAVAILABLE');
  }

  console.log('🛰️ Initiating Grok Vision on xAI Core...');
  const imageUrl = `data:${mimeType};base64,${base64Data}`;
  const prompt = `Assess this interview candidate's webcam frame. Return ONLY raw JSON:
{"confidence":"<max 4 words>","confidence_score":<0-100>,"attention":"<max 4 words>","attention_score":<0-100>,"eye_contact":"<max 4 words>","eye_contact_score":<0-100>,"emotion":"<single word>","warnings":[],"summary":"<max 15 words>"}`;

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${xaiApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'grok-2-vision-1212',  // Fixed: was grok-2-vision-latest (doesn't exist)
      messages: [{ role: 'user', content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]}],
      response_format: { type: 'json_object' },
      max_tokens: 400,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`xAI Grok API failure: ${errText}`);
  }

  const completion = await response.json();
  const parsed = robustJsonParse(completion.choices[0].message.content);
  parsed.warnings = [...(parsed.warnings || []), 'FAILOVER ACTIVE: Powered by xAI Grok 2 Vision'];
  return parsed;
}

// Helper: Calls OpenRouter API — max_tokens capped at 400 to stay within free credit budget
async function callOpenRouterFailover(base64Data, mimeType) {
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterApiKey || openRouterApiKey === 'YOUR_OPENROUTER_API_KEY_HERE') {
    throw new Error('OPENROUTER_API_KEY_UNAVAILABLE');
  }

  const model = process.env.OPENROUTER_VISION_MODEL || 'google/gemini-2.5-flash-preview-05-20';
  console.log(`🛰️ Initiating OpenRouter Failover using model ${model}...`);
  const imageUrl = `data:${mimeType};base64,${base64Data}`;
  const prompt = `Assess this interview candidate's webcam frame. Return ONLY raw JSON:
{"confidence":"<max 4 words>","confidence_score":<0-100>,"attention":"<max 4 words>","attention_score":<0-100>,"eye_contact":"<max 4 words>","eye_contact_score":<0-100>,"emotion":"<single word>","warnings":[],"summary":"<max 15 words>"}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ai-interview-guardian.com',
      'X-Title': 'AI Interview Guardian'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]}],
      max_tokens: 400,  // Fixed: was defaulting to 65535, only 16000 credits available
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API failure: ${errText}`);
  }

  const completion = await response.json();
  const parsed = robustJsonParse(completion.choices[0].message.content);
  parsed.warnings = [...(parsed.warnings || []), `FAILOVER ACTIVE: Powered by OpenRouter (${model.split('/').pop()})` ];
  return parsed;
}

// REST analyze endpoint — 4-tier failover: Gemini → OpenRouter → Groq → xAI Grok
app.post('/api/analyze', async (req, res) => {
  const { image } = req.body;

  try {
    if (!image) {
      return res.status(400).json({ error: 'Webcam snapshot image payload (base64) is required.' });
    }

    // Parse base64 data URI
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    }

    // Phase 1: Try Gemini (primary) — using gemini-1.5-flash (1500 RPD free vs 20 RPD for 2.5-flash)
    if (ai) {
      try {
        console.log(`📸 Querying Gemini 1.5 Flash: size=${base64Data.length} bytes, format=${mimeType}`);
        const prompt = `You are analyzing a webcam frame from a live job interview. Assess candidate telemetry.
Return ONLY a valid JSON object matching this exact schema:
{
  "confidence": "<max 4 words>",
  "confidence_score": <0-100>,
  "attention": "<max 4 words>",
  "attention_score": <0-100>,
  "eye_contact": "<max 4 words>",
  "eye_contact_score": <0-100>,
  "emotion": "<single word>",
  "warnings": ["<short string>"],
  "summary": "<max 15 words coaching tip>"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',  // 1500 RPD free tier (was gemini-2.5-flash = only 20 RPD)
          contents: [
            prompt,
            { inlineData: { data: base64Data, mimeType: mimeType } }
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                confidence: { type: 'STRING' },
                confidence_score: { type: 'INTEGER' },
                attention: { type: 'STRING' },
                attention_score: { type: 'INTEGER' },
                eye_contact: { type: 'STRING' },
                eye_contact_score: { type: 'INTEGER' },
                emotion: { type: 'STRING' },
                warnings: { type: 'ARRAY', items: { type: 'STRING' } },
                summary: { type: 'STRING' }
              },
              required: ['confidence', 'confidence_score', 'attention', 'attention_score', 'eye_contact', 'eye_contact_score', 'emotion', 'warnings', 'summary']
            }
          }
        });

        const analysisResult = robustJsonParse(response.text);
        console.log('✅ Gemini 1.5 Flash analysis complete');
        analysisResult.api_source = 'Google Gemini 1.5 Flash';
        return res.json(analysisResult);

      } catch (geminiError) {
        console.warn('⚠️ Gemini failed, routing to OpenRouter...', geminiError.message);
      }
    } else {
      console.warn('⚠️ Gemini not initialized, routing to OpenRouter...');
    }

    // Phase 2: OpenRouter (Gemini 2.5 Flash via OpenRouter — best vision model available)
    try {
      const openRouterResult = await callOpenRouterFailover(base64Data, mimeType);
      console.log('✅ OpenRouter Failover succeeded');
      openRouterResult.api_source = `OpenRouter (${process.env.OPENROUTER_VISION_MODEL || 'google/gemini-2.5-flash'})`;
      return res.json(openRouterResult);
    } catch (openRouterError) {
      console.warn('⚠️ OpenRouter failed, routing to Groq LPU...', openRouterError.message);
    }

    // Phase 3: Groq LPU (Llama 4 Scout Vision)
    try {
      const groqResult = await callGroqFailover(base64Data, mimeType);
      console.log('✅ Groq LPU Failover succeeded');
      groqResult.api_source = 'Groq LPU (Llama 4 Scout)';
      return res.json(groqResult);
    } catch (groqError) {
      console.warn('⚠️ Groq LPU failed, routing to xAI Grok...', groqError.message);
    }

    // Phase 4: xAI Grok (last resort vision)
    try {
      const grokResult = await callGrokFailover(base64Data, mimeType);
      console.log('✅ xAI Grok Failover succeeded');
      grokResult.api_source = 'xAI Grok (Grok 2 Vision)';
      return res.json(grokResult);
    } catch (grokError) {
      console.warn('⚠️ All AI APIs temporarily exhausted. Returning local-mode telemetry.');
      // Graceful degraded mode — return a neutral result so the app keeps running
      // The frontend face-api.js still provides local scores; this just fills in the text fields
      return res.json({
        confidence: 'Local tracking active',
        confidence_score: 72,
        attention: 'Continue your session',
        attention_score: 75,
        eye_contact: 'Gaze tracking live',
        eye_contact_score: 70,
        emotion: 'Neutral',
        warnings: ['AI APIs temporarily rate-limited. Local face tracking still active.'],
        summary: 'All AI quotas hit. Local telemetry still running — keep going!',
        api_source: 'Local Mode (API quotas reached)'
      });
    }

  } catch (error) {
    console.error('❌ Frame analysis processor error:', error);
    return res.status(500).json({
      error: 'Failed to process visual frame analysis.',
      details: error.message
    });
  }
});

// REST grade endpoint
app.post('/api/grade', async (req, res) => {
  const { subject, theme, questions, transcripts, telemetryHistory } = req.body;

  if (!subject || !theme || !questions || !transcripts) {
    return res.status(400).json({ error: 'Subject, theme, questions, and transcripts are required for grading.' });
  }

  // Calculate telemetry averages
  let avgComposure = 85;
  let avgFocus = 80;
  let avgGaze = 75;

  if (telemetryHistory && Array.isArray(telemetryHistory) && telemetryHistory.length > 0) {
    const totalComposure = telemetryHistory.reduce((sum, item) => sum + (item.confidence || item.confidence_score || 0), 0);
    const totalFocus = telemetryHistory.reduce((sum, item) => sum + (item.attention || item.attention_score || 0), 0);
    const totalGaze = telemetryHistory.reduce((sum, item) => sum + (item.eyeContact || item.eye_contact_score || 0), 0);

    avgComposure = Math.round(totalComposure / telemetryHistory.length);
    avgFocus = Math.round(totalFocus / telemetryHistory.length);
    avgGaze = Math.round(totalGaze / telemetryHistory.length);
  }

  const prompt = `Analyze the candidate's performance in a mock interview.
Subject: ${subject}
Theme: ${theme}

Questions asked & Candidate's verbal answers:
1. "${questions[0]}" -> Answer: "${transcripts[0] || 'No verbal answer recorded'}"
2. "${questions[1]}" -> Answer: "${transcripts[1] || 'No verbal answer recorded'}"
3. "${questions[2]}" -> Answer: "${transcripts[2] || 'No verbal answer recorded'}"

Telemetry Composure Metrics History (Averaged over the session):
- Average Composure Score: ${avgComposure}%
- Average Focus/Attention Score: ${avgFocus}%
- Average Gaze/Eye Contact Score: ${avgGaze}%

Evaluate and return a structured JSON response matching this EXACT schema:
{
  "overall_tier": "S-Tier | A-Tier | B-Tier | C-Tier",
  "composure_summary": "Thorough critique of composure/telemetry (around 30-50 words)",
  "verbal_summary": "Thorough and deep critique of their verbal answers, subject matter expertise, and technical logic (around 30-50 words)",
  "question_critiques": [
    {
      "question_id": 1,
      "technical_score": 0-100,
      "critique": "A comprehensive, high-fidelity technical and conceptual critique of their answer (approx 60-90 words). Praise what they articulated correctly, detail exactly what technical components, algorithms, structures, or edge cases they missed, and explain why those missing components are critical.",
      "actionable_tip": "A highly specific, step-by-step actionable advice/tip (approx 30-45 words) on what precise API, pattern, structure, or methodology they should study and practice to solve this question perfectly."
    },
    {
      "question_id": 2,
      "technical_score": 0-100,
      "critique": "A comprehensive, high-fidelity technical and conceptual critique of their answer (approx 60-90 words). Praise what they articulated correctly, detail exactly what technical components, algorithms, structures, or edge cases they missed, and explain why those missing components are critical.",
      "actionable_tip": "A highly specific, step-by-step actionable advice/tip (approx 30-45 words) on what precise API, pattern, structure, or methodology they should study and practice to solve this question perfectly."
    },
    {
      "question_id": 3,
      "technical_score": 0-100,
      "critique": "A comprehensive, high-fidelity technical and conceptual critique of their answer (approx 60-90 words). Praise what they articulated correctly, detail exactly what technical components, algorithms, structures, or edge cases they missed, and explain why those missing components are critical.",
      "actionable_tip": "A highly specific, step-by-step actionable advice/tip (approx 30-45 words) on what precise API, pattern, structure, or methodology they should study and practice to solve this question perfectly."
    }
  ]
}

CRITICAL RULES:
- Provide high-quality, professional, and detailed critiques. Ensure each critique is deeply educational, constructive, and explains the underlying concepts clearly so the candidate knows exactly how to level up.
- Evaluate behavioral answers against the STAR structure (Situation, Task, Action, Result) if applicable, and coding/systems/design against technical accuracy and architectural scalability.
- Return raw JSON only matching the schema. Do not wrap in markdown or codeblocks.`;

  // Phase 1: Try Direct Gemini
  if (ai) {
    try {
      console.log('🤖 Routing Grading request to primary Gemini...');
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              overall_tier: { type: 'STRING' },
              composure_summary: { type: 'STRING' },
              verbal_summary: { type: 'STRING' },
              question_critiques: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    question_id: { type: 'INTEGER' },
                    technical_score: { type: 'INTEGER' },
                    critique: { type: 'STRING' },
                    actionable_tip: { type: 'STRING' }
                  },
                  required: ['question_id', 'technical_score', 'critique', 'actionable_tip']
                }
              }
            },
            required: ['overall_tier', 'composure_summary', 'verbal_summary', 'question_critiques']
          }
        }
      });
      const parsed = JSON.parse(response.text);
      parsed.api_source = 'Google Gemini 2.5 Flash';
      return res.json(parsed);
    } catch (geminiError) {
      console.warn('⚠️ Gemini grading failed. Routing to Groq LPU...', geminiError.message);
    }
  }

  // Phase 2: Try Groq (Llama 3.3 70B)
  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey || groqApiKey === 'YOUR_GROQ_API_KEY_HERE') {
      throw new Error('GROQ_API_KEY_UNAVAILABLE');
    }
    console.log('🛰️ Routing Grading request to Groq (Llama 3.3 70B)...');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })
    });
    if (!response.ok) {
      throw new Error(`Groq grading failure: ${await response.text()}`);
    }
    const completion = await response.json();
    const parsed = JSON.parse(completion.choices[0].message.content.trim());
    parsed.api_source = 'Groq LPU (Llama 3.3 70B)';
    return res.json(parsed);
  } catch (groqError) {
    console.warn('⚠️ Groq grading failed. Routing to OpenRouter...', groqError.message);
  }

  // Phase 3: Try OpenRouter (Llama 3.3 70B Instruct or similar)
  try {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey || openRouterApiKey === 'YOUR_OPENROUTER_API_KEY_HERE') {
      throw new Error('OPENROUTER_API_KEY_UNAVAILABLE');
    }
    const textModel = process.env.OPENROUTER_TEXT_MODEL || 'meta-llama/llama-3.3-70b-instruct';
    console.log(`🛰️ Routing Grading request to OpenRouter (${textModel})...`);
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-interview-guardian.com',
        'X-Title': 'AI Interview Guardian'
      },
      body: JSON.stringify({
        model: textModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })
    });
    if (!response.ok) {
      throw new Error(`OpenRouter grading failure: ${await response.text()}`);
    }
    const completion = await response.json();
    const parsed = JSON.parse(completion.choices[0].message.content.trim());
    parsed.api_source = `OpenRouter (${textModel})`;
    return res.json(parsed);
  } catch (openRouterError) {
    console.warn('⚠️ OpenRouter grading failed. Routing to xAI Grok...', openRouterError.message);
  }

  // Phase 4: Try xAI Grok (Grok 2)
  try {
    const xaiApiKey = process.env.XAI_API_KEY;
    if (!xaiApiKey || xaiApiKey === 'YOUR_XAI_API_KEY_HERE') {
      throw new Error('XAI_API_KEY_UNAVAILABLE');
    }
    console.log('🛰️ Routing Grading request to xAI Grok (Grok 2)...');
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${xaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-2-1212',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })
    });
    if (!response.ok) {
      throw new Error(`xAI Grok grading failure: ${await response.text()}`);
    }
    const completion = await response.json();
    const parsed = JSON.parse(completion.choices[0].message.content.trim());
    parsed.api_source = 'xAI Grok (Grok 2)';
    return res.json(parsed);
  } catch (grokError) {
    console.error('❌ xAI Grok grading failed:', grokError.message);
    return res.status(429).json({
      error: 'GRADES_FAILED',
      message: 'All live grading engines are exhausted, down, or unauthorized.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 AI Interview Guardian server running on http://localhost:${PORT}`);
});

export default app;


