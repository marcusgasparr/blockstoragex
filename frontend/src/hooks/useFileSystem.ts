import { useState, useEffect, useCallback } from 'react';
import { fileSystemService, DirectoryContent, FileSystemItem } from '../services/fileSystemService';

export const useFileSystem = (initialPath: string = 'G:\\') => {
  const [directoryContent, setDirectoryContent] = useState<DirectoryContent | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [clipboard, setClipboard] = useState<{
    items: FileSystemItem[];
    operation: 'copy' | 'cut' | null;
  }>({ items: [], operation: null });

  console.log('🗂️ useFileSystem iniciado com path:', initialPath);

  const fetchDirectoryContents = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📂 Buscando conteúdo de:', path);
      const data = await fileSystemService.getDirectoryContents(path);
      setDirectoryContent(data);
      setCurrentPath(data.currentPath);
      setSelectedItems(new Set()); // Limpar seleção ao navegar
      console.log('✅ Conteúdo carregado:', data.items.length, 'itens');
    } catch (err) {
      console.error('❌ Erro ao buscar conteúdo:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const navigateToDirectory = useCallback((path: string) => {
    console.log('🧭 Navegando para:', path);
    fetchDirectoryContents(path);
  }, [fetchDirectoryContents]);

  const navigateUp = useCallback(() => {
    if (directoryContent?.parentPath) {
      console.log('⬆️ Navegando para pasta pai:', directoryContent.parentPath);
      navigateToDirectory(directoryContent.parentPath);
    }
  }, [directoryContent?.parentPath, navigateToDirectory]);

  const refresh = useCallback(() => {
    console.log('🔄 Atualizando conteúdo do diretório atual');
    fetchDirectoryContents(currentPath);
  }, [currentPath, fetchDirectoryContents]);

  const selectRange = useCallback((startIndex: number, endIndex: number) => {
    if (!directoryContent) return;
    
    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);
    const newSelection = new Set<string>();
    
    for (let i = start; i <= end; i++) {
      if (directoryContent.items[i]) {
        newSelection.add(directoryContent.items[i].path);
      }
    }
    
    setSelectedItems(newSelection);
  }, [directoryContent]);

  const selectItem = useCallback((itemPath: string, index: number, event?: React.MouseEvent) => {
    if (!event) {
      // Seleção simples
      setSelectedItems(new Set([itemPath]));
      setLastClickedIndex(index);
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      // Ctrl+Click: toggle individual item
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemPath)) {
          newSet.delete(itemPath);
        } else {
          newSet.add(itemPath);
        }
        return newSet;
      });
      setLastClickedIndex(index);
    } else if (event.shiftKey && lastClickedIndex !== null) {
      // Shift+Click: select range
      selectRange(lastClickedIndex, index);
    } else {
      // Click normal: select only this item
      setSelectedItems(new Set([itemPath]));
      setLastClickedIndex(index);
    }
  }, [lastClickedIndex, selectRange]);

  const selectAll = useCallback(() => {
    if (!directoryContent) return;
    
    const allPaths = new Set(directoryContent.items.map(item => item.path));
    setSelectedItems(allPaths);
  }, [directoryContent]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
    setLastClickedIndex(null);
  }, []);

  const createDirectory = useCallback(async (name: string, parentPath?: string) => {
    try {
      const targetPath = parentPath || currentPath;
      await fileSystemService.createDirectory(targetPath, name);
      refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar diretório');
      return false;
    }
  }, [currentPath, refresh]);

  const deleteSelectedItems = useCallback(async () => {
    if (selectedItems.size === 0) return false;

    try {
      const userId = 1; // ou buscar do contexto/autenticação
      for (const itemPath of selectedItems) {
        const fileName = itemPath.split(/[\\/]/).pop() || '';
  await (fileSystemService as any).deleteItem(itemPath, userId, fileName);
      }
      clearSelection();
      refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir itens');
      return false;
    }
  }, [selectedItems, clearSelection, refresh]);

  const renameItem = useCallback(async (oldPath: string, newName: string) => {
    try {
      await fileSystemService.renameItem(oldPath, newName);
      refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao renomear item');
      return false;
    }
  }, [refresh]);

  const copyItems = useCallback((items: FileSystemItem[]) => {
    setClipboard({ items, operation: 'copy' });
  }, []);

  const cutItems = useCallback((items: FileSystemItem[]) => {
    setClipboard({ items, operation: 'cut' });
  }, []);

  const pasteItems = useCallback(async (destinationPath?: string) => {
    if (clipboard.items.length === 0 || !clipboard.operation) {
      return false;
    }

    try {
      const targetPath = destinationPath || currentPath;
      
      for (const item of clipboard.items) {
        if (clipboard.operation === 'copy') {
          await fileSystemService.copyItem(item.path, targetPath);
        } else if (clipboard.operation === 'cut') {
          await fileSystemService.moveItem(item.path, targetPath);
        }
      }

      if (clipboard.operation === 'cut') {
        setClipboard({ items: [], operation: null });
      }

      refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao colar itens');
      return false;
    }
  }, [clipboard, currentPath, refresh]);

  const moveItems = useCallback(async (items: FileSystemItem[], destinationPath: string) => {
    try {
      for (const item of items) {
        await fileSystemService.moveItem(item.path, destinationPath);
      }
      refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao mover itens');
      return false;
    }
  }, [refresh]);

  const getFileName = (filePath: string): string => {
    const parts = filePath.split(/[\\/]/);
    return parts[parts.length - 1];
  };

  const getFileType = (filePath: string): string => {
    const fileName = getFileName(filePath);
    const ext = fileName.split('.').pop();
    return ext ? ext.toLowerCase() : '';
  };

  const toggleStar = useCallback(async (itemPath: string) => {
    try {
      const { favoritesService } = await import('../services/favoritesService');
      const fileName = getFileName(itemPath);
      const fileType = getFileType(itemPath);

      const result = await favoritesService.toggleFavorite(itemPath, fileName, fileType);

      console.log('⭐ Favorito alternado:', result.action, 'para', itemPath);

      refresh();
      return result.isFavorite;
    } catch (err) {
      console.error('❌ Erro ao favoritar no banco:', err);
      // Fallback para o método local se o banco falhar
      try {
        const result = await fileSystemService.toggleStar(itemPath);
        refresh();
        return result;
      } catch (localErr) {
        setError(localErr instanceof Error ? localErr.message : 'Erro ao favoritar item');
        return false;
      }
    }
  }, [refresh]);

  const setFolderColor = useCallback(async (itemPath: string, color: string) => {
    try {
      await fileSystemService.setFolderColor(itemPath, color);
      refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao definir cor da pasta');
      return false;
    }
  }, [refresh]);

  const getSelectedItemsData = useCallback(() => {
    if (!directoryContent) return [];
    
    return directoryContent.items.filter(item => 
      selectedItems.has(item.path)
    );
  }, [directoryContent, selectedItems]);

  // Buscar todos os favoritos do disco
  const getAllStarredItems = useCallback(async (rootPath: string = "G:\\") => {
    try {
      // Importar o service de favoritos dinamicamente
      const { favoritesService } = await import('../services/favoritesService');
      
      // Buscar favoritos do banco de dados
      const favorites = await favoritesService.getUserFavorites(1, rootPath);
      
      // Função auxiliar para obter ícone do arquivo
      const getFileIcon = (fileName: string, isDirectory: boolean): string => {
        if (isDirectory) return '📁';
        
        const extension = fileName.split('.').pop()?.toLowerCase();
        const iconMap: Record<string, string> = {
          'txt': '📄', 'doc': '📝', 'docx': '📝', 'pdf': '📕',
          'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️',
          'mp4': '🎬', 'avi': '🎬', 'mov': '🎬',
          'mp3': '🎵', 'wav': '🎵', 'flac': '🎵',
          'zip': '📦', 'rar': '📦', '7z': '📦',
          'exe': '⚙️', 'msi': '⚙️'
        };
        
        return iconMap[extension || ''] || '📄';
      };
      
      // Converter para o formato esperado pelo FileSystemItem
      const formattedFavorites = favorites.map(fav => ({
        name: fav.file_name,
        path: fav.file_path,
        type: fav.isDirectory ? 'directory' as const : 'file' as const,
        size: fav.size,
        modified: new Date(fav.modified || fav.created_at),
        extension: fav.file_type || undefined,
        icon: getFileIcon(fav.file_name, fav.isDirectory),
        isStarred: true,
        exists: fav.exists
      }));
      
      console.log('⭐ Favoritos do banco obtidos:', formattedFavorites.length);
      return formattedFavorites;
      
    } catch (err) {
      console.error('❌ Erro ao buscar favoritos do banco, usando fallback local:', err);
      
      // Fallback para o método local se o banco falhar
      return await fileSystemService.getAllStarredItems(rootPath);
    }
  }, []);

  // Carregar conteúdo inicial e reagir a mudanças no initialPath
  useEffect(() => {
    console.log('🗂️ useFileSystem: initialPath mudou para:', initialPath);
    fetchDirectoryContents(initialPath);
    // Resetar currentPath para o novo disco
    setCurrentPath(initialPath);
  }, [initialPath, fetchDirectoryContents]);

  return {
    // Estado
    directoryContent,
    loading,
    error,
    currentPath,
    selectedItems,
    clipboard,
    
    // Navegação
    navigateToDirectory,
    navigateUp,
    refresh,
    
    // Seleção
    selectItem,
    selectAll,
    clearSelection,
    getSelectedItemsData,
    
    // Operações de arquivo
    createDirectory,
    deleteSelectedItems,
    renameItem,
    copyItems,
    cutItems,
    pasteItems,
    moveItems,
    toggleStar,
    setFolderColor,
    
    // Utilitários
    formatFileSize: (bytes: number) => fileSystemService.formatFileSize(bytes),
    formatDate: (date: Date) => fileSystemService.formatDate(date),
    getAllStarredItems,
  };
};