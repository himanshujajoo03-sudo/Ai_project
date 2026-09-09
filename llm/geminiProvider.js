const { GoogleGenerativeAI } = require('@google/generative-ai');
const { parseJsonFromText } = require('./groqProvider');

const DEFAULT_MODEL = 'gemini-1.5-flash';
const REQUEST_TIMEOUT_MS = 12000;

let geminiClient = null;

function getGeminiModel(modelName = DEFAULT_MODEL) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    const error = new Error('GEMINI_API_KEY is not set');
    error.status = 401;
    throw error;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient.getGenerativeModel({ model: modelName });
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Gemini request timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Call Gemini and return parsed JSON.
 * @param {string} systemPrompt
 * @param {string} userContent
 * @param {object} [options]
 * @returns {Promise<{ data: object, provider: string, model: string }>}
 */
async function generateWithGemini(systemPrompt, userContent, options = {}) {
  const modelName = options.model || process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const agentName = options.agent || 'Unknown';

  console.log(`[LLM] Provider: Gemini`);
  console.log(`[LLM] Model: ${modelName}`);
  console.log(`[LLM] Agent: ${agentName}`);

  const fullPrompt = `${systemPrompt}\n\n${userContent}`;
  const model = getGeminiModel(modelName);

  try {
    const result = await withTimeout(
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      }),
      REQUEST_TIMEOUT_MS
    );

    const text = result.response.text();
    const parsedData = parseJsonFromText(text);
    console.log(`[LLM] Success`);
    return {
      data: parsedData,
      provider: 'gemini',
      model: modelName,
    };
  } catch (err) {
    console.error(`[LLM] Gemini request failed: ${err.status || err.message}`);
    console.log(`[LLM] Switching to fallback`);
    throw err;
  }
}

module.exports = {
  generateWithGemini,
  getGeminiModel,
};
