import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import styles from './MyDrive.module.scss';
import { useFileSystem } from '../../hooks/useFileSystem';
import { ContextMenu } from '../../components/ContextMenu/ContextMenu';
import { FileSystemItem } from '../../services/fileSystemService';
import PopupDefault from '../../layouts/PopupDefault/PopupDefault';
import PopupInputNewFolder from '../../layouts/PopupInputNewFolder/PopupInputNewFolder';
import PopupConfirmDelete from '../../layouts/PopupConfirmDelete/PopupConfirmDelete';
import FilePreview from '../../components/FilePreview/FilePreview';

interface MyDriveProps {
  searchQuery?: string;
  onSearchResults?: (results: FileSystemItem[]) => void;
  currentDrive?: string;
}

const MyDrive: React.FC<MyDriveProps> = ({ searchQuery, onSearchResults, currentDrive }) => {
  // Determinar o disco efetivo
  const location = useLocation();
  const params = useParams();
  const pathFromUrl = params['*'] || '';

  const effectiveDrive = currentDrive || localStorage.getItem('selectedDrive') || 'G:\\';
  console.log('📊 MyDrive usando disco:', effectiveDrive);
  console.log('📊 MyDrive recebeu currentDrive prop:', currentDrive);

  // Construir path inicial
  const initialPath = pathFromUrl ? `${effectiveDrive}${pathFromUrl}` : effectiveDrive;

  // Hook principal do sistema de arquivos
  const {
    directoryContent,
    loading,
    error,
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
    formatFileSize,
    formatDate,
  } = useFileSystem(initialPath);

  // Estados locais
  const [contextMenu, setContextMenu] = useState({ isOpen: false, position: { x: 0, y: 0 } });
  const [showNewFolderPopup, setShowNewFolderPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'modified' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showPasteBar, setShowPasteBar] = useState(false);

  // Estados para busca global
  const [globalSearchResults, setGlobalSearchResults] = useState<FileSystemItem[]>([]);
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Estados para filtros
  const [typeFilter, setTypeFilter] = useState<'all' | 'files' | 'folders' | 'images' | 'documents' | 'videos' | 'audio'>('all');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [filteredItems, setFilteredItems] = useState<FileSystemItem[]>([]);

  // Estado para popup de visualização
  const [previewFile, setPreviewFile] = useState<FileSystemItem | null>(null);
  const [selectMode, setSelectMode] = useState(false);

  // Effect para reagir a mudanças no currentDrive
  useEffect(() => {
    if (currentDrive) {
      console.log('🔄 MyDrive: currentDrive mudou, recarregando...', currentDrive);
      // Forçar navegação para o novo disco
      navigateToDirectory(currentDrive);
    }
  }, [currentDrive, navigateToDirectory]);

  // Função para busca global
  const performGlobalSearch = async (query: string) => {
    if (!query.trim()) {
      setGlobalSearchResults([]);
      setIsGlobalSearch(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`http://localhost:3001/api/files/search?query=${encodeURIComponent(query)}&rootPath=${encodeURIComponent(effectiveDrive)}`);
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
    performGlobalSearch(query);
  };

  // Effect para busca global quando searchQuery muda
  useEffect(() => {
    if (searchQuery) {
      performGlobalSearch(searchQuery);
    } else {
      setGlobalSearchResults([]);
      setIsGlobalSearch(false);
    }
  }, [searchQuery]);

  // Effect para notificar resultados de busca
  useEffect(() => {
    if (onSearchResults) {
      onSearchResults(globalSearchResults);
    }
  }, [globalSearchResults, onSearchResults]);

  // Effect para aplicar filtros
  useEffect(() => {
    if (!directoryContent) {
      setFilteredItems([]);
      return;
    }

    let items = [...directoryContent.items];

    // Aplicar filtro por tipo
    if (typeFilter !== 'all') {
      items = items.filter(item => {
        switch (typeFilter) {
          case 'files':
            return item.type === 'file';
          case 'folders':
            return item.type === 'directory';
          case 'images':
            return item.type === 'file' && /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(item.name);
          case 'documents':
            return item.type === 'file' && /\.(pdf|doc|docx|txt|rtf|odt)$/i.test(item.name);
          case 'videos':
            return item.type === 'file' && /\.(mp4|avi|mkv|mov|wmv|flv|webm)$/i.test(item.name);
          case 'audio':
            return item.type === 'file' && /\.(mp3|wav|flac|aac|ogg|wma)$/i.test(item.name);
          default:
            return true;
        }
      });
    }

    // Aplicar ordenação
    items.sort((a, b) => {
      // Sempre colocar pastas primeiro
      if (a.type !== b.type) {
        if (a.type === 'directory') return -1;
        if (b.type === 'directory') return 1;
      }

      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'pt-BR', { numeric: true });
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'modified':
          comparison = new Date(a.modified).getTime() - new Date(b.modified).getTime();
          break;
        case 'type':
          const aExt = a.name.split('.').pop()?.toLowerCase() || '';
          const bExt = b.name.split('.').pop()?.toLowerCase() || '';
          comparison = aExt.localeCompare(bExt);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredItems(items);
  }, [directoryContent, typeFilter, sortBy, sortOrder]);

  // Função para obter os itens a serem exibidos
  const getDisplayItems = () => {
    return isGlobalSearch ? globalSearchResults : filteredItems;
  };

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const handleItemClick = (item: FileSystemItem, index: number, event?: React.MouseEvent) => {
    if (selectMode) {
      selectItem(item.path, index, event);
      return;
    }

    if (event?.detail === 2) { // Double click
      if (item.type === 'directory') {
        navigateToDirectory(item.path);
      } else {
        setPreviewFile(item);
      }
    } else {
      selectItem(item.path, index, event);
    }
  };

  const handleContextMenu = (event: React.MouseEvent, itemPath: string) => {
    event.preventDefault();

    // Selecionar o item se não estiver selecionado
    if (!selectedItems.has(itemPath)) {
      const item = directoryContent?.items.find(i => i.path === itemPath);
      const index = directoryContent?.items.findIndex(i => i.path === itemPath) || 0;
      if (item) {
        selectItem(item.path, index);
      }
    }

    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY }
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 } });
  };

  const handleNewFolder = async () => {
    setShowNewFolderPopup(true);
    closeContextMenu();
  };

  const handleCreateFolder = async (name: string) => {
    await createDirectory(name);
    setShowNewFolderPopup(false);
  };

  const handleRename = (itemPath: string) => {
    const item = directoryContent?.items.find(i => i.path === itemPath);
    if (item) {
      setIsRenaming(itemPath);
      setNewName(item.name);
    }
    closeContextMenu();
  };

  const confirmRename = async () => {
    if (isRenaming && newName.trim()) {
      await renameItem(isRenaming, newName.trim());
    }
    cancelRename();
  };

  const cancelRename = () => {
    setIsRenaming(null);
    setNewName('');
  };

  const handleDelete = async () => {
    setShowDeletePopup(true);
    closeContextMenu();
  };

  const confirmDelete = async () => {
    await deleteSelectedItems();
    setShowDeletePopup(false);
  };

  const handleCopy = () => {
    const items = getSelectedItemsData();
    copyItems(items);
    setShowPasteBar(true);
    closeContextMenu();
  };

  const handleCut = () => {
    const items = getSelectedItemsData();
    cutItems(items);
    closeContextMenu();
  };

  const handlePaste = async () => {
    await pasteItems();
    closeContextMenu();
  };

  const handleToggleStar = async (itemPath: string) => {
    await toggleStar(itemPath);
    closeContextMenu();
  };

  const handlePreview = (item: FileSystemItem) => {
    setPreviewFile(item);
    closeContextMenu();
  };

  const handleDownload = (item: FileSystemItem) => {
    // Implementar download do arquivo
    const link = document.createElement('a');
    link.href = `http://localhost:3001/api/files/download?path=${encodeURIComponent(item.path)}`;
    link.download = item.name;
    link.click();
    closeContextMenu();
  };

  if (loading && !directoryContent) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>
          <i className="fas fa-spinner fa-spin"></i>
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
          <button onClick={refresh} className={styles.retryBtn}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const displayItems = getDisplayItems();

  return (
    <div className={styles.myDrive}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.pathInfo}>
          {!isGlobalSearch && (
            <>
              <button
                onClick={navigateUp}
                className={styles.backBtn}
                disabled={currentPath === effectiveDrive}
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <div className={styles.breadcrumb}>
                <span>{currentPath}</span>
              </div>
            </>
          )}
          {isGlobalSearch && (
            <div className={styles.searchInfo}>
              <i className="fas fa-search"></i>
              <span>Resultados da busca: {globalSearchResults.length} encontrados</span>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {!isGlobalSearch && (
            <>
              {/* Filtro por tipo */}
              <div className={styles.filterContainer}>
                <button
                  className={styles.filterBtn}
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                >
                  <i className="fas fa-filter"></i>
                  <span>
                    {typeFilter === 'all' ? 'Todos' :
                      typeFilter === 'files' ? 'Arquivos' :
                        typeFilter === 'folders' ? 'Pastas' :
                          typeFilter === 'images' ? 'Imagens' :
                            typeFilter === 'documents' ? 'Documentos' :
                              typeFilter === 'videos' ? 'Vídeos' : 'Áudios'}
                  </span>
                  <i className="fas fa-chevron-down"></i>
                </button>

                {showTypeDropdown && (
                  <div className={styles.dropdown}>
                    <button onClick={() => { setTypeFilter('all'); setShowTypeDropdown(false); }}>
                      <i className="fas fa-th"></i> Todos
                    </button>
                    <button onClick={() => { setTypeFilter('folders'); setShowTypeDropdown(false); }}>
                      <i className="fas fa-folder"></i> Pastas
                    </button>
                    <button onClick={() => { setTypeFilter('files'); setShowTypeDropdown(false); }}>
                      <i className="fas fa-file"></i> Arquivos
                    </button>
                    <button onClick={() => { setTypeFilter('images'); setShowTypeDropdown(false); }}>
                      <i className="fas fa-image"></i> Imagens
                    </button>
                    <button onClick={() => { setTypeFilter('documents'); setShowTypeDropdown(false); }}>
                      <i className="fas fa-file-text"></i> Documentos
                    </button>
                    <button onClick={() => { setTypeFilter('videos'); setShowTypeDropdown(false); }}>
                      <i className="fas fa-video"></i> Vídeos
                    </button>
                    <button onClick={() => { setTypeFilter('audio'); setShowTypeDropdown(false); }}>
                      <i className="fas fa-music"></i> Áudios
                    </button>
                  </div>
                )}
              </div>

              {/* Ordenação */}
              <div className={styles.sortContainer}>
                <button
                  className={`${styles.sortBtn} ${sortBy === 'name' ? styles.active : ''}`}
                  onClick={() => handleSort('name')}
                >
                  <i className="fas fa-sort-alpha-down"></i>
                  Nome
                  {sortBy === 'name' && (
                    <i className={`fas fa-chevron-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </button>
                <button
                  className={`${styles.sortBtn} ${sortBy === 'modified' ? styles.active : ''}`}
                  onClick={() => handleSort('modified')}
                >
                  <i className="fas fa-calendar"></i>
                  Data
                  {sortBy === 'modified' && (
                    <i className={`fas fa-chevron-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </button>
                <button
                  className={`${styles.sortBtn} ${sortBy === 'size' ? styles.active : ''}`}
                  onClick={() => handleSort('size')}
                >
                  <i className="fas fa-weight"></i>
                  Tamanho
                  {sortBy === 'size' && (
                    <i className={`fas fa-chevron-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Modo de visualização */}
          <div className={styles.viewModeContainer}>
            <button
              className={`${styles.viewModeBtn} ${viewMode === 'grid' ? styles.active : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <i className="fas fa-th"></i>
            </button>
            <button
              className={`${styles.viewModeBtn} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
            >
              <i className="fas fa-list"></i>
            </button>
          </div>

          {/* Modo de seleção */}
          <button
            className={`${styles.selectModeBtn} ${selectMode ? styles.active : ''}`}
            onClick={() => {
              setSelectMode(!selectMode);
              if (selectMode) clearSelection();
            }}
          >
            <i className="fas fa-check-square"></i>
            {selectMode ? 'Cancelar' : 'Selecionar'}
          </button>

          {/* Seleção */}
          {selectedItems.size > 0 && (
            <div className={styles.selectionInfo}>
              <span>{selectedItems.size} selecionado(s)</span>
              <button onClick={selectAll} className={styles.selectAllBtn}>
                Selecionar tudo
              </button>
              <button onClick={clearSelection} className={styles.clearSelectionBtn}>
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de arquivos */}
      <div className={`${styles.filesList} ${styles[viewMode]}`}>
        {viewMode === 'list' && (
          <div className={styles.listHeader}>
            <div className={styles.headerName}>Nome</div>
            <div className={styles.headerSize}>Tamanho</div>
            <div className={styles.headerDate}>Modificado</div>
            <div className={styles.headerActions}></div>
          </div>
        )}

        {displayItems.length > 0 ? (
          <div className={styles.itemsContainer}>
            {displayItems.map((item, index) => (
              <div
                key={item.path}
                className={`${styles.fileItem} ${selectedItems.has(item.path) ? styles.selected : ''} ${isRenaming === item.path ? styles.renaming : ''}`}
                onClick={(e) => handleItemClick(item, index, e)}
                onContextMenu={(e) => handleContextMenu(e, item.path)}
              >
                <div className={styles.itemIcon}>
                  <i className={`${item.icon} ${item.type === 'directory' ? styles.folderIcon : styles.fileIcon}`}></i>
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
                >
                  <i className="fas fa-ellipsis-v"></i>
                </button>
              </div>
            ))}
          </div>
        ) : isGlobalSearch ? (
          <div className={styles.emptyState}>
            <i className="fas fa-search"></i>
            <p>Nenhum resultado encontrado</p>
            <button
              onClick={() => {
                setIsGlobalSearch(false);
                setGlobalSearchResults([]);
              }}
              className={styles.backBtn}
            >
              Voltar ao drive
            </button>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <i className="fas fa-folder-open"></i>
            <p>Esta pasta está vazia</p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        selectedItems={getSelectedItemsData()}
        onNewFolder={handleNewFolder}
        onRename={handleRename}
        onDelete={handleDelete}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        onToggleStar={handleToggleStar}
        onPreview={handlePreview}
        onDownload={handleDownload}
        canPaste={clipboard.items.length > 0}
      />

      {/* Paste Bar - Temporariamente removido */}
      {showPasteBar && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg-secondary)',
          padding: '10px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <span>Itens copiados: {clipboard.items.length}</span>
          <button
            onClick={handlePaste}
            style={{ marginLeft: '10px', padding: '5px 10px' }}
          >
            Colar
          </button>
          <button
            onClick={() => setShowPasteBar(false)}
            style={{ marginLeft: '10px', padding: '5px 10px' }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* File Preview */}
      {previewFile && (
        <PopupDefault
          isOpen={true}
          title={`Visualizar - ${previewFile.name}`}
          onClose={() => setPreviewFile(null)}
          isVideoPreview={['.mp4', '.avi', '.mov', '.wmv', '.mkv', '.webm'].indexOf(previewFile.extension?.toLowerCase() || '') !== -1}
        >
          <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
        </PopupDefault>
      )}

      {/* Overlay para fechar dropdown */}
      {showTypeDropdown && (
        <div
          className={styles.overlay}
          onClick={() => setShowTypeDropdown(false)}
        ></div>
      )}

      {/* Popup para nova pasta */}
      <PopupInputNewFolder
        isOpen={showNewFolderPopup}
        title="Nova pasta"
        placeholder="Pasta sem nome"
        confirmText="Criar"
        onClose={() => setShowNewFolderPopup(false)}
        onConfirm={handleCreateFolder}
      />

      {/* Popup para confirmar exclusão */}
      <PopupConfirmDelete
        isOpen={showDeletePopup}
        itemName={getSelectedItemsData()[0]?.name || ''}
        itemCount={selectedItems.size}
        onClose={() => setShowDeletePopup(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default MyDrive;