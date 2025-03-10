const { Pool } = require("pg");
require("dotenv").config();

// Improved database connection configuration with proper SSL handling and connection limits
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:
    process.env.DB_SSL === "true"
      ? {
          rejectUnauthorized: process.env.NODE_ENV === "production", // Only reject unauthorized in production
          ca: process.env.DB_CA_CERT || undefined, // Optional CA certificate
        }
      : false,
  // Connection pool configuration
  max: parseInt(process.env.DB_POOL_MAX || "20"), // Maximum number of clients
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // How long to wait for a connection
});

// Add error handling for the connection pool
pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
});

// Test the connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection error:", err.stack);
  } else {
    console.log("Database connected successfully at:", res.rows[0].now);
  }
});

// Improved query function with error handling
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

module.exports = {
  query,
  pool,
};
