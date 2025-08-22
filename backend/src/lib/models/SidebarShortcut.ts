import { getConnection } from '../db';
import { RowDataPacket } from 'mysql2';

export interface SidebarShortcutData {
  id?: number;
  user_id: number;
  shortcut_name: string;
  shortcut_path: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export class SidebarShortcut {
  /**
   * Buscar todos os atalhos de um usuário
   */
  static async getUserShortcuts(userId: number): Promise<SidebarShortcutData[]> {
    const query = `
      SELECT 
        id, user_id, shortcut_name, shortcut_path, 
        icon, sort_order, is_active, created_at, updated_at
      FROM sidebarShortcuts 
      WHERE user_id = ? AND is_active = true
      ORDER BY sort_order ASC, created_at ASC
    `;
    
    const pool = await getConnection();
    const [rows] = await pool.execute<RowDataPacket[]>(query, [userId]);
    return rows as SidebarShortcutData[];
  }

  /**
   * Criar novo atalho
   */
  static async create(shortcutData: Omit<SidebarShortcutData, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const {
      user_id,
      shortcut_name,
      shortcut_path,
      icon = 'fas fa-external-link-alt',
      sort_order = 0,
      is_active = true
    } = shortcutData;

    const query = `
      INSERT INTO sidebarShortcuts 
      (user_id, shortcut_name, shortcut_path, icon, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const pool = await getConnection();
    const [result] = await pool.execute<any>(query, [
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
  static async update(id: number, userId: number, data: Partial<SidebarShortcutData>): Promise<boolean> {
    const allowedFields = ['shortcut_name', 'shortcut_path', 'icon', 'sort_order', 'is_active'];
    const updateFields = Object.keys(data).filter(key => allowedFields.includes(key));
    
    if (updateFields.length === 0) {
      throw new Error('Nenhum campo válido para atualizar');
    }

    const setClause = updateFields.map(field => `${field} = ?`).join(', ');
    const values = updateFields.map(field => data[field as keyof SidebarShortcutData]);
    
    const query = `
      UPDATE sidebarShortcuts 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `;

    const pool = await getConnection();
    const [result] = await pool.execute<any>(query, [...values, id, userId]);
    return result.affectedRows > 0;
  }

  /**
   * Excluir atalho (soft delete)
   */
  static async delete(id: number, userId: number): Promise<boolean> {
    const query = `
      UPDATE sidebarShortcuts 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `;

    const pool = await getConnection();
    const [result] = await pool.execute<any>(query, [id, userId]);
    return result.affectedRows > 0;
  }

  /**
   * Reordenar atalhos
   */
  static async reorder(userId: number, shortcutIds: number[]): Promise<boolean> {
    const pool = await getConnection();
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
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Verificar se um atalho pertence a um usuário
   */
  static async belongsToUser(id: number, userId: number): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count 
      FROM sidebarShortcuts 
      WHERE id = ? AND user_id = ? AND is_active = true
    `;

    const pool = await getConnection();
    const [rows] = await pool.execute<RowDataPacket[]>(query, [id, userId]);
    return rows[0].count > 0;
  }

  /**
   * Obter próximo sort_order para um usuário
   */
  static async getNextSortOrder(userId: number): Promise<number> {
    const query = `
      SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order
      FROM sidebarShortcuts 
      WHERE user_id = ? AND is_active = true
    `;

    const pool = await getConnection();
    const [rows] = await pool.execute<RowDataPacket[]>(query, [userId]);
    return rows[0].next_order;
  }
}