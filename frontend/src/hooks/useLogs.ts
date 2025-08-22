import { useState, useEffect, useCallback } from 'react';
import { logsService, LogData, PaginationData } from '../services/logsService';

interface UseLogsReturn {
  logs: LogData[];
  pagination: PaginationData | null;
  loading: boolean;
  error: string | null;
  loadLogs: (page: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useLogs = (): UseLogsReturn => {
  const [logs, setLogs] = useState<LogData[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadLogs = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError(null);
  const data = await logsService.getLogs(page, 100);
      setLogs(data.logs);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar logs';
      setError(errorMessage);
      console.error('Erro ao carregar logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadLogs(currentPage);
  }, [loadLogs, currentPage]);

  useEffect(() => {
    loadLogs(1);
  }, [loadLogs]);

  return {
    logs,
    pagination,
    loading,
    error,
    loadLogs,
    refresh
  };
};
