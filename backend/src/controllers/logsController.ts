import { Request, Response } from 'express';
import { getConnection } from '../lib/db';
import { RowDataPacket } from 'mysql2';

export interface LogData {
  id: number;
  user_id: number | null;
  action_type: string;
  file_path: string;
  file_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: any;
  created_at: string;
  username?: string | null;
}

export class LogsController {
  static async getLogs(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 100, 100);
      // Buscar os 1000 logs mais recentes
      const pool = await getConnection();
      const [latestLogs] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM logs ORDER BY created_at DESC LIMIT 1000`
      );
      const total = latestLogs.length;
      const totalPages = Math.ceil(total / pageSize);
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const logsPage = latestLogs.slice(start, end);

  // pool já declarado acima
      
      // Buscar info do usuário para os logs paginados
      const userIds = logsPage.map((log: any) => log.user_id).filter(Boolean);
      let usersMap: Record<number, string> = {};
      if (userIds.length) {
        const [users] = await pool.query<RowDataPacket[]>(
          `SELECT id, username FROM users WHERE id IN (${userIds.join(',')})`
        );
        usersMap = Object.fromEntries(users.map((u: any) => [u.id, u.username]));
      }
      const logsWithUser = logsPage.map((log: any) => ({
        ...log,
        username: log.user_id ? usersMap[log.user_id] || null : null
      }));
      res.json({
        success: true,
        data: {
          logs: logsWithUser,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: pageSize,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
    } catch (error: any) {
      console.error('Erro ao buscar logs:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'Erro interno do servidor',
        error: error
      });
    }
  }
}
