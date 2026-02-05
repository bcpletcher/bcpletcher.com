// ESLint v9+ flat config for Firebase Functions
// Mirrors the previous .eslintrc.js (eslint:recommended + google) behavior.
const js = require("@eslint/js");
const globals = require("globals");
const google = require("eslint-config-google");

module.exports = [
  {
    ignores: ["node_modules/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: "script",
      globals: {
        ...globals.node,
      },
    },
    // eslint-config-google exports a config object; in flat config we include it as-is.
    ...google,
    rules: {
      // Previous overrides
      "max-len": "off",
      "no-restricted-globals": ["error", "name", "length"],
      "prefer-arrow-callback": "error",
      quotes: ["error", "double", { allowTemplateLiterals: true }],
    },
  },
  {
    files: ["**/*.spec.*"],
    languageOptions: {
      globals: {
        ...globals.mocha,
      },
    },
  },
];
