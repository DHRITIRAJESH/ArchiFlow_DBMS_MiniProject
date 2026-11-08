import mysql from "mysql2/promise";

// Reuse one pool in dev so hot-reload doesn't open new connections each time
const g = globalThis;

export const pool =
  g._archiflowPool ??
  mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  });

if (process.env.NODE_ENV !== "production") g._archiflowPool = pool;

// Always pass user input through `params`, never inside the SQL string
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}
