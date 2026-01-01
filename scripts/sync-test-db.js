const { sequelize } = require('../src/models');

async function syncDatabase() {
  try {
    console.log('Syncing all models to test database...');

    // Sync all models - alter: true will update existing tables
    await sequelize.sync({ alter: true });

    console.log('✅ All models synced successfully');

    // List all tables
    const [tables] = await sequelize.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);

    console.log('\nTables in database:');
    tables.forEach(t => console.log('  -', t.tablename));

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    process.exit(1);
  }
}

syncDatabase();
