import { useState, useEffect, useCallback } from 'react';
import { favoritesService, FavoriteItem, FavoriteStats } from '../services/favoritesService';

interface UseFavoritesReturn {
  favorites: FavoriteItem[];
  loading: boolean;
  error: string | null;
  stats: FavoriteStats | null;
  toggleFavorite: (filePath: string, fileName?: string, fileType?: string) => Promise<boolean>;
  isFavorite: (filePath: string) => boolean;
  checkFavorites: (filePaths: string[]) => Promise<Record<string, boolean>>;
  refreshFavorites: () => Promise<void>;
  cleanupOrphaned: () => Promise<{ removedCount: number; totalChecked: number }>;
  getFavoriteById: (id: number) => FavoriteItem | undefined;
  getFavoritesByType: (fileType: string) => FavoriteItem[];
  searchFavorites: (query: string) => FavoriteItem[];
}

// Função para extrair o nome do arquivo do caminho
function getFileName(filePath: string): string {
  const parts = filePath.split(/[\\/]/);
  return parts[parts.length - 1];
}

// Função para extrair o tipo/extensão do arquivo
function getFileType(filePath: string): string {
  const fileName = getFileName(filePath);
  const ext = fileName.split('.').pop();
  return ext ? ext.toLowerCase() : '';
}

export const useFavorites = (userId: number = 1, rootPath?: string): UseFavoritesReturn => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<FavoriteStats | null>(null);
  const [favoritePathsSet, setFavoritePathsSet] = useState<Set<string>>(new Set());

  // Carregar favoritos
  const refreshFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userFavorites = await favoritesService.getUserFavorites(userId, rootPath);
      setFavorites(userFavorites);
      
      // Criar set para verificação rápida
      const pathsSet = new Set(userFavorites.map(fav => fav.file_path));
      setFavoritePathsSet(pathsSet);
      
      console.log('✅ Favoritos carregados:', userFavorites.length);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar favoritos';
      setError(errorMessage);
      console.error('❌ Erro ao carregar favoritos:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, rootPath]);

  // Carregar estatísticas
  const loadStats = useCallback(async () => {
    try {
      const favoriteStats = await favoritesService.getFavoriteStats(userId);
      setStats(favoriteStats);
    } catch (err) {
      console.error('❌ Erro ao carregar estatísticas:', err);
    }
  }, [userId]);

  // Alternar favorito
  const toggleFavorite = useCallback(async (
    filePath: string, 
    fileName?: string, 
    fileType?: string
  ): Promise<boolean> => {
    try {
      setError(null);
      
      // Determinar nome e tipo se não fornecidos
      const effectiveFileName = fileName || getFileName(filePath);
      const effectiveFileType = fileType || getFileType(filePath);
      
      const result = await favoritesService.toggleFavorite(
        filePath, 
        effectiveFileName, 
        effectiveFileType, 
        userId
      );
      
      // Atualizar estado local imediatamente
      if (result.action === 'added') {
        setFavoritePathsSet(prev => new Set(prev).add(filePath));
        // Não adicionar ao array aqui, deixar o refresh fazer isso
      } else {
        setFavoritePathsSet(prev => {
          const newSet = new Set(prev);
          newSet.delete(filePath);
          return newSet;
        });
        setFavorites(prev => prev.filter(fav => fav.file_path !== filePath));
      }
      
      // Atualizar favoritos e estatísticas
      await Promise.all([refreshFavorites(), loadStats()]);
      
      return result.isFavorite;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao alternar favorito';
      setError(errorMessage);
      console.error('❌ Erro ao alternar favorito:', err);
      return favoritePathsSet.has(filePath); // Retorna estado atual em caso de erro
    }
  }, [userId, favoritePathsSet, refreshFavorites, loadStats]);

  // Verificar se é favorito (verificação local rápida)
  const isFavorite = useCallback((filePath: string): boolean => {
    return favoritePathsSet.has(filePath);
  }, [favoritePathsSet]);

  // Verificar múltiplos favoritos
  const checkFavorites = useCallback(async (filePaths: string[]): Promise<Record<string, boolean>> => {
    try {
      const results = await favoritesService.batchCheckFavorites(filePaths, userId);
      
      // Converter para formato simples de boolean
      const booleanResults: Record<string, boolean> = {};
      for (const path in results) {
        if (results.hasOwnProperty(path)) {
          booleanResults[path] = results[path].isFavorite;
        }
      }
      
      // Atualizar set local com os resultados
      const newFavoritePaths = new Set(favoritePathsSet);
      for (const path in booleanResults) {
        if (booleanResults.hasOwnProperty(path)) {
          const isFav = booleanResults[path];
          if (isFav) {
            newFavoritePaths.add(path);
          } else {
            newFavoritePaths.delete(path);
          }
        }
      }
      setFavoritePathsSet(newFavoritePaths);
      
      return booleanResults;
      
    } catch (err) {
      console.error('❌ Erro na verificação de favoritos:', err);
      
      // Em caso de erro, usar verificação local
      const localResults: Record<string, boolean> = {};
      if (Array.isArray(filePaths)) {
        filePaths.forEach(path => {
          localResults[path] = favoritePathsSet.has(path);
        });
      }
      return localResults;
    }
  }, [userId, favoritePathsSet]);

  // Limpar favoritos orfãos
  const cleanupOrphaned = useCallback(async (): Promise<{ removedCount: number; totalChecked: number }> => {
    try {
      setError(null);
      const result = await favoritesService.cleanupFavorites(userId);
      
      // Recarregar favoritos após limpeza
      await Promise.all([refreshFavorites(), loadStats()]);
      
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na limpeza de favoritos';
      setError(errorMessage);
      console.error('❌ Erro na limpeza:', err);
      throw err;
    }
  }, [userId, refreshFavorites, loadStats]);

  // Buscar favorito por ID
  const getFavoriteById = useCallback((id: number): FavoriteItem | undefined => {
    return favorites.find(fav => fav.id === id);
  }, [favorites]);

  // Buscar favoritos por tipo
  const getFavoritesByType = useCallback((fileType: string): FavoriteItem[] => {
    return favorites.filter(fav => fav.file_type === fileType);
  }, [favorites]);

  // Buscar favoritos por query
  const searchFavorites = useCallback((query: string): FavoriteItem[] => {
    const lowerQuery = query.toLowerCase();
    return favorites.filter(fav => 
      fav.file_name.toLowerCase().includes(lowerQuery) ||
      fav.file_path.toLowerCase().includes(lowerQuery)
    );
  }, [favorites]);

  // Effect para carregar dados na inicialização
  useEffect(() => {
    const initializeFavorites = async () => {
      console.log('🚀 Inicializando useFavorites para usuário:', userId);
      await Promise.all([refreshFavorites(), loadStats()]);
    };

    initializeFavorites();
  }, [refreshFavorites, loadStats, userId]);

  // Effect para recarregar quando rootPath mudar
  useEffect(() => {
    if (rootPath) {
      console.log('🔄 Recarregando favoritos para novo rootPath:', rootPath);
      refreshFavorites();
    }
  }, [rootPath, refreshFavorites]);

  return {
    favorites,
    loading,
    error,
    stats,
    toggleFavorite,
    isFavorite,
    checkFavorites,
    refreshFavorites,
    cleanupOrphaned,
    getFavoriteById,
    getFavoritesByType,
    searchFavorites
  };
};