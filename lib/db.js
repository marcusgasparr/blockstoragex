import mysql from "mysql2/promise";

// Pool de conexões para melhor performance
let pool = null;

export async function getConnection() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "mysql",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "123456",
      database: process.env.DB_NAME || "blockstoragex",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }

  return pool;
}

// Funções auxiliares para queries comuns
export async function query(sql, params) {
  const connection = await getConnection();
  const [results] = await connection.execute(sql, params);
  return results;
}

export async function getOne(sql, params) {
  const results = await query(sql, params);
  return results[0] || null;
}

export async function insert(table, data) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => "?").join(", ");

  const sql = `INSERT INTO ${table} (${keys.join(
    ", "
  )}) VALUES (${placeholders})`;
  const result = await query(sql, values);
  return result.insertId;
}

export async function update(table, data, where, whereParams = []) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map((key) => `${key} = ?`).join(", ");

  const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
  const result = await query(sql, [...values, ...whereParams]);
  return result.affectedRows;
}

export async function remove(table, where, params = []) {
  const sql = `DELETE FROM ${table} WHERE ${where}`;
  const result = await query(sql, params);
  return result.affectedRows;
}
