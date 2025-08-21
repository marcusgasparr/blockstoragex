import React, { useState, useEffect } from 'react';
import styles from './MyDrive.module.scss';
import { useFileSystem } from '../../hooks/useFileSystem';
import { ContextMenu } from '../../components/ContextMenu/ContextMenu';
import { PasteBar } from '../../layouts/LayoutDefault/components/PasteBar/PasteBar';
import FilePreview from '../../components/FilePreview/FilePreview';
import PopupDefault from '../../layouts/LayoutDefault/PopupDefault';
import { FileSystemItem } from '../../services/fileSystemService';
import { useSearchParams } from 'react-router-dom';

interface MyDriveProps {
  onSearchCallback?: (callback: (query: string) => void) => void;
  currentDrive?: string;
}

const MyDrive: React.FC<MyDriveProps> = ({ onSearchCallback, currentDrive = 'H:\\' }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Estados para busca global
  const [globalSearchResults, setGlobalSearchResults] = useState<FileSystemItem[]>([]);
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Hook para navegação no sistema de arquivos
  const {
    directoryContent,
    loading: filesLoading,
    error: filesError,
    currentPath,
    selectedItems,
    clipboard,
    navigateToDirectory,
    navigateUp,
    refresh,
    selectItem,
    selectAll,
    clearSelection,
    getSelectedItemsData,
    createDirectory,
    deleteSelectedItems,
    renameItem,
    copyItems,
    cutItems,
    pasteItems,
    toggleStar,
    setFolderColor,
    formatFileSize,
    formatDate
  } = useFileSystem(currentDrive);

  // Estados do componente
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({ isOpen: false, position: { x: 0, y: 0 } });
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [showPasteBar, setShowPasteBar] = useState(false);

  // Estados para filtros e busca
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'files' | 'folders' | 'images' | 'documents' | 'videos' | 'audio'>('all');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [filteredItems, setFilteredItems] = useState<FileSystemItem[]>([]);

  // Estado para popup de visualização
  const [previewFile, setPreviewFile] = useState<FileSystemItem | null>(null);
  const [selectMode, setSelectMode] = useState(false);

  // Função para busca global
  const performGlobalSearch = async (query: string) => {
    if (!query.trim()) {
      setGlobalSearchResults([]);
      setIsGlobalSearch(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`http://localhost:3001/api/files/search?query=${encodeURIComponent(query)}&rootPath=${encodeURIComponent(currentDrive)}`);
      const data = await response.json();

      if (data.success) {
        setGlobalSearchResults(data.data);
        setIsGlobalSearch(true);
      } else {
        console.error('Erro na busca:', data.message);
        setGlobalSearchResults([]);
        setIsGlobalSearch(false);
      }
    } catch (error) {
      console.error('Erro na busca global:', error);
      setGlobalSearchResults([]);
      setIsGlobalSearch(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Função para lidar com busca da TopBar (não usada mais, mantida para compatibilidade)
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    // Atualizar URL se necessário
    const newParams = new URLSearchParams(searchParams);
    if (query) {
      newParams.set('search', query);
      newParams.delete('globalSearch'); // Limpar busca global se existir
    } else {
      newParams.delete('search');
      newParams.delete('globalSearch');
    }
    setSearchParams(newParams);
  };

  // Função para filtrar itens (local ou global)
  const filterItems = (items: FileSystemItem[], query: string, type: string) => {
    let filtered = [...items];

    // Para busca global, não aplicar filtro de busca pois já vem filtrado
    if (!isGlobalSearch && query.trim()) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Filtro por tipo
    switch (type) {
      case 'files':
        filtered = filtered.filter(item => item.type === 'file');
        break;
      case 'folders':
        filtered = filtered.filter(item => item.type === 'directory');
        break;
      case 'images':
        filtered = filtered.filter(item =>
          item.extension && ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'].includes(item.extension)
        );
        break;
      case 'documents':
        filtered = filtered.filter(item =>
          item.extension && ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'].includes(item.extension)
        );
        break;
      case 'videos':
        filtered = filtered.filter(item =>
          item.extension && ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'].includes(item.extension)
        );
        break;
      case 'audio':
        filtered = filtered.filter(item =>
          item.extension && ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.wma'].includes(item.extension)
        );
        break;
    }

    return filtered;
  };

  // Função para limpar busca
  const clearSearch = () => {
    setSearchQuery('');
    setIsGlobalSearch(false);
    setGlobalSearchResults([]);

    const newParams = new URLSearchParams(searchParams);
    newParams.delete('search');
    newParams.delete('globalSearch');
    setSearchParams(newParams);
  };

  // Registrar callback de busca para o TopBar
  useEffect(() => {
    if (onSearchCallback) {
      onSearchCallback(handleSearch);
    }
  }, [onSearchCallback]);

  // useEffect para aplicar filtros
  useEffect(() => {
    if (isGlobalSearch) {
      const filtered = filterItems(globalSearchResults, searchQuery, typeFilter);
      setFilteredItems(filtered);
    } else if (directoryContent) {
      const filtered = filterItems(directoryContent.items, searchQuery, typeFilter);
      setFilteredItems(filtered);
    }
  }, [directoryContent, globalSearchResults, searchQuery, typeFilter, isGlobalSearch]);

  // useEffect para lidar com parâmetros da URL
  useEffect(() => {
    const pathParam = searchParams.get('path');
    const selectedParam = searchParams.get('selected');
    const searchParam = searchParams.get('search');
    const globalSearchParam = searchParams.get('globalSearch');

    // Navegação por pasta
    if (pathParam && pathParam !== currentPath) {
      navigateToDirectory(pathParam);
    }

    // Busca local
    if (searchParam && !globalSearchParam) {
      setSearchQuery(searchParam);
      setIsGlobalSearch(false);
    }

    // Busca global
    if (globalSearchParam) {
      setSearchQuery(globalSearchParam);
      performGlobalSearch(globalSearchParam);
    }

    // Se não há busca, limpar estados
    if (!searchParam && !globalSearchParam && searchQuery) {
      setSearchQuery('');
      setIsGlobalSearch(false);
      setGlobalSearchResults([]);
    }

    // Após navegar, selecionar o arquivo específico se fornecido
    if (selectedParam && directoryContent && !isGlobalSearch) {
      setTimeout(() => {
        const itemIndex = directoryContent.items.findIndex(item => item.path === selectedParam);
        if (itemIndex !== -1) {
          selectItem(selectedParam, itemIndex);

          const itemElement = document.querySelector(`[data-path="${selectedParam}"]`);
          if (itemElement) {
            itemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
    }
  }, [searchParams, currentPath, directoryContent, selectItem]);

  // Função para baixar arquivo/pasta
  const handleDownload = async () => {
    const items = getSelectedItemsData();
    if (items.length === 0) return alert('Selecione ao menos um item para baixar.');

    for (const item of items) {
      if (item.type === 'file') {
        // Download de arquivo
        const response = await fetch(`http://localhost:3001/api/files/download?path=${encodeURIComponent(item.path)}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else if (item.type === 'directory') {
        // Download de pasta como zip
        const response = await fetch(`http://localhost:3001/api/files/download-folder?path=${encodeURIComponent(item.path)}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name + '.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    }
    closeContextMenu();
  };

  // Handlers do menu de contexto
  const handleContextMenu = (e: React.MouseEvent, itemPath?: string) => {
    e.preventDefault();

    // Se clicou em um item específico e ele não está selecionado, seleciona ele
    if (itemPath && !selectedItems.has(itemPath)) {
      selectItem(itemPath, 0);
    }

    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY }
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 } });
  };

  // Handlers das ações
  const handleCopy = () => {
    const items = getSelectedItemsData();
    if (items.length === 0) {
      console.warn('Nenhum item selecionado para copiar');
      return;
    }

    copyItems(items);
    setShowPasteBar(true);
    console.log('Copiado:', items.map(i => i.name));
  };

  const handleCut = () => {
    const items = getSelectedItemsData();
    if (items.length === 0) {
      console.warn('Nenhum item selecionado para recortar');
      return;
    }

    cutItems(items);
    setShowPasteBar(true);
    console.log('Recortado:', items.map(i => i.name));
  };

  const handlePaste = async () => {
    if (clipboard.items.length === 0) {
      console.warn('Nenhum item na área de transferência');
      return;
    }

    try {
      const success = await pasteItems();
      setShowPasteBar(false);

      if (success) {
        console.log('Itens colados com sucesso');
        refresh();
      } else {
        console.error('Falha ao colar itens');
      }
    } catch (error) {
      console.error('Erro ao colar:', error);
    }
  };

  const handleDelete = async () => {
    const items = getSelectedItemsData();
    if (items.length === 0) {
      console.warn('Nenhum item selecionado para excluir');
      return;
    }

    const confirmMessage = items.length === 1
      ? `Tem certeza que deseja excluir "${items[0].name}"?`
      : `Tem certeza que deseja excluir ${items.length} itens?`;

    if (confirm(confirmMessage)) {
      try {
        await deleteSelectedItems();
        console.log('Itens excluídos com sucesso');
        refresh();
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir itens. Verifique as permissões.');
      }
    }
  };

  const handleRename = () => {
    const items = getSelectedItemsData();
    if (items.length !== 1) {
      console.warn('Selecione apenas um item para renomear');
      return;
    }

    setIsRenaming(items[0].path);
    setNewName(items[0].name);
  };

  const handleCreateFolder = async () => {
    const name = prompt('Nome da nova pasta:');
    if (name && name.trim()) {
      try {
        await createDirectory(name.trim());
        console.log('Pasta criada:', name);
        refresh();
      } catch (error) {
        console.error('Erro ao criar pasta:', error);
        alert('Erro ao criar pasta. Verifique as permissões.');
      }
    }
  };

  const handleToggleStar = async () => {
    const items = getSelectedItemsData();
    if (items.length !== 1) {
      console.warn('Selecione apenas um item para favoritar');
      return;
    }

    try {
      await toggleStar(items[0].path);
      console.log('Status de favorito atualizado para:', items[0].name);
      refresh();
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
      alert('Erro ao atualizar favorito.');
    }
  };

  const handleSetFolderColor = async (color: string) => {
    const items = getSelectedItemsData();
    if (items.length !== 1 || items[0].type !== 'directory') {
      console.warn('Selecione apenas uma pasta para mudar a cor');
      return;
    }

    try {
      await setFolderColor(items[0].path, color);
      console.log('Cor da pasta atualizada:', items[0].name, color);
      refresh();
    } catch (error) {
      console.error('Erro ao definir cor da pasta:', error);
      alert('Erro ao definir cor da pasta.');
    }
  };

  const handleSelectMode = () => {
    const items = getSelectedItemsData();

    if (items.length === 0) {
      console.warn('Nenhum item para selecionar');
      return;
    }

    setSelectMode(true);
    console.log('Modo seleção ativado com:', items[0].name);
  };

  const confirmRename = async () => {
    if (isRenaming && newName.trim()) {
      await renameItem(isRenaming, newName.trim());
      setIsRenaming(null);
      setNewName('');
    }
  };

  const cancelRename = () => {
    setIsRenaming(null);
    setNewName('');
  };

  const handleCancelPaste = () => {
    setShowPasteBar(false);
  };

  // Função para navegar para o diretório de um item da busca global
  const handleGoToItemLocation = (item: FileSystemItem) => {
    if (item.type === 'directory') {
      // Se é pasta, navegar para ela
      setSearchParams(new URLSearchParams({ path: item.path }));
    } else {
      // Se é arquivo, navegar para o diretório pai e selecionar o arquivo
      const pathParts = item.path.split('\\');
      pathParts.pop();
      const parentPath = pathParts.join('\\');
      setSearchParams(new URLSearchParams({
        path: parentPath,
        selected: item.path
      }));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Verificar se o foco está em um input
      const activeElement = document.activeElement;
      const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

      if (isInputFocused) {
        // Se está em um input, não processar shortcuts
        return;
      }

      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        selectAll();
      } else if (e.key === 'Delete') {
        if (selectedItems.size > 0) {
          handleDelete();
        }
      } else if (e.key === 'F2') {
        if (selectedItems.size === 1) {
          handleRename();
        }
      } else if (e.ctrlKey && e.key === 'c') {
        if (selectedItems.size > 0) {
          handleCopy();
        }
      } else if (e.ctrlKey && e.key === 'x') {
        if (selectedItems.size > 0) {
          handleCut();
        }
      } else if (e.ctrlKey && e.key === 'v') {
        if (clipboard.items.length > 0) {
          handlePaste();
        }
      } else if (e.key === 'Escape') {
        if (isGlobalSearch || searchQuery) {
          clearSearch();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedItems, clipboard, selectAll, handleDelete, handleRename, handleCopy, handleCut, handlePaste, isGlobalSearch, searchQuery]);

  // Determinar qual conjunto de itens usar
  const currentItems = isGlobalSearch ? globalSearchResults : (directoryContent?.items || []);
  const totalItems = isGlobalSearch ? globalSearchResults.length : (directoryContent?.totalItems || 0);

  return (
    <div className={styles.home}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {isGlobalSearch ? `Resultados da busca: "${searchQuery}"` : 'Meu Drive'}
        </h1>
        <div className={styles.viewControls}>
          <button
            className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => setViewMode('list')}
          >
            <i className="fas fa-list"></i>
          </button>
          <button
            className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <i className="fas fa-th"></i>
          </button>
        </div>
      </div>

      {/* Breadcrumb de navegação */}
      {!isGlobalSearch && (
        <div className={styles.breadcrumb}>
          <button
            className={styles.breadcrumbBtn}
            onClick={navigateUp}
            disabled={!directoryContent?.parentPath}
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <span className={styles.currentPath}>{currentPath}</span>
          <button className={styles.refreshBtn} onClick={refresh}>
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      )}

      {/* Barra de busca global ativa */}
      {isGlobalSearch && (
        <div className={styles.searchInfo}>
          <div className={styles.searchHeader}>
            <span className={styles.searchLabel}>
              <i className="fas fa-search"></i>
              Busca global por: "{searchQuery}"
            </span>
            <button className={styles.clearSearchBtn} onClick={clearSearch}>
              <i className="fas fa-times"></i>
              Limpar busca
            </button>
          </div>
        </div>
      )}

      <div className={styles.filters}>
        <div className={styles.filterDropdown}>
          <button
            className={`${styles.filterBtn} ${showTypeDropdown ? styles.active : ''}`}
            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
          >
            {typeFilter === 'all' ? 'Todos os tipos' :
              typeFilter === 'files' ? 'Arquivos' :
                typeFilter === 'folders' ? 'Pastas' :
                  typeFilter === 'images' ? 'Imagens' :
                    typeFilter === 'documents' ? 'Documentos' :
                      typeFilter === 'videos' ? 'Vídeos' :
                        typeFilter === 'audio' ? 'Áudio' : 'Tipo'
            }
            <i className="fas fa-chevron-down"></i>
          </button>

          {showTypeDropdown && (
            <div className={styles.dropdownMenu}>
              <button
                className={`${styles.dropdownItem} ${typeFilter === 'all' ? styles.selected : ''}`}
                onClick={() => {
                  setTypeFilter('all');
                  setShowTypeDropdown(false);
                }}
              >
                <i className="fas fa-th"></i>
                Todos os tipos
              </button>
              <button
                className={`${styles.dropdownItem} ${typeFilter === 'folders' ? styles.selected : ''}`}
                onClick={() => {
                  setTypeFilter('folders');
                  setShowTypeDropdown(false);
                }}
              >
                <i className="fas fa-folder"></i>
                Pastas
              </button>
              <button
                className={`${styles.dropdownItem} ${typeFilter === 'files' ? styles.selected : ''}`}
                onClick={() => {
                  setTypeFilter('files');
                  setShowTypeDropdown(false);
                }}
              >
                <i className="fas fa-file"></i>
                Arquivos
              </button>
              <div className={styles.separator}></div>
              <button
                className={`${styles.dropdownItem} ${typeFilter === 'images' ? styles.selected : ''}`}
                onClick={() => {
                  setTypeFilter('images');
                  setShowTypeDropdown(false);
                }}
              >
                <i className="fas fa-image"></i>
                Imagens
              </button>
              <button
                className={`${styles.dropdownItem} ${typeFilter === 'documents' ? styles.selected : ''}`}
                onClick={() => {
                  setTypeFilter('documents');
                  setShowTypeDropdown(false);
                }}
              >
                <i className="fas fa-file-alt"></i>
                Documentos
              </button>
              <button
                className={`${styles.dropdownItem} ${typeFilter === 'videos' ? styles.selected : ''}`}
                onClick={() => {
                  setTypeFilter('videos');
                  setShowTypeDropdown(false);
                }}
              >
                <i className="fas fa-video"></i>
                Vídeos
              </button>
              <button
                className={`${styles.dropdownItem} ${typeFilter === 'audio' ? styles.selected : ''}`}
                onClick={() => {
                  setTypeFilter('audio');
                  setShowTypeDropdown(false);
                }}
              >
                <i className="fas fa-music"></i>
                Áudio
              </button>
            </div>
          )}
        </div>

        {(searchQuery || typeFilter !== 'all') && (
          <div className={styles.activeFilters}>
            {searchQuery && (
              <span className={styles.filterChip}>
                {isGlobalSearch ? 'Busca global' : 'Busca'}: "{searchQuery}"
                <button onClick={clearSearch}>
                  <i className="fas fa-times"></i>
                </button>
              </span>
            )}
            {typeFilter !== 'all' && (
              <span className={styles.filterChip}>
                Tipo: {typeFilter === 'folders' ? 'Pastas' :
                  typeFilter === 'files' ? 'Arquivos' :
                    typeFilter === 'images' ? 'Imagens' :
                      typeFilter === 'documents' ? 'Documentos' :
                        typeFilter === 'videos' ? 'Vídeos' :
                          typeFilter === 'audio' ? 'Áudio' : typeFilter}
                <button onClick={() => setTypeFilter('all')}>
                  <i className="fas fa-times"></i>
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {isSearching ? 'Buscando...' :
              filteredItems.length > 0 ?
                `${filteredItems.length}${filteredItems.length !== totalItems ?
                  ` de ${totalItems}` : ''} itens` :
                isGlobalSearch ? 'Nenhum resultado encontrado' : 'Carregando...'
            }
          </h2>
          {(selectedItems.size > 0 || selectMode) && (
            <div className={styles.selectionActions}>
              <span className={styles.selectionCount}>
                {selectMode ? 'Modo seleção ativo' : `${selectedItems.size} item(s) selecionado(s)`}
              </span>
              <button className={styles.actionBtn} onClick={() => {
                clearSelection();
                setSelectMode(false);
              }}>
                <i className="fas fa-times"></i> Limpar
              </button>
            </div>
          )}
        </div>

        {isSearching ? (
          <div className={styles.loadingState}>
            <i className="fas fa-spinner fa-spin"></i>
            <p>Buscando arquivos...</p>
          </div>
        ) : filesLoading && !isGlobalSearch ? (
          <div className={styles.loadingState}>
            <i className="fas fa-spinner fa-spin"></i>
            <p>Carregando arquivos...</p>
          </div>
        ) : filesError && !isGlobalSearch ? (
          <div className={styles.errorState}>
            <i className="fas fa-exclamation-triangle"></i>
            <p>Erro: {filesError}</p>
            <button onClick={refresh} className={styles.retryBtn}>Tentar novamente</button>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className={viewMode === 'grid' ? styles.itemsGrid : styles.itemsList}>
            {filteredItems.map((item, index) => (
              <div
                key={item.path}
                data-path={item.path}
                className={`${viewMode === 'grid' ? styles.itemCard : styles.itemRow
                  } ${selectedItems.has(item.path) ? styles.selected : ''} ${isGlobalSearch ? styles.searchResult : ''}`}
                onClick={(e) => {
                  // Ctrl+Click sempre seleciona (independente do modo)
                  if (e.ctrlKey) {
                    selectItem(item.path, index, e);
                    return;
                  }

                  // Se está no modo seleção, apenas seleciona
                  if (selectMode) {
                    selectItem(item.path, index, e);
                    return;
                  }

                  // Na busca global, clique simples navega para localização
                  if (isGlobalSearch) {
                    handleGoToItemLocation(item);
                    return;
                  }

                  // Clique normal: apenas navega para pastas
                  if (item.type === 'directory') {
                    navigateToDirectory(item.path);
                  }
                  // Arquivos não fazem nada no clique único
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (item.type === 'directory') {
                    // Duplo clique em pasta: navega para dentro da pasta
                    if (isGlobalSearch) {
                      setSearchParams(new URLSearchParams({ path: item.path }));
                    } else {
                      navigateToDirectory(item.path);
                    }
                  } else {
                    // Duplo clique em arquivo: abre preview
                    setPreviewFile(item);
                  }
                }}
                onContextMenu={(e) => handleContextMenu(e, item.path)}
              >
                <div className={styles.itemIcon}>
                  <i
                    className={item.icon}
                    style={{
                      color: item.type === 'directory' && item.folderColor
                        ? item.folderColor
                        : undefined
                    }}
                  ></i>
                  {item.isStarred && (
                    <i className={`fas fa-star ${styles.starIcon}`}></i>
                  )}
                </div>
                <div className={styles.itemInfo}>
                  {isRenaming === item.path ? (
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onBlur={cancelRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          confirmRename();
                        } else if (e.key === 'Escape') {
                          cancelRename();
                        }
                      }}
                      className={styles.renameInput}
                      autoFocus
                      onFocus={(e) => e.target.select()}
                    />
                  ) : (
                    <>
                      <span className={styles.itemName} title={item.name}>
                        {item.name}
                      </span>
                      {isGlobalSearch && (
                        <span className={styles.itemPath} title={item.path}>
                          {item.path}
                        </span>
                      )}
                    </>
                  )}
                  {viewMode === 'list' && (
                    <>
                      <span className={styles.itemSize}>
                        {item.type === 'file' ? formatFileSize(item.size) : '--'}
                      </span>
                      <span className={styles.itemDate}>
                        {formatDate(item.modified)}
                      </span>
                    </>
                  )}
                </div>
                <button
                  className={styles.itemMoreBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, item.path);
                  }}
                ><i className="fas fa-ellipsis-v"></i>
                </button>
              </div>
            ))}
          </div>
        ) : isGlobalSearch ? (
          <div className={styles.emptyState}>
            <i className="fas fa-search"></i>
            <h3>Nenhum resultado encontrado</h3>
            <p>Tente usar termos diferentes ou verifique a ortografia</p>
            <button className={styles.clearSearchBtn} onClick={clearSearch}>
              Voltar para navegação
            </button>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <i className="fas fa-folder-open"></i>
            <h3>Pasta vazia</h3>
            <p>Esta pasta não contém arquivos</p>
          </div>
        )}
      </section>

      {/* Menu de contexto */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        selectedItems={getSelectedItemsData()}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        onDelete={handleDelete}
        onRename={handleRename}
        onCreateFolder={handleCreateFolder}
        onToggleStar={handleToggleStar}
        onSetFolderColor={handleSetFolderColor}
        onDownload={handleDownload}
        onSelectMode={handleSelectMode}
        canPaste={clipboard.items.length > 0}
      />

      {/* Preview de arquivo */}
      <PopupDefault
        isOpen={!!previewFile}
        title={previewFile?.name}
        onClose={() => setPreviewFile(null)}
      >
        {previewFile && (
          <FilePreview path={previewFile.path} extension={previewFile.extension} />
        )}
      </PopupDefault>

      {/* Overlay para fechar contexto ao clicar fora */}
      <div
        className={styles.contextOverlay}
        onContextMenu={handleContextMenu}
        style={{ display: contextMenu.isOpen ? 'none' : 'block' }}
      />

      {/* Barra de colar persistente */}
      <PasteBar
        isVisible={showPasteBar}
        operation={clipboard.operation}
        items={clipboard.items}
        onPaste={handlePaste}
        onCancel={handleCancelPaste}
      />
    </div>
  );
};

export default MyDrive;