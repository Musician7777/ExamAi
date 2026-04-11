/**
 * Code Execution Service — Piston API Integration
 * Supports: Python, Java, C++, JavaScript, Go, Ruby, Rust, TypeScript, C#
 * API: https://emkc.org/api/v2/piston
 */

const PISTON_API = 'https://emkc.org/api/v2/piston';

// Language → Piston runtime mapping
const LANGUAGE_MAP = {
    javascript: { language: 'javascript', version: '18.15.0', extension: 'js' },
    python: { language: 'python', version: '3.10.0', extension: 'py' },
    java: { language: 'java', version: '15.0.2', extension: 'java' },
    cpp: { language: 'c++', version: '10.2.0', extension: 'cpp' },
    c: { language: 'c', version: '10.2.0', extension: 'c' },
    go: { language: 'go', version: '1.16.2', extension: 'go' },
    ruby: { language: 'ruby', version: '3.0.1', extension: 'rb' },
    rust: { language: 'rust', version: '1.68.2', extension: 'rs' },
    typescript: { language: 'typescript', version: '5.0.3', extension: 'ts' },
    csharp: { language: 'csharp', version: '6.12.0', extension: 'cs' },
};

export function getSupportedLanguages() {
    return Object.keys(LANGUAGE_MAP);
}

/**
 * Execute code using the Piston API
 * @param {string} code - Source code to execute
 * @param {string} language - Language key (javascript, python, etc.)
 * @param {string} stdin - Standard input for the program
 * @param {number} timeout - Execution timeout in ms (default 10000)
 * @returns {Object} { stdout, stderr, exitCode, signal, executionTime }
 */
export async function executeCode(code, language, stdin = '', timeout = 10000) {
    const langConfig = LANGUAGE_MAP[language?.toLowerCase()];
    if (!langConfig) {
        return {
            stdout: '',
            stderr: `Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_MAP).join(', ')}`,
            exitCode: 1,
            signal: null,
            executionTime: 0,
        };
    }

    try {
        const startTime = Date.now();
        const response = await fetch(`${PISTON_API}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: langConfig.language,
                version: langConfig.version,
                files: [{ name: `main.${langConfig.extension}`, content: code }],
                stdin: stdin,
                run_timeout: timeout,
                compile_timeout: timeout,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                stdout: '',
                stderr: `Execution service error (${response.status}): ${errorText}`,
                exitCode: 1,
                signal: null,
                executionTime: Date.now() - startTime,
            };
        }

        const result = await response.json();
        const run = result.run || {};
        const compile = result.compile || {};
        const executionTime = Date.now() - startTime;

        // If compilation failed, return compile errors
        if (compile.stderr && compile.code !== 0) {
            return {
                stdout: compile.stdout || '',
                stderr: compile.stderr,
                exitCode: compile.code || 1,
                signal: compile.signal || null,
                executionTime,
                phase: 'compile',
            };
        }

        return {
            stdout: run.stdout || '',
            stderr: run.stderr || '',
            exitCode: run.code ?? 0,
            signal: run.signal || null,
            executionTime,
            phase: 'run',
        };
    } catch (error) {
        return {
            stdout: '',
            stderr: `Failed to connect to execution service: ${error.message}`,
            exitCode: 1,
            signal: null,
            executionTime: 0,
        };
    }
}

/**
 * Run code against test cases
 * @param {string} code - Source code
 * @param {string} language - Language key
 * @param {Array} testCases - [{input: string, output: string}]
 * @returns {Object} { passed, score, testResults, executionTime }
 */
export async function runTestCases(code, language, testCases = []) {
    if (!testCases || testCases.length === 0) {
        // Just run the code without test cases
        const result = await executeCode(code, language);
        return {
            passed: result.exitCode === 0,
            score: result.exitCode === 0 ? 100 : 0,
            testResults: [],
            output: result.stdout,
            error: result.stderr,
            executionTime: result.executionTime,
        };
    }

    const testResults = [];
    let totalTime = 0;

    for (const tc of testCases) {
        const result = await executeCode(code, language, tc.input || '');
        totalTime += result.executionTime;

        const actualOutput = (result.stdout || '').trim();
        const expectedOutput = (tc.output || '').trim();
        const passed = normalizeOutput(actualOutput) === normalizeOutput(expectedOutput);

        testResults.push({
            input: tc.input || '',
            expected: expectedOutput,
            actual: result.exitCode !== 0 ? `Error: ${result.stderr}` : actualOutput,
            passed,
            executionTime: result.executionTime,
        });
    }

    const passedCount = testResults.filter(t => t.passed).length;
    const score = Math.round((passedCount / testResults.length) * 100);

    return {
        passed: passedCount === testResults.length,
        score,
        testResults,
        executionTime: totalTime,
    };
}

function normalizeOutput(output) {
    if (!output) return '';
    return output.replace(/\s+/g, ' ').trim().toLowerCase();
}
