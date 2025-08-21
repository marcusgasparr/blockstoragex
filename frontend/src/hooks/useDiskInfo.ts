import { useState, useEffect } from 'react';
import { diskService, SystemDiskInfo } from '../services/diskService';

export const useDiskInfo = (autoRefresh: boolean = false, refreshInterval: number = 30000) => {
  const [diskInfo, setDiskInfo] = useState<SystemDiskInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiskInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await diskService.getDiskInfoFormatted();
      setDiskInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiskInfo();

    if (autoRefresh) {
      const interval = setInterval(fetchDiskInfo, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return {
    diskInfo,
    loading,
    error,
    refetch: fetchDiskInfo
  };
};
