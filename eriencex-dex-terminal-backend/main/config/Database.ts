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

function handleConnection(err: any, conn: any) {
  if (err) {
    console.log("Error connecting to MySQL:", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.log("Reconnecting to MySQL...");
      connection.getConnection(handleConnection);
    } else {
      throw err;
    }
  } else {
    console.log(`Connected to MySQL Pool as id ${conn.threadId}`);
    conn.release();
  }
}

connection.getConnection(handleConnection);

module.exports = connection;
