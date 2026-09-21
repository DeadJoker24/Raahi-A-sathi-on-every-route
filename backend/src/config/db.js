const { Pool } = require('pg');
require('dotenv').config();

// Create a PostgreSQL connection pool using the Neon DATABASE_URL
// Neon is serverless PostgreSQL running over SSL.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for secure SSL connection to Neon
  }
});

// Event listener for unexpected errors on idle clients
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
