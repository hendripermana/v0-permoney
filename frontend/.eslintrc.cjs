const path = require('path')

module.exports = {
  root: true,
  extends: ['next', 'next/core-web-vitals'],
  ignorePatterns: ['.next/**/*', 'out/**/*', 'coverage/**/*', 'node_modules/**/*'],
  rules: {
    'import/no-anonymous-default-export': 'off',
  },
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: [path.join(__dirname, 'tsconfig.json')],
        tsconfigRootDir: __dirname,
      },
      plugins: ['@typescript-eslint'],
      rules: {
        'no-undef': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'import/no-anonymous-default-export': 'off',
        'react/react-in-jsx-scope': 'off',
        'react-hooks/exhaustive-deps': 'off',
        'react/no-unescaped-entities': 'off',
        'react/display-name': 'off',
        'no-empty': 'off',
        'jsx-a11y/alt-text': 'off',
      },
    },
    {
      files: [
        '**/__tests__/**/*.{ts,tsx}',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'specs/**/*.{ts,tsx}',
      ],
      env: {
        jest: true,
      },
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    {
      files: ['jest.setup.ts'],
      env: {
        jest: true,
      },
      globals: {
        afterEach: 'readonly',
      },
    },
    {
      files: ['public/sw.js'],
      globals: {
        self: 'readonly',
        clients: 'readonly',
        caches: 'readonly',
        fetch: 'readonly',
      },
    },
  ],
}
