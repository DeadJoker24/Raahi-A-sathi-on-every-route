const { pool } = require('./db');

async function initDatabase() {
  console.log('[Raahi DB Init] Connecting to Neon PostgreSQL...');
  
  const createTablesQuery = `
    -- 1. Users Table (Sprint 1)
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('DRIVER', 'PASSENGER')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Vehicles Table (Sprint 1)
    CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY,
      driver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      vehicle_type VARCHAR(50) NOT NULL,
      vehicle_model VARCHAR(100) NOT NULL,
      registration_number VARCHAR(50) NOT NULL UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Ensure unique constraint on (id, driver_id) for composite foreign key validation
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_vehicles_id_driver'
      ) THEN
        ALTER TABLE vehicles ADD CONSTRAINT uq_vehicles_id_driver UNIQUE (id, driver_id);
      END IF;
    END $$;

    -- Vehicles index
    CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON vehicles(driver_id);

    -- 3. Commutes Table (Sprint 2)
    CREATE TABLE IF NOT EXISTS commutes (
      id SERIAL PRIMARY KEY,
      driver_id INTEGER NOT NULL,
      vehicle_id INTEGER NOT NULL,
      origin VARCHAR(150) NOT NULL,
      destination VARCHAR(150) NOT NULL,
      departure_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
      total_seats INTEGER NOT NULL CHECK (total_seats > 0 AND total_seats <= 8),
      available_seats INTEGER NOT NULL CHECK (available_seats >= 0 AND available_seats <= total_seats),
      price_per_seat NUMERIC(8, 2) NOT NULL CHECK (price_per_seat >= 0),
      route_description TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

      -- Relational integrity: guarantees the vehicle MUST belong to this exact driver!
      CONSTRAINT fk_commute_driver_vehicle FOREIGN KEY (vehicle_id, driver_id) 
        REFERENCES vehicles(id, driver_id) ON DELETE RESTRICT,

      -- Account integrity: deleting a user cleans up their commutes
      CONSTRAINT fk_commute_driver FOREIGN KEY (driver_id) 
        REFERENCES users(id) ON DELETE CASCADE
    );

    -- 4. Commute Search & Query Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_commutes_driver_id ON commutes(driver_id);
    CREATE INDEX IF NOT EXISTS idx_commutes_active_search ON commutes(status, departure_datetime);
    CREATE INDEX IF NOT EXISTS idx_commutes_origin_lower ON commutes(LOWER(origin));
    CREATE INDEX IF NOT EXISTS idx_commutes_destination_lower ON commutes(LOWER(destination));
  `;

  try {
    await pool.query(createTablesQuery);
    console.log('[Raahi DB Init] ✓ Successfully initialized tables: "users", "vehicles", and "commutes".');
    
    // Verify existing tables in public schema
    const verificationQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'vehicles', 'commutes')
      ORDER BY table_name;
    `;
    const res = await pool.query(verificationQuery);
    console.log('[Raahi DB Init] Verified active tables in public schema:', res.rows.map(r => r.table_name));
    
    process.exit(0);
  } catch (error) {
    console.error('[Raahi DB Init] ✗ Failed to initialize database:', error.message);
    process.exit(1);
  }
}

initDatabase();
