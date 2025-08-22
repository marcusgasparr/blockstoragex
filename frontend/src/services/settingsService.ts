import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export interface SystemSettings {
  current_disk: string;
  [key: string]: any;
}

export interface SettingDetail {
  value: string;
  description: string;
  updated_at: string;
}

export interface AllSettings {
  [key: string]: SettingDetail;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

class SettingsServiceApi {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/settings`;
  }

  // Obter disco atual
  async getCurrentDisk(): Promise<string> {
    try {
      console.log('🔍 Buscando disco atual do servidor...');
      
      const response = await axios.get<ApiResponse<SystemSettings>>(`${this.baseURL}/current-disk`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erro ao obter disco atual');
      }
      
      console.log('✅ Disco atual obtido:', response.data.data.current_disk);
      return response.data.data.current_disk;
      
    } catch (error) {
      console.error('❌ Erro ao buscar disco atual:', error);
      
      // Fallback para localStorage se o servidor falhar
      const localDisk = localStorage.getItem('selectedDrive') || 'C:\\';
      console.log('🔄 Usando disco local como fallback:', localDisk);
      return localDisk;
    }
  }

  // Atualizar disco atual
  async updateCurrentDisk(diskPath: string): Promise<boolean> {
    try {
      console.log('💾 Salvando disco no servidor:', diskPath);
      
      const response = await axios.put<ApiResponse<SystemSettings>>(`${this.baseURL}/current-disk`, {
        diskPath
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erro ao salvar disco');
      }
      
      console.log('✅ Disco salvo no servidor com sucesso');
      
      // Também salvar no localStorage como backup
      localStorage.setItem('selectedDrive', diskPath);
      
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao salvar disco no servidor:', error);
      
      // Se falhar no servidor, pelo menos salvar no localStorage
      localStorage.setItem('selectedDrive', diskPath);
      console.log('🔄 Disco salvo apenas localmente como fallback');
      
      return false;
    }
  }

  // Obter todas as configurações
  async getAllSettings(): Promise<AllSettings> {
    try {
      console.log('🔍 Buscando todas as configurações...');
      
      const response = await axios.get<ApiResponse<AllSettings>>(`${this.baseURL}/all`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erro ao obter configurações');
      }
      
      console.log('✅ Configurações obtidas:', response.data.count, 'itens');
      return response.data.data;
      
    } catch (error) {
      console.error('❌ Erro ao buscar configurações:', error);
      throw new Error('Falha na comunicação com o servidor');
    }
  }

  // Atualizar múltiplas configurações
  async updateSettings(settings: Record<string, any>): Promise<boolean> {
    try {
      console.log('💾 Salvando configurações no servidor...');
      
      const response = await axios.put<ApiResponse<any>>(`${this.baseURL}/bulk`, {
        settings
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Erro ao salvar configurações');
      }
      
      console.log('✅ Configurações salvas com sucesso');
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error);
      throw new Error('Falha na comunicação com o servidor');
    }
  }

  // Sincronizar disco local com servidor
  async syncDiskWithServer(): Promise<string> {
    try {
      // Buscar disco do servidor
      const serverDisk = await this.getCurrentDisk();
      const localDisk = localStorage.getItem('selectedDrive');
      
      console.log('🔄 Sincronizando disco - Servidor:', serverDisk, 'Local:', localDisk);
      
      if (localDisk && localDisk !== serverDisk) {
        // Se o local for diferente do servidor, atualizar o servidor
        console.log('⚠️ Discos diferentes, atualizando servidor...');
        await this.updateCurrentDisk(localDisk);
        return localDisk;
      } else {
        // Se forem iguais ou local não existir, usar o do servidor
        localStorage.setItem('selectedDrive', serverDisk);
        return serverDisk;
      }
      
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      // Em caso de erro, usar o local ou padrão
      return localStorage.getItem('selectedDrive') || 'C:\\';
    }
  }

  // Verificar conectividade com o servidor
  async checkServerHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data.status === 'OK';
    } catch (error) {
      console.error('❌ Servidor não está respondendo:', error);
      return false;
    }
  }
}

export const settingsService = new SettingsServiceApi();