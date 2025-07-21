const { sequelize, User } = require('./src/database.js');

async function updateSchema() {
    try {
        console.log('Updating database schema...');
        
        // Force sync to update the schema with new fields
        await sequelize.sync({ force: true });
        
        console.log('Database schema updated successfully!');
        
        // Create a test user to verify the new fields work
        const testUser = await User.create({
            username: 'testuser',
            email: 'test@example.com',
            password: '$2b$10$test',
            is_verified: true,
            role: 'user',
            bio: 'Test bio',
            location: 'Test location',
            profile_privacy: 'public'
        });
        
        console.log('Test user created successfully!');
        console.log('User data:', {
            id: testUser.id,
            username: testUser.username,
            bio: testUser.bio,
            location: testUser.location,
            profile_privacy: testUser.profile_privacy,
            profile_completion: testUser.profile_completion
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error updating schema:', error);
        process.exit(1);
    }
}

updateSchema(); 