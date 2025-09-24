module.exports = {
  development: {
    dialect: 'sqlite',
    storage: './src/database.sqlite',
    logging: console.log
  },
  test: {
    dialect: 'sqlite',
    storage: './src/test-database.sqlite',
    logging: false
  },
  production: {
    dialect: 'sqlite',
    storage: './src/database.sqlite',
    logging: false
  }
};