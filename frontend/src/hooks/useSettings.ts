import { useState, useEffect, useCallback } from 'react';
import { settingsService, AllSettings } from '../services/settingsService';

interface UseSettingsReturn {
  currentDisk: string;
  settings: AllSettings | null;
  loading: boolean;
  error: string | null;
  updateCurrentDisk: (diskPath: string) => Promise<boolean>;
  updateSettings: (settings: Record<string, any>) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
  syncDisk: () => Promise<string>;
  serverOnline: boolean;
}

export const useSettings = (): UseSettingsReturn => {
  const [currentDisk, setCurrentDisk] = useState<string>(() => {
    return localStorage.getItem('selectedDrive') || 'C:\\';
  });
  const [settings, setSettings] = useState<AllSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverOnline, setServerOnline] = useState(false);

  // Verificar se servidor está online
  const checkServerStatus = useCallback(async () => {
    try {
      const online = await settingsService.checkServerHealth();
      setServerOnline(online);
      return online;
    } catch (error) {
      setServerOnline(false);
      return false;
    }
  }, []);

  // Carregar configurações
  const refreshSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const allSettings = await settingsService.getAllSettings();
      setSettings(allSettings);
      
      // Atualizar disco atual se existe nas configurações
      if (allSettings.current_disk) {
        const diskFromServer = allSettings.current_disk.value;
        setCurrentDisk(diskFromServer);
        localStorage.setItem('selectedDrive', diskFromServer);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar configurações';
      setError(errorMessage);
      console.error('❌ Erro ao carregar configurações:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar disco atual
  const updateCurrentDisk = useCallback(async (diskPath: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await settingsService.updateCurrentDisk(diskPath);
      
      if (success) {
        setCurrentDisk(diskPath);
        
        // Atualizar também nas configurações locais
        if (settings) {
          setSettings({
            ...settings,
            current_disk: {
              value: diskPath,
              description: 'Caminho do disco atualmente em uso',
              updated_at: new Date().toISOString()
            }
          });
        }
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar disco';
      setError(errorMessage);
      console.error('❌ Erro ao atualizar disco:', err);
      return false;
    }
  }, [settings]);

  // Atualizar múltiplas configurações
  const updateSettings = useCallback(async (newSettings: Record<string, any>): Promise<boolean> => {
    try {
      setError(null);
      const success = await settingsService.updateSettings(newSettings);
      
      if (success) {
        // Recarregar configurações para ter os dados atualizados
        await refreshSettings();
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar configurações';
      setError(errorMessage);
      console.error('❌ Erro ao atualizar configurações:', err);
      return false;
    }
  }, [refreshSettings]);

  // Sincronizar disco com servidor
  const syncDisk = useCallback(async (): Promise<string> => {
    try {
      setError(null);
      const syncedDisk = await settingsService.syncDiskWithServer();
      setCurrentDisk(syncedDisk);
      return syncedDisk;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na sincronização';
      setError(errorMessage);
      console.error('❌ Erro na sincronização:', err);
      return currentDisk; // Retorna o atual em caso de erro
    }
  }, [currentDisk]);

  // Effect para inicialização
  useEffect(() => {
    const initialize = async () => {
      console.log('🚀 Inicializando useSettings...');
      
      // Verificar servidor
      const online = await checkServerStatus();
      
      if (online) {
        // Se servidor estiver online, sincronizar e carregar configurações
        await syncDisk();
        await refreshSettings();
      } else {
        console.log('⚠️ Servidor offline, usando configurações locais');
      }
    };

    initialize();
  }, [checkServerStatus, syncDisk, refreshSettings]);

  // Effect para monitorar mudanças no localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedDrive' && e.newValue) {
        console.log('🔄 useSettings detectou mudança no localStorage:', e.newValue);
        setCurrentDisk(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    currentDisk,
    settings,
    loading,
    error,
    updateCurrentDisk,
    updateSettings,
    refreshSettings,
    syncDisk,
    serverOnline
  };
};