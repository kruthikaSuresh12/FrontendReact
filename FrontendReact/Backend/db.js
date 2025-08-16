// db.js
import mysql from 'mysql2/promise'; // Note the /promise import
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST ,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
db.getConnection()
  .then(connection => {
    console.log('Connected to MySQL DB');
    connection.release();
  })
  .catch(err => {
    console.error('DB connection failed:', err);
  });

export default db;