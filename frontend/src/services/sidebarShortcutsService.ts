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

export interface CreateShortcutData {
  shortcut_name: string;
  shortcut_path: string;
  icon?: string;
}

const API_BASE_URL = 'http://localhost:3001/api/sidebar-shortcuts';

class SidebarShortcutsService {
  /**
   * Buscar todos os atalhos de um usuário
   */
  async getUserShortcuts(userId: number = 1): Promise<SidebarShortcutData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${userId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao buscar atalhos');
      }

      return data.data || [];
    } catch (error) {
      console.error('Erro ao buscar atalhos:', error);
      throw error;
    }
  }

  /**
   * Criar novo atalho
   */
  async createShortcut(shortcutData: CreateShortcutData, userId: number = 1): Promise<SidebarShortcutData> {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          ...shortcutData
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao criar atalho');
      }

      return data.data;
    } catch (error) {
      console.error('Erro ao criar atalho:', error);
      throw error;
    }
  }

  /**
   * Atualizar atalho existente
   */
  async updateShortcut(
    shortcutId: number, 
    updateData: Partial<CreateShortcutData>, 
    userId: number = 1
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/${shortcutId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          ...updateData
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao atualizar atalho');
      }
    } catch (error) {
      console.error('Erro ao atualizar atalho:', error);
      throw error;
    }
  }

  /**
   * Excluir atalho
   */
  async deleteShortcut(shortcutId: number, userId: number = 1): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/${shortcutId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao excluir atalho');
      }
    } catch (error) {
      console.error('Erro ao excluir atalho:', error);
      throw error;
    }
  }

  /**
   * Reordenar atalhos
   */
  async reorderShortcuts(shortcutIds: number[], userId: number = 1): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          shortcut_ids: shortcutIds
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao reordenar atalhos');
      }
    } catch (error) {
      console.error('Erro ao reordenar atalhos:', error);
      throw error;
    }
  }
}

export const sidebarShortcutsService = new SidebarShortcutsService();
