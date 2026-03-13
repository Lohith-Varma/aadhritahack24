require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function diagnose() {
  console.log('\n🔍 Loom — Gemini API Diagnostics\n' + '─'.repeat(40));

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error('❌  GEMINI_API_KEY is missing from your .env file');
    console.log('    Fix: Add  GEMINI_API_KEY=your_key_here  to server/.env');
    return;
  }
  if (key === 'your_gemini_api_key_here') {
    console.error('❌  GEMINI_API_KEY is still the placeholder value');
    console.log('    Fix: Replace it with your real key from https://aistudio.google.com/apikey');
    return;
  }
  if (!key.startsWith('AI')) {
    console.warn('⚠️   Key does not start with "AI" — may be invalid');
  }
  console.log(`✅  Key found: ${key.slice(0, 8)}${'*'.repeat(20)} (${key.length} chars)`);

  let ai;
  try {
    ai = new GoogleGenAI({ apiKey: key });
    console.log('✅  GoogleGenAI client created');
  } catch (e) {
    console.error('❌  Failed to create GoogleGenAI client:', e.message);
    console.log('    Fix: npm install @google/genai');
    return;
  }

  console.log('\n⏳  Sending test prompt to gemini-2.0-flash...\n');
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Reply with exactly: {"status":"ok"}',
    });
    const text = response.text.trim();
    console.log('✅  Response received:', text);
    console.log('\n🎉  Gemini API is working correctly!\n');
  } catch (e) {
    console.error('❌  API call failed');
    console.log('\n📋  Error details:');
    console.log('    Message:', e.message);
    console.log('    Status: ', e.status  || 'N/A');
    console.log('    Code:   ', e.code    || 'N/A');
    console.log('\n💡  Likely cause based on error:');

    const msg = e.message?.toLowerCase() || '';

    if (msg.includes('api key not valid') || msg.includes('api_key_invalid')) {
      console.log('    → Your API key is INVALID or has been revoked.');
      console.log('    → Go to https://aistudio.google.com/apikey and generate a new one.');
    } else if (msg.includes('location') || msg.includes('not supported')) {
      console.log('    → Your LOCATION (India) may not be supported by the free tier.');
      console.log('    → Fix: Use a VPN OR switch to gemini-1.5-flash model.');
      console.log('    → Or: Enable billing at https://console.cloud.google.com/billing');
    } else if (msg.includes('quota') || msg.includes('429')) {
      console.log('    → You have hit the RATE LIMIT (free tier = 15 req/min).');
      console.log('    → Wait 60 seconds and try again.');
    } else if (msg.includes('not found') || msg.includes('404')) {
      console.log('    → Model name is invalid or not available in your region.');
      console.log('    → Try changing to: gemini-1.5-flash');
    } else if (msg.includes('econnrefused') || msg.includes('network') || msg.includes('fetch')) {
      console.log('    → NETWORK ERROR — cannot reach Google servers.');
      console.log('    → Check your internet connection or try a VPN.');
    } else if (msg.includes('permission') || msg.includes('403')) {
      console.log('    → API key does not have permission for Gemini API.');
      console.log('    → Enable it at https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
    }
    console.log('');
  }
}

diagnose();
