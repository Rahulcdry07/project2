const bcrypt = require('bcrypt');
const { User } = require('./src/models');

async function testLogin() {
  const email = 'admin@example.com';
  const password = 'Admin123!';

  console.log('Testing login for:', email);

  const user = await User.findOne({ where: { email } });
  console.log('User found:', !!user);

  if (user) {
    console.log('User details:', {
      id: user.id,
      username: user.username,
      email: user.email,
      is_verified: user.is_verified,
      role: user.role,
    });

    console.log('\nPassword hash from DB:', user.password);

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('\nPassword match result:', passwordMatch);
    console.log('Is verified:', user.is_verified);

    if (!user) {
      console.log('\n❌ User not found');
    } else if (!passwordMatch) {
      console.log('\n❌ Password does not match');
    } else if (!user.is_verified) {
      console.log('\n❌ User email not verified');
    } else {
      console.log('\n✅ Login should succeed!');
    }
  }

  process.exit(0);
}

testLogin().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
