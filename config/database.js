/**
 * config/database.js
 *
 * Dual-mode DB adapter:
 *   - Development : MySQL  (mysql2/promise) — uses DB_HOST/DB_USER/...
 *   - Production  : PostgreSQL (pg)         — uses DATABASE_URL (set by Render)
 *
 * Both expose the same interface so all models work without changes:
 *   pool.execute(sql, params)            → [rows]
 *   pool.query(sql, params)              → [rows]
 *   pool.getConnection()                 → { execute, release }
 *   pool.upsertRanking(...)              → DB-agnostic upsert for rankings
 *   pool.updateRankPositions(did, year)  → DB-agnostic rank recalc
 *   pool.isPg                            → boolean flag
 */

const IS_POSTGRES = !!process.env.DATABASE_URL;

/* ────────────────────────────────────────────
   POSTGRESQL mode (Render production)
   ──────────────────────────────────────────── */
function buildPgPool() {
  const { Pool } = require('pg');

  const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
    max: 10,
  });

  /** Convert mysql2-style ? placeholders to PostgreSQL $1, $2, … */
  function toPostgres(sql) {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
  }

  /**
   * Mimics mysql2 pool.execute().
   * Returns [rows] for SELECT, [header] for DML.
   */
  async function execute(sql, params = []) {
    const pgSql = toPostgres(sql);

    const isInsert    = /^\s*INSERT\b/i.test(pgSql);
    const hasReturning = /\bRETURNING\b/i.test(pgSql);
    const finalSql    = isInsert && !hasReturning ? pgSql + ' RETURNING id' : pgSql;

    const result = await pgPool.query(finalSql, params);

    if (isInsert) {
      return [{ insertId: result.rows[0]?.id || 0, affectedRows: result.rowCount }];
    }
    if (['UPDATE', 'DELETE'].includes(result.command)) {
      return [{ affectedRows: result.rowCount, changedRows: result.rowCount }];
    }
    return [result.rows];
  }

  async function getConnection() {
    const client = await pgPool.connect();
    return {
      execute: async (sql, params = []) => execute(sql, params),
      release: () => client.release(),
    };
  }

  /** Rankings upsert — PostgreSQL ON CONFLICT version */
  async function upsertRanking(userId, disciplineId, year, points, gold, silver, bronze) {
    await pgPool.query(
      `INSERT INTO rankings
         (user_id, discipline_id, season_year, total_points, events_participated,
          gold_medals, silver_medals, bronze_medals)
       VALUES ($1,$2,$3,$4,1,$5,$6,$7)
       ON CONFLICT (user_id, discipline_id, season_year) DO UPDATE SET
         total_points        = rankings.total_points        + EXCLUDED.total_points,
         events_participated = rankings.events_participated + 1,
         gold_medals         = rankings.gold_medals         + EXCLUDED.gold_medals,
         silver_medals       = rankings.silver_medals       + EXCLUDED.silver_medals,
         bronze_medals       = rankings.bronze_medals       + EXCLUDED.bronze_medals`,
      [userId, disciplineId, year, points, gold, silver, bronze]
    );
  }

  /** Rank positions — PostgreSQL window-function version */
  async function updateRankPositions(disciplineId, year) {
    await pgPool.query(
      `WITH ranked AS (
         SELECT id,
                ROW_NUMBER() OVER (ORDER BY total_points DESC) AS rn
         FROM rankings
         WHERE discipline_id = $1 AND season_year = $2
       )
       UPDATE rankings
          SET rank_position = ranked.rn
         FROM ranked
        WHERE rankings.id = ranked.id`,
      [disciplineId, year]
    );
  }

  async function testConnection() {
    try {
      await pgPool.query('SELECT 1');
      console.log('✅ PostgreSQL підключено (Render)');
    } catch (err) {
      console.error('⚠️  PostgreSQL недоступний:', err.message);
    }
  }

  const pool = { execute, query: execute, getConnection,
                 upsertRanking, updateRankPositions, isPg: true };
  return { pool, testConnection };
}

/* ────────────────────────────────────────────
   MYSQL mode (local development)
   ──────────────────────────────────────────── */
function buildMysqlPool() {
  const mysql = require('mysql2/promise');

  const mysqlPool = mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'sports_events',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: '+02:00',
  });

  /** Rankings upsert — MySQL ON DUPLICATE KEY version */
  async function upsertRanking(userId, disciplineId, year, points, gold, silver, bronze) {
    await mysqlPool.execute(
      `INSERT INTO rankings
         (user_id, discipline_id, season_year, total_points, events_participated,
          gold_medals, silver_medals, bronze_medals)
       VALUES (?,?,?,?,1,?,?,?)
       ON DUPLICATE KEY UPDATE
         total_points        = total_points        + VALUES(total_points),
         events_participated = events_participated + 1,
         gold_medals         = gold_medals         + VALUES(gold_medals),
         silver_medals       = silver_medals       + VALUES(silver_medals),
         bronze_medals       = bronze_medals       + VALUES(bronze_medals)`,
      [userId, disciplineId, year, points, gold, silver, bronze]
    );
  }

  /** Rank positions — MySQL user-variable version */
  async function updateRankPositions(disciplineId, year) {
    await mysqlPool.execute('SET @r := 0');
    await mysqlPool.execute(
      'UPDATE rankings SET rank_position = (@r := @r + 1) ' +
      'WHERE discipline_id = ? AND season_year = ? ORDER BY total_points DESC',
      [disciplineId, year]
    );
  }

  async function testConnection() {
    try {
      const conn = await mysqlPool.getConnection();
      console.log('✅ MySQL підключено (локально)');
      conn.release();
    } catch (err) {
      console.error('⚠️  MySQL недоступний:', err.message);
      console.warn('   Запустіть XAMPP MySQL та імпортуйте sql/schema.sql');
    }
  }

  const pool = Object.assign(mysqlPool, { upsertRanking, updateRankPositions, isPg: false });
  return { pool, testConnection };
}

/* ────────────────────────────────────────────
   Export
   ──────────────────────────────────────────── */
const { pool, testConnection } = IS_POSTGRES ? buildPgPool() : buildMysqlPool();
module.exports = { pool, testConnection };
