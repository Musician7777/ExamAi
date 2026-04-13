/**
 * PDF Parser Service
 * Extracts text content from uploaded PDF files for exam pattern analysis
 * Fixed for pdf-parse v2.4.5+ which exports PDFParse class
 */

/**
 * Parse a PDF file buffer and extract text content
 * @param {Buffer} fileBuffer - The PDF file as a Buffer
 * @returns {Object} { text, pages, info }
 */
export async function parsePDF(fileBuffer) {
  try {
    // Dynamic import to avoid issues with SSR
    const pdfModule = await import('pdf-parse');
    const { PDFParse } = pdfModule;
    
    // pdf-parse 2.x requires Uint8Array
    const uint8Array = new Uint8Array(fileBuffer);
    
    const options = {
      max: 0, 
    };
    
    const parser = new PDFParse(uint8Array, options);
    const data = await parser.getText();
        
        return {
            success: true,
            text: data.text || '',
            pageCount: data.total || 0,
            info: {},
            metadata: {},
        };
    } catch (error) {
        console.error('PDF parse error:', error);
        return {
            success: false,
            text: '',
            pageCount: 0,
            error: error.message,
        };
    }
}

/**
 * Extract structured exam content from parsed text
 * Attempts to identify questions, sections, and patterns
 * @param {string} text - Raw extracted text
 * @returns {Object} { sections, questionCount, rawText, patterns }
 */
export function analyzeExamPattern(text) {
  if (!text || text.trim().length === 0) {
    return { sections: [], questionCount: 0, rawText: '', patterns: {} };
  }

  // Detect question patterns
  const questionPatterns = [
    /(?:Q|Question)\s*\.?\s*(\d+)/gi,
    /(\d+)\s*[.)]\s+/g,
    /(?:^|\n)\s*(\d+)\s*\.\s+\S/gm,
  ];

  let questionCount = 0;
  for (const pattern of questionPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > questionCount) {
      questionCount = matches.length;
    }
  }

  // Detect sections
  const sectionKeywords = [
    'Section', 'Part', 'SECTION', 'PART',
    'Paper', 'PAPER', 'Module', 'MODULE',
  ];
  const sections = [];
  for (const keyword of sectionKeywords) {
    const regex = new RegExp(`${keyword}\s*[-–:]?\s*([A-Z][^\n]{3,80})`, 'gi');
    const matches = [...text.matchAll(regex)];
    if (matches.length > 0) {
      matches.forEach(m => {
        const name = m[1]?.trim();
        if (name && !sections.includes(name)) {
          sections.push(name);
        }
      });
    }
  }

  // Detect patterns
  const patterns = {
    hasMultipleChoice: /\([a-d]\)|[a-d]\)|\(i+\)/i.test(text),
    hasNegativeMarking: /negative\s*mark/i.test(text),
    hasSections: sections.length > 0,
    estimatedQuestions: questionCount,
    estimatedDuration: text.match(/(\d+)\s*(?:minutes|mins|hours?)/i)?.[1] || null,
    hasInstructions: /instructions?|directions?|read\s+carefully/i.test(text),
  };

  return {
    sections,
    questionCount,
    rawText: text.substring(0, 15000), // Cap at 15K chars for API
    patterns,
  };
}

/**
 * Build a Gemini prompt to replicate the exam pattern
 * @param {Object} analysis - Output from analyzeExamPattern
 * @param {number} totalQuestions - Number of questions to generate
 * @returns {string} The prompt
 */
export function buildPatternReplicationPrompt(analysis, totalQuestions = 20) {
  return `You are an expert exam paper setter. Analyze the following exam paper content and generate a NEW exam that exactly replicates its pattern, style, and difficulty.

EXTRACTED EXAM CONTENT:
${analysis.rawText}

DETECTED PATTERNS:
- Estimated questions: ${analysis.questionCount}
- Sections detected: ${analysis.sections.length > 0 ? analysis.sections.join(', ') : 'None detected'}
- Multiple choice: ${analysis.patterns.hasMultipleChoice ? 'Yes' : 'No'}
- Negative marking: ${analysis.patterns.hasNegativeMarking ? 'Yes' : 'No'}

INSTRUCTIONS:
1. Generate EXACTLY ${totalQuestions} NEW questions that match the style and difficulty of the original
2. Maintain the same section structure if detected
3. Match the question format (MCQ, descriptive, etc.)
4. Match the difficulty distribution
5. Do NOT copy questions — create NEW ones in the same pattern
6. Each question must have 4 options with one correct answer

Return a JSON object with this structure:
{
  "title": "Pattern-Replicated Exam",
  "totalQuestions": ${totalQuestions},
  "duration": ${analysis.patterns.estimatedDuration || 60},
  "totalMarks": ${totalQuestions * 2},
  "negativeMarking": ${analysis.patterns.hasNegativeMarking ? 0.25 : 0},
  "patternSource": "Uploaded Document",
  "sections": [
    {
      "name": "Section Name",
      "questions": [
        {
          "id": 1,
          "text": "Question text",
          "options": ["A", "B", "C", "D"],
          "correct": 0,
          "difficulty": "easy|medium|hard",
          "topic": "Topic",
          "explanation": "Explanation",
          "marks": 2
        }
      ]
    }
  ]
}`;
}
