/**
 * Sanitize user input before inserting into AI prompts.
 * Prevents prompt injection by escaping/neutralizing instruction-like patterns.
 */

/**
 * Strip dangerous prompt-injection patterns from user-provided text.
 * - Removes common injection prefixes ("ignore previous", "system:", etc.)
 * - Escapes curly braces and backticks that could break prompt templates
 * - Truncates to a max length
 * @param {string} input — Raw user input
 * @param {number} maxLength — Max characters (default 2000)
 * @returns {string} — Sanitized input
 */
export function sanitizePromptInput(input, maxLength = 2000) {
  if (!input || typeof input !== 'string') return '';
  let clean = input.trim();

  // Truncate
  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength);
  }

  // Remove common prompt-injection phrases (case-insensitive)
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+(instructions|prompts?|context)/gi,
    /forget\s+(all\s+)?previous\s+(instructions|prompts?|context)/gi,
    /disregard\s+(all\s+)?previous\s+(instructions|prompts?|context)/gi,
    /you\s+are\s+now\s+/gi,
    /new\s+instructions?\s*:/gi,
    /system\s*:\s*/gi,
    /assistant\s*:\s*/gi,
    /\[system\]/gi,
    /\<\/?system\>/gi,
  ];
  for (const pattern of injectionPatterns) {
    clean = clean.replace(pattern, '[removed]');
  }

  // Replace template-breaking characters with safe placeholders
  // Note: escaping with backslash doesn't work in JS template literals (${...} still interpolates)
  clean = clean.replace(/\{/g, '⟦').replace(/\}/g, '⟧');
  // Remove backticks that could execute code in template strings
  clean = clean.replace(/`/g, "'");

  return clean;
}
