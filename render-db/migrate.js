/**
 * render-db/migrate.js
 *
 * Runs schema.pg.sql against the Render PostgreSQL database.
 * Execute ONCE after first deploy:
 *
 *   DATABASE_URL=<your_render_db_url> node render-db/migrate.js
 *
 * Or from Render Shell:
 *   node render-db/migrate.js
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set. Aborting.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    const sql = fs.readFileSync(path.join(__dirname, 'schema.pg.sql'), 'utf8');
    await client.query(sql);
    console.log('✅ Schema applied successfully');

    // Verify table count
    const { rows } = await client.query(
      "SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log(`📊 Tables in database: ${rows[0].cnt}`);

    // Print discipline list to verify data
    const discs = await client.query('SELECT name FROM disciplines ORDER BY id');
    console.log('🏅 Disciplines:', discs.rows.map(r => r.name).join(', '));

    console.log('\n✅ Migration complete! You can now use the application.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err.detail || '');
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
