import mysql2 from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const connection = mysql2.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE_NAME,
  connectionLimit: 10,
});

connection.getConnection((err, connection) => {
  if (err) {
    console.log(err);
    throw err;
  } else {
    console.log(`Connected to MySQL Pool as id ${connection.threadId}`);
    connection.release();
  }
});

export default connection;
