import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export interface DiskInfo {
  filesystem: string;
  size: number;
  used: number;
  available: number;
  capacity: number;
  mountpoint: string;
  type: string;
  sizeFormatted?: string;
  usedFormatted?: string;
  availableFormatted?: string;
}

export interface SystemDiskInfo {
  disks: DiskInfo[];
  totalSize: number;
  totalUsed: number;
  totalAvailable: number;
  totalSizeFormatted?: string;
  totalUsedFormatted?: string;
  totalAvailableFormatted?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  message?: string;
}

class DiskServiceApi {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/disk`;
  }

  async getDiskInfo(): Promise<SystemDiskInfo> {
    try {
      const response = await axios.get<ApiResponse<SystemDiskInfo>>(`${this.baseURL}/info`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erro ao obter informações do disco');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Erro ao buscar informações do disco:', error);
      throw new Error('Falha na comunicação com o servidor');
    }
  }

  async getDiskInfoFormatted(): Promise<SystemDiskInfo> {
    try {
      const response = await axios.get<ApiResponse<SystemDiskInfo>>(`${this.baseURL}/info-formatted`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erro ao obter informações do disco');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Erro ao buscar informações formatadas do disco:', error);
      throw new Error('Falha na comunicação com o servidor');
    }
  }

  async checkServerHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data.status === 'OK';
    } catch (error) {
      console.error('Servidor não está respondendo:', error);
      return false;
    }
  }

  async getSpecificDisk(mountpoint: string = 'C:\\'): Promise<DiskInfo> {
  try {
    const response = await axios.get<ApiResponse<DiskInfo>>(
      `${this.baseURL}/specific?mountpoint=${encodeURIComponent(mountpoint)}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Erro ao obter disco específico');
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Erro ao buscar disco específico:', error);
    throw new Error('Falha na comunicação com o servidor');
  }
}

}

export const diskService = new DiskServiceApi();
