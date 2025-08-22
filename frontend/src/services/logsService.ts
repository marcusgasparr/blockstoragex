export interface LogData {
  id: number;
  user_id: number | null;
  action_type: string;
  file_path: string;
  file_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: any;
  created_at: string;
  username?: string | null;
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface LogsResponse {
  logs: LogData[];
  pagination: PaginationData;
}

class LogsService {
  private readonly API_URL = 'http://localhost:3001/api/logs';

  async getLogs(page: number = 1, pageSize: number = 100): Promise<LogsResponse> {
    try {
      const response = await fetch(`${this.API_URL}?page=${page}&pageSize=${pageSize}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao buscar logs');
      }

      return data.data;
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      throw error;
    }
  }
}

export const logsService = new LogsService();
