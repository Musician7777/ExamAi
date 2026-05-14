/**
 * Code Execution Service — Piston API Integration
 * Supports: Python, Java, C++, JavaScript, Go, Ruby, Rust, TypeScript, C#
 * API: https://emkc.org/api/v2/piston
 */

const PISTON_API = 'https://emkc.org/api/v2/piston';

// Language → Piston runtime mapping
// Versions use '*' to always pick the latest runtime installed on the public Piston API.
// Hardcoded version strings cause "runtime not found" errors when the API updates runtimes.
const LANGUAGE_MAP = {
  javascript: { language: 'javascript', version: '*', extension: 'js' },
  python: { language: 'python', version: '*', extension: 'py' },
  java: { language: 'java', version: '*', extension: 'java' },
  cpp: { language: 'c++', version: '*', extension: 'cpp' },
  c: { language: 'c', version: '*', extension: 'c' },
  go: { language: 'go', version: '*', extension: 'go' },
  ruby: { language: 'ruby', version: '*', extension: 'rb' },
  rust: { language: 'rust', version: '*', extension: 'rs' },
  typescript: { language: 'typescript', version: '*', extension: 'ts' },
  csharp: { language: 'csharp', version: '*', extension: 'cs' },
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
 * Run code against test cases in parallel with bounded concurrency
 * @param {string} code - Source code
 * @param {string} language - Language key
 * @param {Array} testCases - [{input: string, output: string}]
 * @param {number} concurrency - Max parallel executions (default 5)
 * @returns {Object} { passed, score, testResults, executionTime }
 */
export async function runTestCases(code, language, testCases = [], concurrency = 5) {
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

  // Execute test cases in parallel with bounded concurrency
  const results = await runWithConcurrency(
    testCases.map((tc) => () => runSingleTestCase(code, language, tc)),
    concurrency
  );

  const totalTime = results.reduce((sum, r) => sum + r.executionTime, 0);
  const passedCount = results.filter((t) => t.passed).length;
  const score = Math.round((passedCount / results.length) * 100);

  return {
    passed: passedCount === testCases.length,
    score,
    testResults: results,
    executionTime: totalTime,
  };
}

/**
 * Execute a single test case and return a formatted result.
 *
 * If `tc.runners` contains a snippet for the current language, that snippet is
 * appended to the user code so the function gets called and its return value is
 * printed to stdout — identical to how LeetCode / HackerRank handle function-
 * signature problems.  Falls back to passing tc.input as stdin.
 */
async function runSingleTestCase(code, language, tc) {
  const runnerSnippet = tc.runners?.[language] ?? tc.runners?.javascript ?? null;
  const fullCode = runnerSnippet ? `${code}\n\n// --- auto test runner ---\n${runnerSnippet}` : code;
  const stdin = runnerSnippet ? '' : tc.input || '';
  const result = await executeCode(fullCode, language, stdin);
  const actualOutput = (result.stdout || '').trim();
  const expectedOutput = (tc.output || '').trim();
  const passed = normalizeOutput(actualOutput) === normalizeOutput(expectedOutput);

  return {
    input: tc.input || '',
    expected: expectedOutput,
    actual: result.exitCode !== 0 ? `Error: ${result.stderr}` : actualOutput,
    passed,
    executionTime: result.executionTime,
  };
}

/**
 * Run async tasks with bounded concurrency to avoid overwhelming the Piston API
 * @param {Array<Function>} tasks - Array of () => Promise<T>
 * @param {number} concurrency - Max parallel tasks
 * @returns {Promise<Array<T>>} Results in original order
 */
async function runWithConcurrency(tasks, concurrency) {
  const results = new Array(tasks.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < tasks.length) {
      const index = nextIndex++;
      results[index] = await tasks[index]();
    }
  }

  const workerCount = Math.min(concurrency, tasks.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

function normalizeOutput(output) {
  if (!output) return '';
  return output.replace(/\s+/g, ' ').trim().toLowerCase();
}
