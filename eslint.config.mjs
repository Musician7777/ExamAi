import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,

  // ─── Global ignores ────────────────────────────────────
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'node_modules/**']),

  // ─── Custom rules for all files ─────────────────────────
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    rules: {
      // Warnings — encourage best practices without blocking
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-duplicate-imports': 'warn',
      'no-self-compare': 'warn',
      'no-template-curly-in-string': 'warn',
      'no-unreachable': 'warn',
      'no-unreachable-loop': 'warn',
      'no-useless-assignment': 'warn',
      'prefer-const': 'warn',
      'no-constant-condition': ['warn', { checkLoops: false }],

      // Next.js best practices
      '@next/next/no-html-link-for-pages': 'warn',
      '@next/next/no-img-element': 'warn',

      // React — treat hook dependency issues as warnings, not errors
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // ─── Stricter rules for non-UI files (API routes, lib, models) ──
  {
    files: ['app/api/**/*.{js,mjs}', 'lib/**/*.{js,mjs}', 'models/**/*.js', 'middleware.js'],
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  // ─── Prettier: disable conflicting ESLint formatting rules ──
  prettierConfig,

  // ─── Prettier: report formatting issues as ESLint warnings ──
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': 'warn',
    },
  },
]);

export default eslintConfig;
