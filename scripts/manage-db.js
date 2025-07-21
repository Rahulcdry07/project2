const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

const getDatabasePath = (env) => {
  switch (env) {
    case 'test':
      return path.join(__dirname, '../src/test-database.sqlite');
    case 'production':
      return path.join(__dirname, '../src/production-database.sqlite');
    default:
      return path.join(__dirname, '../src/database.sqlite');
  }
};

// Create environment-specific database connection
const createConnection = (env) => {
  return new Sequelize({
    dialect: 'sqlite',
    storage: getDatabasePath(env),
    logging: false,
  });
};

// Define User model for the script
const defineUserModel = (sequelize) => {
  return sequelize.define('User', {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'user',
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verification_token: {
      type: DataTypes.STRING,
    },
    reset_token: {
      type: DataTypes.STRING,
    },
    reset_token_expires_at: {
      type: DataTypes.DATE,
    },
    refresh_token: {
      type: DataTypes.STRING,
    },
    refresh_token_expires_at: {
      type: DataTypes.DATE,
    },
    profile_picture: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    github_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    linkedin_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    twitter_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profile_privacy: {
      type: DataTypes.ENUM('public', 'private', 'friends'),
      defaultValue: 'public',
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    login_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    profile_completion: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  });
};

const commands = {
  'init': async (env) => {
    console.log(`Initializing ${env} database...`);
    const sequelize = createConnection(env);
    const User = defineUserModel(sequelize);
    
    try {
      await sequelize.sync({ force: true });
      console.log(`✅ ${env} database initialized successfully!`);
    } catch (error) {
      console.error(`❌ Error initializing ${env} database:`, error.message);
    } finally {
      await sequelize.close();
    }
  },
  
  'reset': async (env) => {
    console.log(`Resetting ${env} database...`);
    const sequelize = createConnection(env);
    const User = defineUserModel(sequelize);
    
    try {
      const dbPath = getDatabasePath(env);
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log(`🗑️  Deleted existing ${env} database`);
      }
      await sequelize.sync({ force: true });
      console.log(`✅ ${env} database reset successfully!`);
    } catch (error) {
      console.error(`❌ Error resetting ${env} database:`, error.message);
    } finally {
      await sequelize.close();
    }
  },
  
  'seed': async (env) => {
    console.log(`Seeding ${env} database with sample data...`);
    const sequelize = createConnection(env);
    const User = defineUserModel(sequelize);
    
    try {
      await sequelize.sync();
      
      // Create admin user
      await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: '$2b$10$test', // In real app, use proper hash
        is_verified: true,
        role: 'admin',
        bio: 'System Administrator',
        location: 'Headquarters',
        profile_privacy: 'public'
      });
      
      // Create sample user
      await User.create({
        username: 'demo',
        email: 'demo@example.com',
        password: '$2b$10$test', // In real app, use proper hash
        is_verified: true,
        role: 'user',
        bio: 'Demo user for testing',
        location: 'Demo City',
        website: 'https://example.com',
        github_url: 'https://github.com/demo',
        profile_privacy: 'public'
      });
      
      console.log(`✅ ${env} database seeded successfully!`);
      console.log('Sample users created:');
      console.log('- admin@example.com (admin)');
      console.log('- demo@example.com (user)');
    } catch (error) {
      console.error(`❌ Error seeding ${env} database:`, error.message);
    } finally {
      await sequelize.close();
    }
  },
  
  'status': async (env) => {
    console.log(`Checking ${env} database status...`);
    const sequelize = createConnection(env);
    const User = defineUserModel(sequelize);
    
    try {
      const dbPath = getDatabasePath(env);
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        console.log(`✅ ${env} database exists`);
        console.log(`📁 Path: ${dbPath}`);
        console.log(`📊 Size: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`🕒 Modified: ${stats.mtime.toLocaleString()}`);
        
        // Check user count
        await sequelize.sync();
        const userCount = await User.count();
        console.log(`👥 Users: ${userCount}`);
      } else {
        console.log(`❌ ${env} database does not exist`);
      }
    } catch (error) {
      console.error(`❌ Error checking ${env} database:`, error.message);
    } finally {
      await sequelize.close();
    }
  },
  
  'list': async () => {
    console.log('Available database files:');
    const dbFiles = [
      'database.sqlite',
      'test-database.sqlite', 
      'production-database.sqlite'
    ];
    
    for (const file of dbFiles) {
      const filePath = path.join(__dirname, '../src', file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
      } else {
        console.log(`❌ ${file} (not found)`);
      }
    }
  }
};

const main = async () => {
  const command = process.argv[2];
  const env = process.argv[3] || 'development';
  
  if (!command || !commands[command]) {
    console.log('Database Management Script');
    console.log('Usage: node scripts/manage-db.js <command> [environment]');
    console.log('');
    console.log('Commands:');
    console.log('  init <env>     - Initialize database for environment');
    console.log('  reset <env>    - Reset database for environment');
    console.log('  seed <env>     - Seed database with sample data');
    console.log('  status <env>   - Check database status');
    console.log('  list           - List all database files');
    console.log('');
    console.log('Environments: development, test, production');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/manage-db.js init test');
    console.log('  node scripts/manage-db.js seed development');
    console.log('  node scripts/manage-db.js status production');
    process.exit(1);
  }
  
  try {
    await commands[command](env);
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
};

main(); 