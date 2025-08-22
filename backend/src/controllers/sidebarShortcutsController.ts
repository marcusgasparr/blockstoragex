import { Request, Response } from 'express';
import { SidebarShortcut, SidebarShortcutData } from '../lib/models/SidebarShortcut';

export class SidebarShortcutsController {
  /**
   * GET /api/sidebar-shortcuts/user/:userId
   * Buscar todos os atalhos de um usuário
   */
  static async getUserShortcuts(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'ID do usuário inválido'
        });
      }

      const shortcuts = await SidebarShortcut.getUserShortcuts(userId);
      
      res.json({
        success: true,
        data: shortcuts
      });
    } catch (error) {
      console.error('Erro ao buscar atalhos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * POST /api/sidebar-shortcuts
   * Criar novo atalho
   */
  static async createShortcut(req: Request, res: Response) {
    try {
      const { user_id, shortcut_name, shortcut_path, icon } = req.body;

      // Validações
      if (!user_id || !shortcut_name || !shortcut_path) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: user_id, shortcut_name, shortcut_path'
        });
      }

      // Validar se o nome do atalho não está vazio
      if (shortcut_name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nome do atalho não pode estar vazio'
        });
      }

      // Validar URL básica
      try {
        new URL(shortcut_path);
      } catch {
        return res.status(400).json({
          success: false,
          message: 'URL inválida. Use um formato como: https://exemplo.com'
        });
      }

      // Obter próximo sort_order
      const sort_order = await SidebarShortcut.getNextSortOrder(user_id);

      const shortcutData: Omit<SidebarShortcutData, 'id' | 'created_at' | 'updated_at'> = {
        user_id,
        shortcut_name: shortcut_name.trim(),
        shortcut_path: shortcut_path.trim(),
        icon: icon || 'fas fa-external-link-alt',
        sort_order,
        is_active: true
      };

      const shortcutId = await SidebarShortcut.create(shortcutData);

      res.status(201).json({
        success: true,
        data: {
          id: shortcutId,
          ...shortcutData
        },
        message: 'Atalho criado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao criar atalho:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * PUT /api/sidebar-shortcuts/:id
   * Atualizar atalho existente
   */
  static async updateShortcut(req: Request, res: Response) {
    try {
      const shortcutId = parseInt(req.params.id);
      const { user_id, shortcut_name, shortcut_path, icon, sort_order } = req.body;

      if (isNaN(shortcutId)) {
        return res.status(400).json({
          success: false,
          message: 'ID do atalho inválido'
        });
      }

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'user_id é obrigatório'
        });
      }

      // Verificar se o atalho pertence ao usuário
      const belongsToUser = await SidebarShortcut.belongsToUser(shortcutId, user_id);
      if (!belongsToUser) {
        return res.status(404).json({
          success: false,
          message: 'Atalho não encontrado'
        });
      }

      // Preparar dados para atualização
      const updateData: Partial<SidebarShortcutData> = {};
      
      if (shortcut_name !== undefined) {
        if (shortcut_name.trim().length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Nome do atalho não pode estar vazio'
          });
        }
        updateData.shortcut_name = shortcut_name.trim();
      }

      if (shortcut_path !== undefined) {
        try {
          new URL(shortcut_path);
          updateData.shortcut_path = shortcut_path.trim();
        } catch {
          return res.status(400).json({
            success: false,
            message: 'URL inválida'
          });
        }
      }

      if (icon !== undefined) updateData.icon = icon;
      if (sort_order !== undefined) updateData.sort_order = sort_order;

      const updated = await SidebarShortcut.update(shortcutId, user_id, updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Atalho não encontrado ou não foi possível atualizar'
        });
      }

      res.json({
        success: true,
        message: 'Atalho atualizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar atalho:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * DELETE /api/sidebar-shortcuts/:id
   * Excluir atalho
   */
  static async deleteShortcut(req: Request, res: Response) {
    try {
      const shortcutId = parseInt(req.params.id);
      const { user_id } = req.body;

      if (isNaN(shortcutId)) {
        return res.status(400).json({
          success: false,
          message: 'ID do atalho inválido'
        });
      }

      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'user_id é obrigatório'
        });
      }

      const deleted = await SidebarShortcut.delete(shortcutId, user_id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Atalho não encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Atalho excluído com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir atalho:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * PUT /api/sidebar-shortcuts/reorder
   * Reordenar atalhos
   */
  static async reorderShortcuts(req: Request, res: Response) {
    try {
      const { user_id, shortcut_ids } = req.body;

      if (!user_id || !Array.isArray(shortcut_ids)) {
        return res.status(400).json({
          success: false,
          message: 'user_id e shortcut_ids (array) são obrigatórios'
        });
      }

      // Validar que todos os IDs são números
      const validIds = shortcut_ids.every(id => Number.isInteger(id));
      if (!validIds) {
        return res.status(400).json({
          success: false,
          message: 'Todos os IDs devem ser números inteiros'
        });
      }

      await SidebarShortcut.reorder(user_id, shortcut_ids);

      res.json({
        success: true,
        message: 'Atalhos reordenados com sucesso'
      });
    } catch (error) {
      console.error('Erro ao reordenar atalhos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}
