const { pool } = require('./db');

async function initDatabase() {
  console.log('[Raahi DB Init] Connecting to Neon PostgreSQL...');
  
  const createTablesQuery = `
    -- 1. Users Table
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('DRIVER', 'PASSENGER')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Vehicles Table
    CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY,
      driver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      vehicle_type VARCHAR(50) NOT NULL,
      vehicle_model VARCHAR(100) NOT NULL,
      registration_number VARCHAR(50) NOT NULL UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Indexes for fast query lookups
    CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON vehicles(driver_id);
  `;

  try {
    await pool.query(createTablesQuery);
    console.log('[Raahi DB Init] ✓ Successfully initialized tables: "users" and "vehicles".');
    
    // Verify by checking table names
    const verificationQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'vehicles');
    `;
    const res = await pool.query(verificationQuery);
    console.log('[Raahi DB Init] Verified existing tables in public schema:', res.rows.map(r => r.table_name));
    
    process.exit(0);
  } catch (error) {
    console.error('[Raahi DB Init] ✗ Failed to initialize database:', error.message);
    process.exit(1);
  }
}

initDatabase();
