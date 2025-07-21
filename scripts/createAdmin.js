// scripts/createAdmin.js
const { User } = require('../src/database.js');
const bcrypt = require('bcrypt');
const { sequelize } = require('../src/database.js');

async function createAdmin() {
  const email = 'admin@example.com';
  const password = 'Admin@1234!';
  const hashedPassword = await bcrypt.hash(password, 10);

  let user = await User.findOne({ where: { email } });
  if (!user) {
    user = await User.create({
      username: 'admin',
      email,
      password: hashedPassword,
      role: 'admin',
      is_verified: true
    });
    console.log('Admin user created.');
  } else {
    user.role = 'admin';
    user.is_verified = true;
    user.password = hashedPassword;
    await user.save();
    console.log('Admin user updated.');
  }
  process.exit(0);
}

sequelize.authenticate().then(() => {
  console.log('Database connection is OK');
}).catch(err => {
  console.error('Database connection failed:', err);
});

createAdmin();