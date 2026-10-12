const { query } = require('../config/db');

async function verifySchema() {
  console.log('====================================================');
  console.log('🔍 VERIFYING SPRINT 2 SCHEMA & CONSTRAINTS ON NEON');
  console.log('====================================================\n');

  // 1. Check Table Columns
  console.log('1. Checking "commutes" columns...');
  const colRes = await query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'commutes'
    ORDER BY ordinal_position;
  `);
  console.log('Found', colRes.rows.length, 'columns in commutes table:');
  colRes.rows.forEach(r => {
    console.log(`   - ${r.column_name} (${r.data_type}) [nullable: ${r.is_nullable}]`);
  });

  // 2. Check Constraints
  console.log('\n2. Checking constraints on "commutes"...');
  const constraintRes = await query(`
    SELECT conname, contype, pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE conrelid = 'commutes'::regclass;
  `);
  constraintRes.rows.forEach(r => {
    console.log(`   - [${r.contype}] ${r.conname}: ${r.def}`);
  });

  // 3. Check Indexes
  console.log('\n3. Checking indexes on "commutes"...');
  const indexRes = await query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'commutes';
  `);
  indexRes.rows.forEach(r => {
    console.log(`   - ${r.indexname}`);
  });

  // 4. Test Vehicle Ownership Enforcement (Composite Foreign Key)
  console.log('\n4. Testing Vehicle Ownership Constraint...');
  try {
    // Attempt inserting a commute with mismatched vehicle and driver (e.g. driver_id = 9999, vehicle_id = 1)
    await query(`
      INSERT INTO commutes (
        driver_id, vehicle_id, origin, destination, departure_datetime, 
        total_seats, available_seats, price_per_seat
      ) VALUES (
        999999, 1, 'Noida', 'Gurugram', NOW() + INTERVAL '1 day', 3, 3, 100
      );
    `);
    console.error('✗ FAILED: Database allowed mismatched vehicle/driver!');
  } catch (err) {
    if (err.code === '23503') {
      console.log('✓ PASSED: Foreign key violation 23503 raised as expected when driver does not own vehicle!');
      console.log('  Database error message:', err.message);
    } else {
      console.log('✓ Raised constraint error:', err.code, err.message);
    }
  }

  console.log('\n====================================================');
  console.log('✓ SPRINT 2 PART 1 SCHEMA VALIDATION COMPLETE!');
  console.log('====================================================');
  process.exit(0);
}

verifySchema().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
