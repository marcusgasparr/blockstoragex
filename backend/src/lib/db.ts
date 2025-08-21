import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export async function getConnection(): Promise<mysql.Pool> {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'blockstoragex',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
}

export async function query(sql: string, params: any[] = []) {
  const connection = await getConnection();
  const [results] = await connection.execute(sql, params);
  return results;
}

export async function getOne(sql: string, params: any[] = []) {
  const results = await query(sql, params);
  return (results as any[])[0] || null;
}

export async function insert(table: string, data: Record<string, any>) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(', ');
  
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
  const result = await query(sql, values) as any;
  return result.insertId;
}