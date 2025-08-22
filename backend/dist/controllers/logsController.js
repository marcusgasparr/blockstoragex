"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsController = void 0;
const db_1 = require("../lib/db");
class LogsController {
    static async getLogs(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = Math.min(parseInt(req.query.pageSize) || 100, 100);
            // Buscar os 1000 logs mais recentes
            const pool = await (0, db_1.getConnection)();
            const [latestLogs] = await pool.query(`SELECT * FROM logs ORDER BY created_at DESC LIMIT 1000`);
            const total = latestLogs.length;
            const totalPages = Math.ceil(total / pageSize);
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            const logsPage = latestLogs.slice(start, end);
            // pool já declarado acima
            // Buscar info do usuário para os logs paginados
            const userIds = logsPage.map((log) => log.user_id).filter(Boolean);
            let usersMap = {};
            if (userIds.length) {
                const [users] = await pool.query(`SELECT id, username FROM users WHERE id IN (${userIds.join(',')})`);
                usersMap = Object.fromEntries(users.map((u) => [u.id, u.username]));
            }
            const logsWithUser = logsPage.map((log) => ({
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
        }
        catch (error) {
            console.error('Erro ao buscar logs:', error);
            res.status(500).json({
                success: false,
                message: error?.message || 'Erro interno do servidor',
                error: error
            });
        }
    }
}
exports.LogsController = LogsController;
