"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidebarShortcut = void 0;
const db_1 = require("../db");
class SidebarShortcut {
    /**
     * Buscar todos os atalhos de um usuário
     */
    static async getUserShortcuts(userId) {
        const query = `
      SELECT 
        id, user_id, shortcut_name, shortcut_path, 
        icon, sort_order, is_active, created_at, updated_at
      FROM sidebarShortcuts 
      WHERE user_id = ? AND is_active = true
      ORDER BY sort_order ASC, created_at ASC
    `;
        const pool = await (0, db_1.getConnection)();
        const [rows] = await pool.execute(query, [userId]);
        return rows;
    }
    /**
     * Criar novo atalho
     */
    static async create(shortcutData) {
        const { user_id, shortcut_name, shortcut_path, icon = 'fas fa-external-link-alt', sort_order = 0, is_active = true } = shortcutData;
        const query = `
      INSERT INTO sidebarShortcuts 
      (user_id, shortcut_name, shortcut_path, icon, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
        const pool = await (0, db_1.getConnection)();
        const [result] = await pool.execute(query, [
            user_id,
            shortcut_name,
            shortcut_path,
            icon,
            sort_order,
            is_active
        ]);
        return result.insertId;
    }
    /**
     * Atualizar atalho existente
     */
    static async update(id, userId, data) {
        const allowedFields = ['shortcut_name', 'shortcut_path', 'icon', 'sort_order', 'is_active'];
        const updateFields = Object.keys(data).filter(key => allowedFields.includes(key));
        if (updateFields.length === 0) {
            throw new Error('Nenhum campo válido para atualizar');
        }
        const setClause = updateFields.map(field => `${field} = ?`).join(', ');
        const values = updateFields.map(field => data[field]);
        const query = `
      UPDATE sidebarShortcuts 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `;
        const pool = await (0, db_1.getConnection)();
        const [result] = await pool.execute(query, [...values, id, userId]);
        return result.affectedRows > 0;
    }
    /**
     * Excluir atalho (soft delete)
     */
    static async delete(id, userId) {
        const query = `
      UPDATE sidebarShortcuts 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `;
        const pool = await (0, db_1.getConnection)();
        const [result] = await pool.execute(query, [id, userId]);
        return result.affectedRows > 0;
    }
    /**
     * Reordenar atalhos
     */
    static async reorder(userId, shortcutIds) {
        const pool = await (0, db_1.getConnection)();
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            for (let i = 0; i < shortcutIds.length; i++) {
                const query = `
          UPDATE sidebarShortcuts 
          SET sort_order = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?
        `;
                await connection.execute(query, [i + 1, shortcutIds[i], userId]);
            }
            await connection.commit();
            return true;
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    /**
     * Verificar se um atalho pertence a um usuário
     */
    static async belongsToUser(id, userId) {
        const query = `
      SELECT COUNT(*) as count 
      FROM sidebarShortcuts 
      WHERE id = ? AND user_id = ? AND is_active = true
    `;
        const pool = await (0, db_1.getConnection)();
        const [rows] = await pool.execute(query, [id, userId]);
        return rows[0].count > 0;
    }
    /**
     * Obter próximo sort_order para um usuário
     */
    static async getNextSortOrder(userId) {
        const query = `
      SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order
      FROM sidebarShortcuts 
      WHERE user_id = ? AND is_active = true
    `;
        const pool = await (0, db_1.getConnection)();
        const [rows] = await pool.execute(query, [userId]);
        return rows[0].next_order;
    }
}
exports.SidebarShortcut = SidebarShortcut;
