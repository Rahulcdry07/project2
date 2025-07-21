const { defineConfig } = require("cypress");
const webpack = require("@cypress/webpack-preprocessor");

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: "cypress/e2e/**/*.cy.js",
    setupNodeEvents(on, config) {
      on("file:preprocessor", webpack({
        webpackOptions: {
          resolve: {
            extensions: [".ts", ".js", ".jsx", ".tsx"],
          },
          module: {
            rules: [
              {
                test: /\.(js|jsx|ts|tsx)$/,
                exclude: /node_modules\/(?!(@babel\/runtime|react-router-dom|react-router)\/)/,
                use: [
                  {
                    loader: "babel-loader",
                    options: {
                      presets: ["@babel/preset-env", "@babel/preset-react"],
                    },
                  },
                ],
              },
            ],
          },
        },
      }));
      return config;
    },
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
    },
  },
});
