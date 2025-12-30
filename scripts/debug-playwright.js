process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

const log = (label, res) => {
  console.log(`\n[${label}] status=${res.status} body=${JSON.stringify(res.body)}`);
};

(async () => {
  try {
    await sequelize.sync({ force: true });

    let res = await request(app)
      .post('/api/test/clear-database')
      .send();
    log('clear-db', res);

    const user = { username: 'playwright', email: 'playwright@example.com', password: 'password123' };
    res = await request(app)
      .post('/api/auth/register')
      .send(user);
    log('register', res);

    res = await request(app)
      .post('/api/test/verify-user')
      .send({ email: user.email });
    log('verify-user', res);

    res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    log('login', res);

    res = await request(app)
      .get('/api/health');
    log('health', res);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
