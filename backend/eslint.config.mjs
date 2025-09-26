import { dirname } from 'path'
import { fileURLToPath } from 'url'
import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import globals from 'globals'

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url))

const tsRules = {
  ...tsPlugin.configs.recommended.rules,
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
}

const backendConfig = [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        tsconfigRootDir,
        sourceType: 'module',
        ecmaVersion: 2020,
      },
      globals: {
        ...globals.es2021,
        ...globals.node,
        ...globals.commonjs,
        fetch: 'readonly',
        URL: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: tsRules,
  },
  {
    files: [
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/*.test.ts',
      '**/*.test.tsx',
      'src/test-setup.ts',
      'src/test-global-setup.ts',
      'src/test-global-teardown.ts',
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
        ...globals.commonjs,
      },
    },
  },
  {
    ignores: ['dist/**/*', 'coverage/**/*'],
  },
]

export default backendConfig
