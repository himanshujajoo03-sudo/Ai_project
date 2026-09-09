const Groq = require('groq-sdk');

const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const REQUEST_TIMEOUT_MS = 15000;

let groqClient = null;

/**
 * Get or initialize the Groq client instance.
 * @returns {Groq}
 */
function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key' || apiKey.trim() === '') {
    const error = new Error('GROQ_API_KEY is not set or contains placeholder value');
    error.status = 401;
    error.isMissingKey = true;
    throw error;
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

/**
 * Strips markdown code fences (```json ... ```) or extracts JSON substring.
 * @param {string} text - Raw model response.
 * @returns {object} Parsed JSON.
 */
function parseJsonFromText(text) {
  if (typeof text !== 'string') {
    throw new Error('Response is not a string');
  }

  // First try extracting from markdown fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenceMatch ? fenceMatch[1].trim() : text.trim();

  // Try direct parse
  try {
    return JSON.parse(candidate);
  } catch (initialErr) {
    // Attempt to locate first '{' and last '}'
    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonSubstring = candidate.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonSubstring);
    }
    throw initialErr;
  }
}

/**
 * Race a promise against a timeout.
 * @param {Promise} promise
 * @param {number} ms
 * @returns {Promise}
 */
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`Request timed out after ${ms}ms`);
      err.isTimeout = true;
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Check whether an error is a rate limit or quota exhaustion (429).
 * @param {any} err
 * @returns {boolean}
 */
function isRateLimitError(err) {
  if (!err) return false;
  if (err.status === 429) return true;
  const message = String(err.message || '').toLowerCase();
  return (
    message.includes('429') ||
    message.includes('rate_limit') ||
    message.includes('rate limit') ||
    message.includes('quota') ||
    message.includes('tokens per day') ||
    message.includes('requests per day') ||
    message.includes('tpm') ||
    message.includes('rpm')
  );
}

/**
 * Check whether an error is transient (e.g. 5xx, network drops, timeouts).
 * Rate limit errors (429) are handled separately.
 * @param {any} err
 * @returns {boolean}
 */
function isTransientNetworkError(err) {
  if (!err) return false;
  if (err.isTimeout) return true;
  if (err.name === 'AbortError') return true;
  const status = err.status;
  if (typeof status === 'number' && [500, 502, 503, 504].includes(status)) {
    return true;
  }
  const message = String(err.message || '').toLowerCase();
  return (
    message.includes('timeout') ||
    message.includes('econnreset') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('fetch failed') ||
    message.includes('network error')
  );
}

/**
 * Call Groq chat completion and return parsed JSON.
 * Follows retry policy:
 * - 429: immediate fallback, NO retry.
 * - 5xx/network: maximum 1 retry with short backoff.
 *
 * @param {string} systemPrompt
 * @param {string} userContent
 * @param {object} [options]
 * @param {string} [options.agent] - Name of the calling agent (for logging).
 * @param {string} [options.model] - Override model if needed.
 * @returns {Promise<{ data: object, provider: string, model: string }>}
 */
async function generateWithGroq(systemPrompt, userContent, options = {}) {
  const model = options.model || process.env.GROQ_MODEL || DEFAULT_MODEL;
  const agentName = options.agent || 'Unknown';

  console.log(`[LLM] Provider: Groq`);
  console.log(`[LLM] Model: ${model}`);
  console.log(`[LLM] Agent: ${agentName}`);

  const client = getGroqClient();

  const messages = [
    {
      role: 'system',
      content: `${systemPrompt}\nIMPORTANT: You must respond ONLY with valid JSON. Do not include any text, greetings, explanations, or code outside the JSON object.`,
    },
    {
      role: 'user',
      content: userContent,
    },
  ];

  const makeCall = async () => {
    return await withTimeout(
      client.chat.completions.create({
        model,
        messages,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
      REQUEST_TIMEOUT_MS
    );
  };

  try {
    const response = await makeCall();
    const content = response.choices?.[0]?.message?.content || '';
    const parsedData = parseJsonFromText(content);
    console.log(`[LLM] Success`);
    return {
      data: parsedData,
      provider: 'groq',
      model,
    };
  } catch (err) {
    // Check if 429 / rate limit -> immediate fallback, no retries
    if (isRateLimitError(err)) {
      console.error(`[LLM] Groq request failed: 429 (Rate limit/quota exceeded)`);
      console.log(`[LLM] Switching to fallback`);
      const error = new Error('Groq rate limit exceeded (429)');
      error.status = 429;
      error.isRateLimit = true;
      throw error;
    }

    // Check if transient network/5xx -> maximum 1 retry with short backoff
    if (isTransientNetworkError(err)) {
      console.warn(`[LLM] Groq transient error (${err.message}). Retrying once after 500ms...`);
      await new Promise((r) => setTimeout(r, 500));
      try {
        const response = await makeCall();
        const content = response.choices?.[0]?.message?.content || '';
        const parsedData = parseJsonFromText(content);
        console.log(`[LLM] Success`);
        return {
          data: parsedData,
          provider: 'groq',
          model,
        };
      } catch (retryErr) {
        console.error(`[LLM] Groq request failed after retry: ${retryErr.status || retryErr.message}`);
        console.log(`[LLM] Switching to fallback`);
        throw retryErr;
      }
    }

    // Any other error (401 invalid key, missing key, JSON parse error, etc.) -> immediate fallback
    console.error(`[LLM] Groq request failed: ${err.status || err.message}`);
    console.log(`[LLM] Switching to fallback`);
    throw err;
  }
}

module.exports = {
  generateWithGroq,
  getGroqClient,
  parseJsonFromText,
  isRateLimitError,
  isTransientNetworkError,
  DEFAULT_MODEL,
};
