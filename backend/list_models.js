import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
  console.warn('⚠️ No active API key found.');
  process.exit(0);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
  try {
    console.log('🛰️ Querying list of available models for your API key...');
    const response = await ai.models.list();
    console.log('✅ Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('❌ Failed to retrieve models:', error);
  }
}

listModels();
