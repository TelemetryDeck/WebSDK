module.exports = {
  env: {
    browser: true,
  },
  globals: {
    globalThis: true,
  },
  plugins: ['prettier', 'unicorn', 'jest'],
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
    'plugin:unicorn/recommended',
    'plugin:playwright/recommended',
  ],

  overrides: [
    {
      files: ['.eslintrc.js', 'playwright.config.js'],
      env: {
        browser: false,
        node: true,
      },
      rules: {
        'unicorn/prefer-module': 'off',
      },
    },
    {
      files: ['tests/**/*'],
      env: {
        browser: true,
        node: true,
      },
      globals: {
        globalThis: true,
      },
      rules: {
        'unicorn/prefer-module': 'off',
      },
    },
  ],
};
