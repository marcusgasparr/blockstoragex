import axios from "axios";
import { API_BASE_URL as BASE_URL } from "../config/api";

const API_BASE_URL = `${BASE_URL}/favorites-db`;

export interface FavoriteItem {
  id: number;
  file_path: string;
  file_name: string;
  file_type: string;
  created_at: string;
  exists: boolean;
  size: number;
  modified: string | null;
  isDirectory: boolean;
}

export interface FavoriteToggleResult {
  action: "added" | "removed";
  favoriteId: number;
  isFavorite: boolean;
}

export interface FavoriteCheckResult {
  isFavorite: boolean;
  favoriteId: number | null;
  createdAt: string | null;
}

export interface FavoriteStats {
  total: number;
  files: number;
  folders: number;
  oldest: string | null;
  newest: string | null;
  topTypes: { file_type: string; count: number }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

class FavoritesServiceApi {
  private baseURL: string;
  private defaultUserId: number = 1; // Por enquanto usar usuário padrão

  constructor() {
    this.baseURL = API_BASE_URL;

    // Configurar timeout padrão para todas as requisições
    axios.defaults.timeout = 10000; // 10 segundos
  }

  // Método privado para validar conectividade antes de operações críticas
  private async ensureServerConnection(): Promise<void> {
    const isHealthy = await this.checkServerHealth();
    if (!isHealthy) {
      throw new Error("Servidor não está disponível no momento");
    }
  }

  // Obter todos os favoritos de um usuário
  async getUserFavorites(
    userId: number = this.defaultUserId,
    rootPath?: string
  ): Promise<FavoriteItem[]> {
    try {
      // Validar entrada
      if (!userId || userId <= 0) {
        throw new Error("ID do usuário inválido");
      }

      console.log(
        "🌟 Buscando favoritos do usuário:",
        userId,
        "rootPath:",
        rootPath
      );

      const url = `${this.baseURL}/user/${userId}${
        rootPath ? `?rootPath=${encodeURIComponent(rootPath)}` : ""
      }`;

      const response = await this.retryOperation(async () => {
        return await axios.get<ApiResponse<FavoriteItem[]>>(url);
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Erro ao buscar favoritos");
      }

      console.log("✅ Favoritos obtidos:", response.data.data.length);
      return response.data.data;
    } catch (error) {
      console.error("❌ Erro ao buscar favoritos:", error);
      throw new Error("Falha na comunicação com o servidor");
    }
  }

  // Alternar favorito (adicionar/remover)
  async toggleFavorite(
    filePath: string,
    fileName?: string,
    fileType?: string,
    userId: number = this.defaultUserId
  ): Promise<FavoriteToggleResult> {
    try {
      // Validar entrada
      if (!FavoritesServiceApi.isValidFilePath(filePath)) {
        throw new Error("Caminho do arquivo inválido");
      }

      if (!userId || userId <= 0) {
        throw new Error("ID do usuário inválido");
      }

      // Determinar nome e tipo se não fornecidos
      const effectiveFileName =
        fileName || FavoritesServiceApi.getFileName(filePath);
      const effectiveFileType =
        fileType || FavoritesServiceApi.getFileType(filePath);

      console.log("⭐ Alternando favorito:", {
        filePath,
        fileName: effectiveFileName,
        fileType: effectiveFileType,
        userId,
      });

      const response = await this.retryOperation(async () => {
        return await axios.post<ApiResponse<FavoriteToggleResult>>(
          `${this.baseURL}/toggle`,
          {
            userId,
            filePath,
            fileName: effectiveFileName,
            fileType: effectiveFileType,
          }
        );
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Erro ao alternar favorito");
      }

      console.log("✅ Favorito alternado:", response.data.data.action);
      return response.data.data;
    } catch (error) {
      console.error("❌ Erro ao alternar favorito:", error);
      throw new Error("Falha na comunicação com o servidor");
    }
  }

  // Verificar se um arquivo é favorito
  async checkFavorite(
    filePath: string,
    userId: number = this.defaultUserId
  ): Promise<FavoriteCheckResult> {
    try {
      // Validar entrada
      if (!FavoritesServiceApi.isValidFilePath(filePath)) {
        throw new Error("Caminho do arquivo inválido");
      }

      if (!userId || userId <= 0) {
        throw new Error("ID do usuário inválido");
      }

      console.log("🔍 Verificando favorito:", { filePath, userId });

      const response = await axios.get<ApiResponse<FavoriteCheckResult>>(
        `${this.baseURL}/check/${userId}?filePath=${encodeURIComponent(
          filePath
        )}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Erro ao verificar favorito");
      }

      return response.data.data;
    } catch (error) {
      console.error("❌ Erro ao verificar favorito:", error);
      // Em caso de erro, assumir que não é favorito
      return {
        isFavorite: false,
        favoriteId: null,
        createdAt: null,
      };
    }
  }

  // Verificar múltiplos arquivos de uma vez
  async batchCheckFavorites(
    filePaths: string[],
    userId: number = this.defaultUserId
  ): Promise<Record<string, FavoriteCheckResult>> {
    try {
      // Validar entrada
      if (!Array.isArray(filePaths) || filePaths.length === 0) {
        console.warn("⚠️ Array de caminhos vazio ou inválido");
        return {};
      }

      if (!userId || userId <= 0) {
        throw new Error("ID do usuário inválido");
      }

      // Filtrar apenas caminhos válidos
      const validPaths = filePaths.filter((path) =>
        FavoritesServiceApi.isValidFilePath(path)
      );

      if (validPaths.length === 0) {
        console.warn("⚠️ Nenhum caminho válido encontrado");
        return {};
      }

      console.log("🔍 Verificação em lote de favoritos:", {
        count: validPaths.length,
        userId,
      });

      const response = await this.retryOperation(async () => {
        return await axios.post<
          ApiResponse<Record<string, FavoriteCheckResult>>
        >(`${this.baseURL}/batch-check/${userId}`, { filePaths: validPaths });
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Erro na verificação em lote");
      }

      console.log(
        "✅ Verificação em lote concluída:",
        response.data.count,
        "favoritos encontrados"
      );
      return response.data.data;
    } catch (error) {
      console.error("❌ Erro na verificação em lote:", error);

      // Em caso de erro, retornar objeto com todos como não favoritos
      const result: Record<string, FavoriteCheckResult> = {};
      filePaths.forEach((filePath) => {
        result[filePath] = {
          isFavorite: false,
          favoriteId: null,
          createdAt: null,
        };
      });
      return result;
    }
  }

  // Limpar favoritos orfãos
  async cleanupFavorites(
    userId: number = this.defaultUserId
  ): Promise<{ removedCount: number; totalChecked: number }> {
    try {
      // Validar entrada
      if (!userId || userId <= 0) {
        throw new Error("ID do usuário inválido");
      }

      console.log("🧹 Limpando favoritos orfãos do usuário:", userId);

      const response = await this.retryOperation(async () => {
        return await axios.delete<
          ApiResponse<{ removedCount: number; totalChecked: number }>
        >(`${this.baseURL}/cleanup/${userId}`);
      });

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Erro na limpeza de favoritos"
        );
      }

      console.log(
        "✅ Limpeza concluída:",
        response.data.data.removedCount,
        "favoritos orfãos removidos"
      );
      return response.data.data;
    } catch (error) {
      console.error("❌ Erro na limpeza de favoritos:", error);
      throw new Error("Falha na comunicação com o servidor");
    }
  }

  // Obter estatísticas dos favoritos
  async getFavoriteStats(
    userId: number = this.defaultUserId
  ): Promise<FavoriteStats> {
    try {
      // Validar entrada
      if (!userId || userId <= 0) {
        throw new Error("ID do usuário inválido");
      }

      console.log("📊 Obtendo estatísticas de favoritos do usuário:", userId);

      const response = await this.retryOperation(async () => {
        return await axios.get<ApiResponse<FavoriteStats>>(
          `${this.baseURL}/stats/${userId}`
        );
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Erro ao obter estatísticas");
      }

      console.log(
        "✅ Estatísticas obtidas:",
        response.data.data.total,
        "favoritos total"
      );
      return response.data.data;
    } catch (error) {
      console.error("❌ Erro ao obter estatísticas:", error);
      throw new Error("Falha na comunicação com o servidor");
    }
  }

  // Verificar conectividade com o servidor
  async checkServerHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000, // Timeout menor para verificação de saúde
      });
      return response.data.status === "OK";
    } catch (error) {
      console.error("❌ Servidor não está respondendo:", error);
      return false;
    }
  }

  // Método auxiliar para retry com backoff
  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error("Erro desconhecido");

        if (attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(
          `⏳ Tentativa ${attempt} falhou, tentando novamente em ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // Método auxiliar para validar caminhos de arquivo
  static isValidFilePath(filePath: string): boolean {
    if (!filePath || typeof filePath !== "string") {
      return false;
    }

    const trimmedPath = filePath.trim();

    // Verificar se não está vazio
    if (trimmedPath.length === 0) {
      return false;
    }

    // Verificar caracteres inválidos básicos (menos restritivo para Windows)
    const invalidChars = /[<>"|?*]/;
    if (invalidChars.test(trimmedPath)) {
      return false;
    }

    // Verificar se tem pelo menos uma barra (caminho absoluto) ou dois pontos (drive Windows)
    if (!/[/\\:]/.test(trimmedPath)) {
      return false;
    }

    return true;
  }

  // Método auxiliar para formatar o tipo de arquivo
  static getFileType(filePath: string): string {
    if (!filePath || typeof filePath !== "string") {
      return "";
    }

    const parts = filePath.split(".");
    if (parts.length <= 1) {
      return ""; // Arquivo sem extensão
    }

    const extension = parts.pop()?.toLowerCase().trim();
    return extension ? `.${extension}` : "";
  }

  // Método auxiliar para obter nome do arquivo
  static getFileName(filePath: string): string {
    if (!filePath || typeof filePath !== "string") {
      return "";
    }

    const cleanPath = filePath.trim();
    if (cleanPath.length === 0) {
      return "";
    }

    // Remover barras finais
    const normalizedPath = cleanPath.replace(/[/\\]+$/, "");
    const parts = normalizedPath.split(/[/\\]/);
    return parts.pop() || cleanPath;
  }

  // Método auxiliar para normalizar caminhos
  static normalizePath(filePath: string): string {
    if (!filePath || typeof filePath !== "string") {
      return "";
    }

    return filePath.trim().replace(/\\/g, "/").replace(/\/+/g, "/");
  }

  // Método auxiliar para verificar se é um diretório (baseado no caminho)
  static isDirectoryPath(filePath: string): boolean {
    if (!filePath || typeof filePath !== "string") {
      return false;
    }

    const trimmedPath = filePath.trim();

    // Se termina com barra, provavelmente é diretório
    if (trimmedPath.endsWith("/") || trimmedPath.endsWith("\\")) {
      return true;
    }

    // Se não tem extensão, pode ser diretório
    const fileName = FavoritesServiceApi.getFileName(trimmedPath);
    return !fileName.includes(".");
  }
}

export const favoritesService = new FavoritesServiceApi();
