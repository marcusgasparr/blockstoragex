import axios from "axios";

const API_BASE_URL = "http://localhost:3001/api";

export interface FileSystemItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: Date;
  extension?: string;
  icon?: string;
  isStarred?: boolean;
  exists?: boolean; // <-- Adicione esta linha
}

export interface DirectoryContent {
  currentPath: string;
  parentPath: string | null;
  items: FileSystemItem[];
  totalItems: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  message?: string;
}

export interface FavoriteItem {
  file_name: string;
  file_path: string;
  isDirectory: boolean;
  size: number;
  modified?: string;
  created_at?: string;
  file_type?: string;
  exists?: boolean;
}

class FileSystemServiceApi {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/files`;
  }

  async getDirectoryContents(
    path: string = "C:\\Users"
  ): Promise<DirectoryContent> {
    try {
      const response = await axios.get<ApiResponse<DirectoryContent>>(
        `${this.baseURL}/directory?path=${encodeURIComponent(path)}`
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Erro ao obter conteúdo do diretório"
        );
      }

      return response.data.data;
    } catch (error) {
      console.error("Erro ao buscar conteúdo do diretório:", error);
      throw new Error("Falha na comunicação com o servidor");
    }
  }

  async createDirectory(name: string, path: string): Promise<boolean> {
    try {
      const response = await axios.post<ApiResponse<{ created: boolean }>>(
        `${this.baseURL}/create-directory`,
        { path, name }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Erro ao criar diretório");
      }

      return response.data.data.created;
    } catch (error) {
      console.error("Erro ao criar diretório:", error);
      throw new Error("Falha ao criar diretório");
    }
  }

  async deleteItem(path: string): Promise<boolean> {
    try {
      const response = await axios.delete<ApiResponse<{ deleted: boolean }>>(
        `${this.baseURL}/delete`,
        { data: { path } }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Erro ao excluir item");
      }

      return response.data.data.deleted;
    } catch (error) {
      console.error("Erro ao excluir item:", error);
      throw new Error("Falha ao excluir item");
    }
  }

  async renameItem(path: string, newName: string): Promise<boolean> {
    try {
      const response = await axios.put<ApiResponse<{ renamed: boolean }>>(
        `${this.baseURL}/rename`,
        { path, newName }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Erro ao renomear item");
      }

      return response.data.data.renamed;
    } catch (error) {
      console.error("Erro ao renomear item:", error);
      throw new Error("Falha ao renomear item");
    }
  }

  async moveItem(sourcePath: string, destinationDir: string): Promise<boolean> {
    try {
      const response = await axios.post<ApiResponse<{ moved: boolean }>>(
        `${this.baseURL}/move`,
        { sourcePath, destinationDir }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Erro ao mover item");
      }

      return response.data.data.moved;
    } catch (error) {
      console.error("Erro ao mover item:", error);
      throw new Error("Falha ao mover item");
    }
  }

  async copyItem(sourcePath: string, destinationDir: string): Promise<boolean> {
    try {
      const response = await axios.post<ApiResponse<{ copied: boolean }>>(
        `${this.baseURL}/copy`,
        { sourcePath, destinationDir }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Erro ao copiar item");
      }

      return response.data.data.copied;
    } catch (error) {
      console.error("Erro ao copiar item:", error);
      throw new Error("Falha ao copiar item");
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  async toggleStar(path: string): Promise<boolean> {
    try {
      const response = await axios.post<ApiResponse<{ starred: boolean }>>(
        `${this.baseURL}/toggle-star`,
        { path }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Erro ao favoritar item");
      }

      return response.data.data.starred;
    } catch (error) {
      console.error("Erro ao favoritar item:", error);
      throw new Error("Falha ao favoritar item");
    }
  }

  async setFolderColor(path: string, color: string): Promise<boolean> {
    try {
      const response = await axios.post<ApiResponse<{ colorSet: boolean }>>(
        `${this.baseURL}/set-folder-color`,
        { path, color }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Erro ao definir cor da pasta"
        );
      }

      return response.data.data.colorSet === true;
    } catch (error: any) {
      console.error("Erro ao definir cor da pasta:", error);
      const serverMsg = error?.response?.data?.message;
      throw new Error(serverMsg || "Falha ao definir cor da pasta");
    }
  }

  async getAllStarredItems(rootPath: string = "H:\\"): Promise<FileSystemItem[]> {
    try {
      const response = await axios.get<ApiResponse<FavoriteItem[]>>(
        `${this.baseURL}/starred?rootPath=${encodeURIComponent(rootPath)}`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Erro ao buscar favoritos");
      }
      const favorites = response.data.data;
      const starredFiles: FileSystemItem[] = favorites.map(fav => ({
        name: fav.file_name,
        path: fav.file_path,
        type: fav.isDirectory ? 'directory' : 'file',
        size: fav.size,
        modified: new Date(fav.modified ?? fav.created_at ?? Date.now()), // <-- Corrigido aqui
        extension: fav.file_type || undefined,
        icon: getFileIcon(fav.file_name, fav.isDirectory),
        isStarred: true,
        exists: fav.exists
      } as FileSystemItem));
      return starredFiles;
    } catch (error) {
      console.error("Erro ao buscar favoritos:", error);
      throw new Error("Falha ao buscar favoritos");
    }
  }

  async searchFiles(query: string, rootPath: string): Promise<FileSystemItem[]> {
    try {
      const response = await axios.get<ApiResponse<FileSystemItem[]>>(
        `${this.baseURL}/search?query=${encodeURIComponent(query)}&rootPath=${encodeURIComponent(rootPath)}`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Erro ao buscar arquivos");
      }
      return response.data.data;
    } catch (error) {
      console.error("Erro ao buscar arquivos:", error);
      throw new Error("Falha ao buscar arquivos");
    }
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Hoje";
    if (diffDays === 2) return "Ontem";
    if (diffDays <= 7) return `${diffDays - 1} dias atrás`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} semanas atrás`;

    return new Date(date).toLocaleDateString("pt-BR");
  }
}

function getFileIcon(fileName: string, isDirectory: boolean): string {
  if (isDirectory) return 'fas fa-folder';
  const extension = fileName.split('.').pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    'txt': 'fas fa-file-alt',
    'doc': 'fas fa-file-word', 'docx': 'fas fa-file-word',
    'pdf': 'fas fa-file-pdf',
    'jpg': 'fas fa-file-image', 'jpeg': 'fas fa-file-image', 'png': 'fas fa-file-image', 'gif': 'fas fa-file-image',
    'mp4': 'fas fa-file-video', 'avi': 'fas fa-file-video', 'mov': 'fas fa-file-video',
    'mp3': 'fas fa-file-audio', 'wav': 'fas fa-file-audio', 'flac': 'fas fa-file-audio',
    'zip': 'fas fa-file-archive', 'rar': 'fas fa-file-archive', '7z': 'fas fa-file-archive',
    'exe': 'fas fa-cog', 'msi': 'fas fa-cog'
  };
  return iconMap[extension || ''] || 'fas fa-file';
}

export const fileSystemService = new FileSystemServiceApi();