import { useState, useEffect } from 'react';
import { diskService, DiskInfo } from '../services/diskService';

export const useSpecificDisk = (
  mountpoint: string = 'C:\\',
  autoRefresh: boolean = false, 
  refreshInterval: number = 30000
) => {
  const [diskInfo, setDiskInfo] = useState<DiskInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpecificDisk = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await diskService.getSpecificDisk(mountpoint);
      setDiskInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecificDisk();

    if (autoRefresh) {
      const interval = setInterval(fetchSpecificDisk, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [mountpoint, autoRefresh, refreshInterval]);

  return {
    diskInfo,
    loading,
    error,
    refetch: fetchSpecificDisk
  };
};