import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const groqApiKey = process.env.GROQ_API_KEY;
if (!groqApiKey || groqApiKey === 'YOUR_GROQ_API_KEY_HERE') {
  console.error('❌ Error: GROQ_API_KEY is not configured in your .env file.');
  process.exit(1);
}

async function getModels() {
  try {
    console.log('🛰️ Querying list of active models from Groq LPU API...');
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API failure: ${errText}`);
    }

    const data = await response.json();
    console.log('✅ Available Groq Models:');
    
    // Sort and filter models that are active
    const models = data.data || [];
    console.log('\n--- ALL MODELS ---');
    models.forEach(m => {
      console.log(`- ID: ${m.id} (Owned by: ${m.owned_by || 'unknown'})`);
    });

    console.log('\n--- RECOMMENDED VISION MODELS ---');
    const visionModels = models.filter(m => m.id.toLowerCase().includes('vision'));
    if (visionModels.length > 0) {
      visionModels.forEach(m => {
        console.log(`🌟 ID: ${m.id}`);
      });
    } else {
      console.log('No model names matching "vision" found. Checking full model list.');
    }
  } catch (error) {
    console.error('❌ Failed to retrieve Groq models:', error.message);
  }
}

getModels();
