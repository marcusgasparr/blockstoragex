"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnection = getConnection;
exports.query = query;
exports.getOne = getOne;
exports.insert = insert;
const promise_1 = __importDefault(require("mysql2/promise"));
let pool = null;
async function getConnection() {
    if (!pool) {
        pool = promise_1.default.createPool({
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
async function query(sql, params = []) {
    const connection = await getConnection();
    const [results] = await connection.execute(sql, params);
    return results;
}
async function getOne(sql, params = []) {
    const results = await query(sql, params);
    return results[0] || null;
}
async function insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const result = await query(sql, values);
    return result.insertId;
}
