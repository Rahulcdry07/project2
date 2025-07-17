const globals = require('globals');
const pluginCypress = require('eslint-plugin-cypress');

module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.mocha,
        ...pluginCypress.configs.recommended.globals,
        'cy': 'readonly',
        'Cypress': 'readonly',
        'expect': 'readonly'
      },
    },
    plugins: {
      cypress: pluginCypress,
    },
    rules: {
      'indent': [
        'error',
        2
      ],
      'linebreak-style': [
        'error',
        'unix'
      ],
      'quotes': [
        'error',
        'single'
      ],
      'semi': [
        'error',
        'always'
      ],
      'no-unused-vars': 'warn',
      'no-undef': 'error'
    },
  },
];