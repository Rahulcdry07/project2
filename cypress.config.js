const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000', // Assuming you serve your project on port 8000
    supportFile: false,
    specPattern: "cypress/e2e/**/*.cy.js",
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
    },
  },
});
