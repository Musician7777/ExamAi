import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import logger from '@/lib/logger';
import { CACHE_TTL, cacheGet, cacheSet } from '@/lib/services/redisCacheService';

// ─── NVIDIA (first priority) ────────────────────────────────────────────────
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = 'openai/gpt-oss-120b';

// ─── Gemini (fallback) ───────────────────────────────────────────────────────
const GEMINI_KEYS = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].filter(
  (k) => k && k !== 'your_gemini_api_key_here'
);

// ─── Error helpers ───────────────────────────────────────────────────────────
export function isRateLimitError(error) {
  return (
    error?.status === 429 ||
    error?.message?.includes('429') ||
    error?.message?.includes('Resource has been exhausted') ||
    error?.message?.includes('quota')
  );
}

export function isServiceUnavailableError(error) {
  return (
    error?.status === 503 ||
    error?.statusText === 'Service Unavailable' ||
    error?.message?.includes('503') ||
    error?.message?.includes('Service Unavailable') ||
    error?.message?.includes('high demand')
  );
}

function isRetryableError(error) {
  return isRateLimitError(error) || isServiceUnavailableError(error);
}

// ─── Wrap any text string in the standard { response: { text() } } shape ────
function wrapText(text) {
  return { response: { text: () => text } };
}

// ─── NVIDIA provider ─────────────────────────────────────────────────────────
async function tryWithNvidia(prompt, retries = 2) {
  if (!NVIDIA_API_KEY) throw new Error('NVIDIA_API_KEY not configured');

  const client = new OpenAI({ apiKey: NVIDIA_API_KEY, baseURL: NVIDIA_BASE_URL });

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      logger.debug({ attempt: attempt + 1 }, '[NVIDIA] Calling API');

      const completion = await client.chat.completions.create({
        model: NVIDIA_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful AI assistant. Always respond with valid JSON when the user asks for structured data.',
          },
          { role: 'user', content: typeof prompt === 'string' ? prompt : JSON.stringify(prompt) },
        ],
        temperature: 0.7,
        top_p: 1,
        max_tokens: 4096,
        stream: false,
      });

      const text = completion.choices[0]?.message?.content || '';
      logger.debug({ chars: text.length }, '[NVIDIA] Response received');
      return wrapText(text);
    } catch (error) {
      if (isRetryableError(error) && attempt < retries) {
        const delay = (attempt + 1) * 2000;
        logger.warn({ attempt: attempt + 1, retries, delay }, '[NVIDIA] Retryable error, waiting');
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw error;
      }
    }
  }
}

// ─── Gemini provider (fallback) ───────────────────────────────────────────────
async function tryWithGeminiKey(apiKey, prompt, retries = 2) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      // Disable thinking to reduce latency from ~30s to ~5s.
      // Gemini 2.5 Flash runs internal reasoning by default; for structured
      // JSON generation (exams, pathways, configs) reasoning is unnecessary.
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      if (isRetryableError(error) && attempt < retries) {
        const delay = (attempt + 1) * 2000;
        logger.warn(
          { key: apiKey.slice(-6), attempt: attempt + 1, retries, delay },
          '[Gemini] API key temporarily unavailable, retrying'
        );
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw error;
      }
    }
  }
}

// ─── Main failover: NVIDIA → Gemini keys ─────────────────────────────────────
export async function generateWithFailover(prompt, options = {}) {
  const { cacheTTL = CACHE_TTL.EXTENDED, skipCache = false } = options;

  // Cache check
  if (!skipCache && options.cacheKey) {
    const cached = await cacheGet(options.cacheKey);
    if (cached) {
      logger.debug({ key: options.cacheKey }, '[AI] Cache HIT');
      return wrapText(cached);
    }
  }

  if (!NVIDIA_API_KEY && GEMINI_KEYS.length === 0) {
    return null; // No keys at all — caller returns mock
  }

  // Helper: cache & return on success
  async function onSuccess(result) {
    if (!skipCache && options.cacheKey && result) {
      const text = result.response.text();
      await cacheSet(options.cacheKey, text, cacheTTL);
      logger.debug({ key: options.cacheKey, ttl: cacheTTL }, '[AI] Cached response text');
    }
    return result;
  }

  // 1. Try NVIDIA first
  if (NVIDIA_API_KEY) {
    try {
      logger.debug('[AI] Using NVIDIA as primary provider');
      const result = await tryWithNvidia(prompt);
      return await onSuccess(result);
    } catch (error) {
      logger.warn({ err: error?.message }, '[NVIDIA] Failed — falling back to Gemini');
    }
  }

  // 2. Gemini fallback chain
  if (GEMINI_KEYS.length === 0) {
    return null;
  }

  let lastError = null;
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    try {
      logger.debug({ keyIndex: i + 1, totalKeys: GEMINI_KEYS.length }, '[Gemini] Trying key');
      const result = await tryWithGeminiKey(GEMINI_KEYS[i], prompt);
      return await onSuccess(result);
    } catch (error) {
      lastError = error;
      if (i < GEMINI_KEYS.length - 1) {
        logger.warn({ failedKey: i + 1, nextKey: i + 2, err: error?.message }, '[Gemini] Key failed, trying next');
      }
    }
  }
  throw lastError;
}

export function hasApiKeys() {
  return !!(NVIDIA_API_KEY || GEMINI_KEYS.length > 0);
}

// ─── Parse AI response text into JSON ────────────────────────────────────────
export function parseAIResponse(text) {
  try {
    const jsonMatch =
      text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
    return JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : text);
  } catch (e) {
    logger.warn({ err: e }, 'Failed to parse AI response as JSON');
    return { raw: text };
  }
}
