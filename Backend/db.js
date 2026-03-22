import dotenv from 'dotenv';
import pg from 'pg';

// Load the hidden variables from the .env file
dotenv.config();

// Extract Pool from the pg library
const { Pool } = pg;

// Create the connection using the secure environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// Test the connection
pool.connect()
  .then(() => console.log('✅ Connected to the BeFit Database securely!'))
  .catch((err) => console.error('❌ Database connection error:', err.stack));

// Export it so other files can use it
export default pool;
