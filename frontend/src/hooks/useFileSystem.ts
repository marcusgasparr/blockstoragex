import { useState, useEffect, useCallback } from 'react';
import { fileSystemService, DirectoryContent, FileSystemItem } from '../services/fileSystemService';

export const useFileSystem = (initialPath: string = 'C:\\Users') => {
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

  const fetchDirectoryContents = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fileSystemService.getDirectoryContents(path);
      setDirectoryContent(data);
      setCurrentPath(data.currentPath);
      setSelectedItems(new Set()); // Limpar seleção ao navegar
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const navigateToDirectory = useCallback((path: string) => {
    fetchDirectoryContents(path);
  }, [fetchDirectoryContents]);

  const navigateUp = useCallback(() => {
    if (directoryContent?.parentPath) {
      navigateToDirectory(directoryContent.parentPath);
    }
  }, [directoryContent?.parentPath, navigateToDirectory]);

  const refresh = useCallback(() => {
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
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      
      if (event?.ctrlKey) {
        // Ctrl+Click: adicionar/remover item individual
        if (newSelection.has(itemPath)) {
          newSelection.delete(itemPath);
        } else {
          newSelection.add(itemPath);
        }
        setLastClickedIndex(index);
      } else if (event?.shiftKey && lastClickedIndex !== null) {
        // Shift+Click: selecionar range
        selectRange(lastClickedIndex, index);
        return selectedItems;
      } else {
        // Click normal: selecionar apenas este item
        newSelection.clear();
        newSelection.add(itemPath);
        setLastClickedIndex(index);
      }
      
      return newSelection;
    });
  }, [selectRange, selectedItems, lastClickedIndex]);

  const selectAll = useCallback(() => {
    if (directoryContent) {
      const allPaths = directoryContent.items.map(item => item.path);
      setSelectedItems(new Set(allPaths));
    }
  }, [directoryContent]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const createDirectory = useCallback(async (name: string) => {
    try {
      await fileSystemService.createDirectory(currentPath, name);
      refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar diretório');
      return false;
    }
  }, [currentPath, refresh]);

  const deleteSelectedItems = useCallback(async () => {
    try {
      const promises = Array.from(selectedItems).map(path => 
        fileSystemService.deleteItem(path)
      );
      
      await Promise.all(promises);
      refresh();
      clearSelection();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir itens');
      return false;
    }
  }, [selectedItems, refresh, clearSelection]);

  const renameItem = useCallback(async (itemPath: string, newName: string) => {
    try {
      await fileSystemService.renameItem(itemPath, newName);
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
    const targetPath = destinationPath || currentPath;
    
    if (clipboard.items.length === 0 || !clipboard.operation) {
      return false;
    }

    try {
      const promises = clipboard.items.map(item => {
        if (clipboard.operation === 'copy') {
          return fileSystemService.copyItem(item.path, targetPath);
        } else {
          return fileSystemService.moveItem(item.path, targetPath);
        }
      });
      
      await Promise.all(promises);
      
      // Se foi operação de cortar, limpar clipboard
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

  const moveItems = useCallback(async (sourcePaths: string[], destinationPath: string) => {
    try {
      const promises = sourcePaths.map(path => 
        fileSystemService.moveItem(path, destinationPath)
      );
      
      await Promise.all(promises);
      refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao mover itens');
      return false;
    }
  }, [refresh]);

  const toggleStar = useCallback(async (itemPath: string) => {
    try {
      const isStarred = await fileSystemService.toggleStar(itemPath);
      refresh();
      return isStarred;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao favoritar item');
      return false;
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
  const getAllStarredItems = useCallback(async (rootPath: string = "H:\\") => {
    return await fileSystemService.getAllStarredItems(rootPath);
  }, []);

  // Carregar conteúdo inicial
  useEffect(() => {
    fetchDirectoryContents(initialPath);
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
    formatFileSize: fileSystemService.formatFileSize,
    formatDate: fileSystemService.formatDate,
    getAllStarredItems,
  };
};