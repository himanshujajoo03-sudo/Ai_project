// geminiClient.js (Legacy compatibility wrapper forwarding to centralized LLM service)
const { generateStructuredJson, parseJsonFromText } = require('../llm');
const { getGeminiModel } = require('../llm/geminiProvider');
const { isTransientNetworkError, isRateLimitError } = require('../llm/groqProvider');

const MODEL_NAME = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const REQUEST_TIMEOUT_MS = 15000;

function isTransientError(err) {
  return isTransientNetworkError(err) || isRateLimitError(err);
}

module.exports = {
  MODEL_NAME,
  getGeminiModel,
  parseJsonFromModel: parseJsonFromText,
  generateStructuredJson,
  withTimeout: (p, ms) => p,
  isTransientError,
  REQUEST_TIMEOUT_MS,
};