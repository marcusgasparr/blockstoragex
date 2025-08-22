"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = void 0;
const db_1 = require("../db");
class Log {
    static async logAction(logData) {
        try {
            const result = await (0, db_1.insert)('logs', {
                user_id: logData.userId || null,
                action_type: logData.actionType || 'DELETE',
                file_path: logData.filePath,
                file_name: logData.fileName || null,
                ip_address: logData.ipAddress || null,
                user_agent: logData.userAgent || null,
                details: logData.details ? JSON.stringify(logData.details) : null
            });
            console.log('[LOG INSERT]', { logData, result });
            return result;
        }
        catch (err) {
            console.error('[LOG ERROR]', err, logData);
            throw err;
        }
    }
    static async getDeleteLogs(limit = 100) {
        return await (0, db_1.query)(`SELECT l.*, u.username 
       FROM logs l 
       LEFT JOIN users u ON l.user_id = u.id 
       WHERE l.action_type = 'DELETE' 
       ORDER BY l.created_at DESC 
       LIMIT ?`, [limit]);
    }
    static async getUserLogs(userId, limit = 50) {
        return await (0, db_1.query)(`SELECT * FROM logs 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`, [userId, limit]);
    }
}
exports.Log = Log;
