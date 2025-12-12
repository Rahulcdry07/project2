const { User } = require('./src/models');
const bcrypt = require('bcrypt');

(async () => {
  try {
    // Check/update admin user
    const admin = await User.findOne({ where: { email: 'admin@example.com' } });
    
    if (admin) {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      
      await admin.update({
        password: hashedPassword,
        is_verified: true,
        role: 'admin',
        verification_token: null
      });
      
      console.log('✓ Admin password reset successfully!');
      console.log('  Email: admin@example.com');
      console.log('  Password: Password123!');
      console.log('  Role: admin');
    }
    
    // Check/update test user
    let testUser = await User.findOne({ where: { email: 'test@example.com' } });
    
    if (testUser) {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await testUser.update({
        password: hashedPassword,
        is_verified: true,
        verification_token: null
      });
      console.log('✓ Test user updated successfully!');
      console.log('  Email: test@example.com');
      console.log('  Password: Password123!');
    } else {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        is_verified: true,
        role: 'user'
      });
      console.log('✓ Test user created successfully!');
      console.log('  Email: test@example.com');
      console.log('  Password: Password123!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
