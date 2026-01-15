import globals from "globals";

export default [
  {
    files: ["**/*.{js,ts}"],
    languageOptions: {
      globals: {
        ...globals.es2021,
      },
    },
  },

  {
    files: ["infra/**/*.js", "infra/scripts/**/*.js", "jest.config.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  {
    files: ["**/*.test.{js,ts}", "**/*.spec.{js,ts}"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },

  {
    files: ["pages/**/*.{js,jsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
  },

  {
    ignores: ["**/migrations/**"],
  },
];
