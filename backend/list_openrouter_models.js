async function getOpenRouterModels() {
  try {
    console.log('🛰️ Querying list of active models from OpenRouter API...');
    const response = await fetch('https://openrouter.ai/api/v1/models');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const models = data.data || [];
    
    console.log(`✅ Loaded ${models.length} models from OpenRouter!`);

    console.log('\n--- RECOMMENDED VISION MODELS ---');
    const vision = models.filter(m => 
      m.id.toLowerCase().includes('vision') || 
      m.id.toLowerCase().includes('gemini-2.5-flash') ||
      m.id.toLowerCase().includes('claude-3.5-sonnet')
    );
    
    // Sort vision models by a custom relevance / popularity ranking or pricing
    vision.slice(0, 20).forEach(m => {
      console.log(`🌟 ID: ${m.id}\n   Name: ${m.name}\n   Context: ${m.context_length} tokens\n   Pricing: Prompt: $${(m.pricing.prompt * 1000000).toFixed(2)}/M | Completion: $${(m.pricing.completion * 1000000).toFixed(2)}/M\n`);
    });

    console.log('\n--- RECOMMENDED REASONING / TEXT MODELS ---');
    const reasoning = models.filter(m => 
      m.id.toLowerCase().includes('deepseek-r1') || 
      m.id.toLowerCase().includes('deepseek/deepseek-chat') || 
      m.id.toLowerCase().includes('llama-3.3-70b')
    );
    reasoning.forEach(m => {
      console.log(`🧠 ID: ${m.id}\n   Name: ${m.name}\n   Pricing: Prompt: $${(m.pricing.prompt * 1000000).toFixed(2)}/M | Completion: $${(m.pricing.completion * 1000000).toFixed(2)}/M\n`);
    });
  } catch (error) {
    console.error('❌ Failed to retrieve OpenRouter models:', error.message);
  }
}

getOpenRouterModels();
