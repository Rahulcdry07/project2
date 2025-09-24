const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://0.0.0.0:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: "cypress/e2e/**/*.cy.js",
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
    },
  },
});
