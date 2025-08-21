import { insert, query } from '../db';

export class Log {
  static async logAction(logData) {
    return await insert('logs', {
      user_id: logData.userId || null,
      action_type: logData.actionType || 'DELETE',
      file_path: logData.filePath,
      file_name: logData.fileName || null,
      ip_address: logData.ipAddress || null,
      user_agent: logData.userAgent || null,
      details: logData.details ? JSON.stringify(logData.details) : null
    });
  }

  static async getDeleteLogs(limit = 100) {
    return await query(
      `SELECT l.*, u.username 
       FROM logs l 
       LEFT JOIN users u ON l.user_id = u.id 
       WHERE l.action_type = 'DELETE' 
       ORDER BY l.created_at DESC 
       LIMIT ?`,
      [limit]
    );
  }

  static async getUserLogs(userId, limit = 50) {
    return await query(
      `SELECT * FROM logs 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, limit]
    );
  }
}