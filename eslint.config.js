import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';
import checkFile from 'eslint-plugin-check-file';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      prettier, // Disables conflict rules
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      'check-file': checkFile,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      ...jsxA11y.configs.recommended.rules,
      'check-file/folder-naming-convention': [
        'error',
        {
          'src/components/**/': 'PASCAL_CASE',
        },
      ],
      'check-file/filename-naming-convention': [
        'error',
        {
          'src/components/**/*.{tsx}': 'PASCAL_CASE',
          'src/**/*.{ts}': 'CAMEL_CASE',
          'src/**/*.{css}': 'KEBAB_CASE',
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],
    },
  },
  {
    // Playwright specs and their helpers get `test`/`expect` from the fixtures, never from the bare
    // package: tests/e2e/fixtures.ts aborts every request to a real form provider, and a spec that
    // imports '@playwright/test' directly silently loses that guard (real submissions cost quota and
    // land in the owner's inbox). Type-only imports are fine.
    files: ['tests/e2e/**/*.ts', 'tests/visual/**/*.ts'],
    ignores: ['tests/e2e/fixtures.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              allowTypeImports: true,
              message:
                "Import { test, expect } from './fixtures' instead: the fixture blocks requests to the real form providers in every test.",
            },
          ],
        },
      ],
    },
  }
);
