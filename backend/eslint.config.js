const eslint = require('@eslint/js');
const tseslintPlugin = require('@typescript-eslint/eslint-plugin');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const globals = require('globals');

module.exports = [
  {
    ignores: ['eslint.config.js', 'dist/**'],
  },
  eslint.configs.recommended,
  ...tseslintPlugin.configs['flat/recommended'],
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': false }],
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',

      // Промис, брошенный без await/catch, — это необработанный reject, то есть
      // упавший процесс. Ровно так падало приложение из-за телеграма.
      // Осознанный fire-and-forget помечается `void`.
      '@typescript-eslint/no-floating-promises': 'error',
      // Пойманная и ни разу не использованная ошибка — проглоченная причина.
      // Если ошибка действительно не нужна, пишется `catch {}` без параметра.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { caughtErrors: 'all', argsIgnorePattern: '^_' },
      ],
    },
  },
  eslintPluginPrettierRecommended,
  {
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
];
