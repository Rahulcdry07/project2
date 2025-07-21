const request = require('supertest');
const app = require('../src/server.js');
const { User } = require('../src/database.js');

describe('Enhanced Profile Features', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
        // Clear database
        await User.destroy({ where: {}, truncate: true });
        
        // Create test user
        testUser = await User.create({
            username: 'testuser',
            email: 'test@example.com',
            password: '$2b$10$test',
            is_verified: true,
            role: 'user'
        });

        // Login to get token
        const loginResponse = await request(app)
            .post('/api/login')
            .send({
                email: 'test@example.com',
                password: 'TestPass123!'
            });

        if (loginResponse.status === 200) {
            authToken = loginResponse.body.token;
        }
    });

    describe('GET /api/profile', () => {
        it('should return enhanced profile data', async () => {
            const response = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('username', 'testuser');
            expect(response.body).toHaveProperty('email', 'test@example.com');
            expect(response.body).toHaveProperty('bio');
            expect(response.body).toHaveProperty('location');
            expect(response.body).toHaveProperty('website');
            expect(response.body).toHaveProperty('github_url');
            expect(response.body).toHaveProperty('linkedin_url');
            expect(response.body).toHaveProperty('twitter_url');
            expect(response.body).toHaveProperty('profile_picture');
            expect(response.body).toHaveProperty('profile_privacy');
            expect(response.body).toHaveProperty('last_login');
            expect(response.body).toHaveProperty('login_count');
            expect(response.body).toHaveProperty('profile_completion');
        });
    });

    describe('PUT /api/profile', () => {
        it('should update enhanced profile fields', async () => {
            const updateData = {
                username: 'updateduser',
                email: 'updated@example.com',
                bio: 'This is my bio',
                location: 'New York, USA',
                website: 'https://example.com',
                github_url: 'https://github.com/testuser',
                linkedin_url: 'https://linkedin.com/in/testuser',
                twitter_url: 'https://twitter.com/testuser',
                profile_privacy: 'public'
            };

            const response = await request(app)
                .put('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('Profile updated successfully');
            expect(response.body.username).toBe('updateduser');
            expect(response.body.bio).toBe('This is my bio');
            expect(response.body.location).toBe('New York, USA');
            expect(response.body.website).toBe('https://example.com');
            expect(response.body.github_url).toBe('https://github.com/testuser');
            expect(response.body.linkedin_url).toBe('https://linkedin.com/in/testuser');
            expect(response.body.twitter_url).toBe('https://twitter.com/testuser');
            expect(response.body.profile_privacy).toBe('public');
            expect(response.body.profile_completion).toBeGreaterThan(0);
        });

        it('should validate profile fields', async () => {
            const invalidData = {
                username: 'updateduser',
                email: 'updated@example.com',
                bio: 'a'.repeat(501), // Too long
                website: 'invalid-url',
                profile_privacy: 'invalid'
            };

            const response = await request(app)
                .put('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.error).toBeDefined();
        });
    });

    describe('GET /api/profile/:username', () => {
        it('should return public profile data', async () => {
            // Update user with public profile data
            await testUser.update({
                bio: 'Public bio',
                location: 'Public location',
                profile_privacy: 'public'
            });

            const response = await request(app)
                .get('/api/profile/testuser');

            expect(response.status).toBe(200);
            expect(response.body.username).toBe('testuser');
            expect(response.body.bio).toBe('Public bio');
            expect(response.body.location).toBe('Public location');
            expect(response.body).not.toHaveProperty('email'); // Should not include private data
        });

        it('should respect privacy settings', async () => {
            // Set profile to private
            await testUser.update({
                profile_privacy: 'private'
            });

            const response = await request(app)
                .get('/api/profile/testuser');

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('This profile is private');
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(app)
                .get('/api/profile/nonexistentuser');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User not found');
        });
    });

    describe('Profile completion calculation', () => {
        it('should calculate completion percentage correctly', async () => {
            // Empty profile should have low completion
            const emptyResponse = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect(emptyResponse.body.profile_completion).toBeLessThan(50);

            // Fill profile with data
            await testUser.update({
                bio: 'Test bio',
                location: 'Test location',
                website: 'https://example.com',
                github_url: 'https://github.com/test',
                linkedin_url: 'https://linkedin.com/in/test',
                twitter_url: 'https://twitter.com/test'
            });

            const fullResponse = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect(fullResponse.body.profile_completion).toBeGreaterThan(80);
        });
    });
}); 