import { GoogleGenerativeAI } from '@google/generative-ai';

// Build list of available API keys for failover
const API_KEYS = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
].filter(k => k && k !== 'your_gemini_api_key_here');

export function isRateLimitError(error) {
    return error?.status === 429 || 
           error?.message?.includes('429') || 
           error?.message?.includes('Resource has been exhausted') ||
           error?.message?.includes('quota');
}

// Try generating content with a single key, with retries
async function tryWithKey(apiKey, prompt, retries = 2) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
    });

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await model.generateContent(prompt);
        } catch (error) {
            if (isRateLimitError(error) && attempt < retries) {
                const delay = (attempt + 1) * 2000;
                console.log(`Key ${apiKey.slice(-6)} rate limited. Retry ${attempt + 1}/${retries} in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
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
            console.log(`Trying Gemini API key ${i + 1}/${API_KEYS.length}...`);
            return await tryWithKey(API_KEYS[i], prompt);
        } catch (error) {
            lastError = error;
            if (isRateLimitError(error) && i < API_KEYS.length - 1) {
                console.log(`Key ${i + 1} exhausted. Switching to key ${i + 2}...`);
            } else if (i < API_KEYS.length - 1) {
                console.log(`Key ${i + 1} failed (${error.message}). Trying key ${i + 2}...`);
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
        const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
        return JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text);
    } catch {
        return { raw: text };
    }
}
