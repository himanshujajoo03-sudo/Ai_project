const { generateWithGroq, parseJsonFromText, isRateLimitError } = require('./groqProvider');
const { generateWithGemini } = require('./geminiProvider');

/**
 * Get active provider name from environment.
 * Supported: 'groq' | 'gemini' | 'openrouter' | 'fallback'
 * Defaults to 'groq'.
 */
function getActiveProvider() {
  return (process.env.LLM_PROVIDER || 'groq').toLowerCase();
}

/**
 * Check if the active provider is configured with credentials.
 */
function isProviderConfigured(provider = getActiveProvider()) {
  if (provider === 'groq') {
    const key = process.env.GROQ_API_KEY;
    return Boolean(key && key !== 'your_groq_api_key' && key.trim() !== '');
  }
  if (provider === 'gemini') {
    const key = process.env.GEMINI_API_KEY;
    return Boolean(key && key.trim() !== '');
  }
  return false;
}

/**
 * Centralized function to generate structured JSON using the active provider.
 * Follows provider abstraction: Groq -> Gemini -> Fallback.
 *
 * @param {string} systemPrompt
 * @param {string} userContent
 * @param {object} [options]
 * @param {string} [options.agent] - Name of the calling agent (for logging).
 * @param {string} [options.provider] - Explicit override of provider.
 * @param {string} [options.model] - Explicit override of model.
 * @returns {Promise<object>} Parsed JSON data.
 */
async function generateStructuredJson(systemPrompt, userContent, options = {}) {
  const provider = options.provider || getActiveProvider();

  if (provider === 'fallback') {
    const err = new Error('Explicit fallback requested');
    err.isFallbackOnly = true;
    throw err;
  }

  if (provider === 'groq') {
    const result = await generateWithGroq(systemPrompt, userContent, options);
    return result.data;
  }

  if (provider === 'gemini') {
    const result = await generateWithGemini(systemPrompt, userContent, options);
    return result.data;
  }

  throw new Error(`Unsupported LLM provider: ${provider}`);
}

/**
 * High-level helper that executes an agent task with automatic deterministic fallback.
 * Returns { data, status: { provider, available, reason } }.
 *
 * @param {string} systemPrompt
 * @param {string} userContent
 * @param {Function} fallbackFn - Deterministic fallback function returning fallback data.
 * @param {object} [options]
 * @returns {Promise<{ data: object, status: { provider: string, available: boolean, reason?: string } }>}
 */
async function executeWithFallback(systemPrompt, userContent, fallbackFn, options = {}) {
  const provider = options.provider || getActiveProvider();
  try {
    const data = await generateStructuredJson(systemPrompt, userContent, options);
    return {
      data,
      status: {
        provider,
        available: true,
      },
    };
  } catch (err) {
    let reason = 'error';
    if (err.isRateLimit || isRateLimitError(err)) {
      reason = 'rate_limit';
    } else if (err.isTimeout) {
      reason = 'timeout';
    } else if (err.isMissingKey) {
      reason = 'unconfigured';
    } else {
      reason = err.message || 'unknown_error';
    }

    const fallbackData = await fallbackFn(err);
    return {
      data: fallbackData,
      status: {
        provider: 'fallback',
        available: false,
        reason,
      },
    };
  }
}

module.exports = {
  generateStructuredJson,
  executeWithFallback,
  getActiveProvider,
  isProviderConfigured,
  parseJsonFromText,
};
