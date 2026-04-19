import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '@/lib/logger';

// Build list of available API keys for failover
const API_KEYS = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].filter(
  (k) => k && k !== 'your_gemini_api_key_here'
);

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

function isRetryableGeminiError(error) {
  return isRateLimitError(error) || isServiceUnavailableError(error);
}

// Try generating content with a single key, with retries
async function tryWithKey(apiKey, prompt, retries = 2) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      if (isRetryableGeminiError(error) && attempt < retries) {
        const delay = (attempt + 1) * 2000;
        logger.warn(
          { key: apiKey.slice(-6), attempt: attempt + 1, retries, delay },
          'API key temporarily unavailable, retrying'
        );
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw error;
      }
    }
  }
}

// Try all available API keys with failover
export async function generateWithFailover(prompt) {
  if (API_KEYS.length === 0) {
    return null; // No keys — caller should return mock
  }

  let lastError = null;
  for (let i = 0; i < API_KEYS.length; i++) {
    try {
      logger.debug({ keyIndex: i + 1, totalKeys: API_KEYS.length }, 'Trying Gemini API key');
      return await tryWithKey(API_KEYS[i], prompt);
    } catch (error) {
      lastError = error;
      if (isRetryableGeminiError(error) && i < API_KEYS.length - 1) {
        logger.warn({ exhaustedKey: i + 1, nextKey: i + 2 }, 'API key exhausted, switching');
      } else if (i < API_KEYS.length - 1) {
        logger.warn({ failedKey: i + 1, nextKey: i + 2, err: error }, 'API key failed, trying next');
      }
    }
  }
  throw lastError;
}

export function hasApiKeys() {
  return API_KEYS.length > 0;
}

// Parse AI response text into JSON
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
