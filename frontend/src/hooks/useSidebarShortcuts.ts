import { useState, useEffect, useCallback } from 'react';
import { 
  sidebarShortcutsService, 
  SidebarShortcutData, 
  CreateShortcutData 
} from '../services/sidebarShortcutsService';

interface UseSidebarShortcutsReturn {
  shortcuts: SidebarShortcutData[];
  loading: boolean;
  error: string | null;
  createShortcut: (data: CreateShortcutData) => Promise<boolean>;
  updateShortcut: (id: number, data: Partial<CreateShortcutData>) => Promise<boolean>;
  deleteShortcut: (id: number) => Promise<boolean>;
  reorderShortcuts: (shortcutIds: number[]) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export const useSidebarShortcuts = (userId: number = 1): UseSidebarShortcutsReturn => {
  const [shortcuts, setShortcuts] = useState<SidebarShortcutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para carregar atalhos
  const loadShortcuts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sidebarShortcutsService.getUserShortcuts(userId);
      setShortcuts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar atalhos';
      setError(errorMessage);
      console.error('Erro ao carregar atalhos:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Carregar atalhos na inicialização
  useEffect(() => {
    loadShortcuts();
  }, [loadShortcuts]);

  // Função para criar atalho
  const createShortcut = useCallback(async (data: CreateShortcutData): Promise<boolean> => {
    try {
      setError(null);
      await sidebarShortcutsService.createShortcut(data, userId);
      await loadShortcuts(); // Recarregar lista
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar atalho';
      setError(errorMessage);
      console.error('Erro ao criar atalho:', err);
      return false;
    }
  }, [userId, loadShortcuts]);

  // Função para atualizar atalho
  const updateShortcut = useCallback(async (
    id: number, 
    data: Partial<CreateShortcutData>
  ): Promise<boolean> => {
    try {
      setError(null);
      await sidebarShortcutsService.updateShortcut(id, data, userId);
      await loadShortcuts(); // Recarregar lista
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar atalho';
      setError(errorMessage);
      console.error('Erro ao atualizar atalho:', err);
      return false;
    }
  }, [userId, loadShortcuts]);

  // Função para excluir atalho
  const deleteShortcut = useCallback(async (id: number): Promise<boolean> => {
    try {
      setError(null);
      await sidebarShortcutsService.deleteShortcut(id, userId);
      await loadShortcuts(); // Recarregar lista
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir atalho';
      setError(errorMessage);
      console.error('Erro ao excluir atalho:', err);
      return false;
    }
  }, [userId, loadShortcuts]);

  // Função para reordenar atalhos
  const reorderShortcuts = useCallback(async (shortcutIds: number[]): Promise<boolean> => {
    try {
      setError(null);
      await sidebarShortcutsService.reorderShortcuts(shortcutIds, userId);
      await loadShortcuts(); // Recarregar lista
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao reordenar atalhos';
      setError(errorMessage);
      console.error('Erro ao reordenar atalhos:', err);
      return false;
    }
  }, [userId, loadShortcuts]);

  // Função para refresh manual
  const refresh = useCallback(async () => {
    await loadShortcuts();
  }, [loadShortcuts]);

  return {
    shortcuts,
    loading,
    error,
    createShortcut,
    updateShortcut,
    deleteShortcut,
    reorderShortcuts,
    refresh
  };
};
