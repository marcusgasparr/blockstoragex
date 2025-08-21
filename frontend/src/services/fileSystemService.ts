import axios from "axios";

const API_BASE_URL = "http://localhost:3001/api";

export interface FileSystemItem {
  name: string;
  path: string;
  type: "file" | "directory";
  size: number;
  modified: Date;
  extension?: string;
  icon: string;
  isStarred?: boolean;
  folderColor?: string;
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

  async createDirectory(path: string, name: string): Promise<boolean> {
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
      const response = await axios.post<ApiResponse<{ isStarred: boolean }>>(
        `${this.baseURL}/toggle-star`,
        { path }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Erro ao favoritar item");
      }

      return response.data.data.isStarred;
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
      // Preserva a mensagem específica do backend quando houver
      const serverMsg = error?.response?.data?.message;
      throw new Error(serverMsg || "Falha ao definir cor da pasta");
    }
  }

  async getAllStarredItems(rootPath: string = "H:\\"): Promise<FileSystemItem[]> {
    try {
      const response = await axios.get<ApiResponse<FileSystemItem[]>>(
        `${this.baseURL}/starred?rootPath=${encodeURIComponent(rootPath)}`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Erro ao buscar favoritos");
      }
      return response.data.data;
    } catch (error) {
      console.error("Erro ao buscar favoritos:", error);
      throw new Error("Falha ao buscar favoritos");
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

export const fileSystemService = new FileSystemServiceApi();
