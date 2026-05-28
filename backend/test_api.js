import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

console.log('🔑 API KEY CONFIGURED:', !!process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY) {
  console.log('🔑 API KEY PREFIX:', process.env.GEMINI_API_KEY.substring(0, 8) + '...');
}

if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
  console.warn('⚠️ No active API key found. Diagnostics aborted.');
  process.exit(0);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testCall() {
  try {
    console.log('🛰️ Querying Gemini 2.5 Flash...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Say hello in 5 words.'
    });
    console.log('✅ Response Text:', response.text);
  } catch (error) {
    console.error('❌ API CALL FAILED:', error);
  }
}

testCall();
