import React, { useState, useEffect } from 'react';
import styles from './MyDrive.module.scss';
import { useFileSystem } from '../../hooks/useFileSystem';
import { ContextMenu } from '../../components/ContextMenu/ContextMenu';
import { PasteBar } from '../../layouts/PasteBar/PasteBar';
import FilePreview from '../../components/FilePreview/FilePreview';
import PopupDefault from '../../layouts/PopupDefault/PopupDefault';
import PopupInputNewFolder from '../../layouts/PopupInputNewFolder/PopupInputNewFolder';
import { FileSystemItem } from '../../services/fileSystemService';
import { useSearchParams } from 'react-router-dom';
import PopupConfirmDelete from '../../layouts/PopupConfirmDelete/PopupConfirmDelete';

interface MyDriveProps {
  onSearchCallback?: (callback: (query: string) => void) => void;
  currentDrive?: string;
}

const MyDrive: React.FC<MyDriveProps> = ({ onSearchCallback, currentDrive }) => {
  const effectiveDrive = currentDrive || localStorage.getItem('selectedDrive') || 'G:\\';
  console.log('🏠 MyDrive usando disco:', effectiveDrive);

  const [searchParams, setSearchParams] = useSearchParams();

  //Popup de Nova Pasta
  const [showNewFolderPopup, setShowNewFolderPopup] = useState(false);

  //Popup de Exclusão
  const [showDeletePopup, setShowDeletePopup] = useState(false);

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
  } = useFileSystem(effectiveDrive);

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
    if (type !== 'all') {
      filtered = filtered.filter(item => {
        switch (type) {
          case 'files':
            return item.type === 'file';
          case 'folders':
            return item.type === 'directory';
          case 'images':
            return item.extension && ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'].includes(item.extension);
          case 'documents':
            return item.extension && ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.ppt', '.pptx'].includes(item.extension);
          case 'videos':
            return item.extension && ['.mp4', '.avi', '.mov', '.wmv', '.mkv'].includes(item.extension);
          case 'audio':
            return item.extension && ['.mp3', '.wav', '.flac', '.aac'].includes(item.extension);
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  // Effect para filtrar itens quando mudam os critérios
  useEffect(() => {
    const itemsToFilter = isGlobalSearch ? globalSearchResults : directoryContent?.items || [];
    const filtered = filterItems(itemsToFilter, searchQuery, typeFilter);
    setFilteredItems(filtered);
  }, [directoryContent, globalSearchResults, searchQuery, typeFilter, isGlobalSearch]);

  // Effect para registrar callback de busca
  useEffect(() => {
    if (onSearchCallback) {
      onSearchCallback(performGlobalSearch);
    }
  }, [onSearchCallback]);

  // Effect para verificar parâmetros da URL ao carregar
  useEffect(() => {
    const searchParam = searchParams.get('search');
    const globalSearchParam = searchParams.get('globalSearch');

    if (globalSearchParam) {
      performGlobalSearch(globalSearchParam);
    } else if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, []);

  // Effect para mostrar PasteBar quando há itens no clipboard
  useEffect(() => {
    setShowPasteBar(clipboard.items.length > 0);
  }, [clipboard]);

  // Handlers para ações
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

  const handleSetColor = async (itemPath: string, color: string) => {
    await setFolderColor(itemPath, color);
    closeContextMenu();
  };

  const handlePreview = (item: FileSystemItem) => {
    setPreviewFile(item);
    closeContextMenu();
  };

  const handleDownload = (item: FileSystemItem) => {
    window.open(`http://localhost:3001/api/files/download?path=${encodeURIComponent(item.path)}`, '_blank');
    closeContextMenu();
  };

  // Breadcrumb para navegação
  const renderBreadcrumb = () => {
    if (!currentPath) return null;

    const parts = currentPath.split('\\').filter(part => part);
    const breadcrumbItems = [];

    let currentPathBuild = '';
    for (const part of parts) {
      currentPathBuild += part + '\\';
      breadcrumbItems.push({
        name: part,
        path: currentPathBuild
      });
    }

    return (
      <div className={styles.breadcrumb}>
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.path}>
            <button
              className={styles.breadcrumbItem}
              onClick={() => navigateToDirectory(item.path)}
            >
              {item.name}
            </button>
            {index < breadcrumbItems.length - 1 && (
              <i className={`fas fa-chevron-right ${styles.breadcrumbSeparator}`}></i>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.myDrive}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            {isGlobalSearch ? `Resultados da busca` : 'Meu Drive'}
          </h1>
          {renderBreadcrumb()}
        </div>

        <div className={styles.controls}>
          {/* Filtros */}
          <div className={styles.filterSection}>
            <div className={styles.searchLocal}>
              <input
                type="text"
                placeholder="Filtrar nesta pasta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.typeFilter}>
              <button
                className={styles.filterBtn}
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              >
                <i className="fas fa-filter"></i>
                Tipo
                <i className="fas fa-chevron-down"></i>
              </button>

              {showTypeDropdown && (
                <div className={styles.typeDropdown}>
                  <button onClick={() => { setTypeFilter('all'); setShowTypeDropdown(false); }}>
                    Todos
                  </button>
                  <button onClick={() => { setTypeFilter('folders'); setShowTypeDropdown(false); }}>
                    Pastas
                  </button>
                  <button onClick={() => { setTypeFilter('files'); setShowTypeDropdown(false); }}>
                    Arquivos
                  </button>
                  <button onClick={() => { setTypeFilter('images'); setShowTypeDropdown(false); }}>
                    Imagens
                  </button>
                  <button onClick={() => { setTypeFilter('documents'); setShowTypeDropdown(false); }}>
                    Documentos
                  </button>
                  <button onClick={() => { setTypeFilter('videos'); setShowTypeDropdown(false); }}>
                    Vídeos
                  </button>
                  <button onClick={() => { setTypeFilter('audio'); setShowTypeDropdown(false); }}>
                    Áudio
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Controles de visualização */}
          <div className={styles.viewControls}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <i className="fas fa-th"></i>
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
            >
              <i className="fas fa-list"></i>
            </button>
            <button
              className={`${styles.viewBtn} ${selectMode ? styles.active : ''}`}
              onClick={() => setSelectMode(!selectMode)}
            >
              <i className="fas fa-check-square"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Navegação */}
      {!isGlobalSearch && (
        <div className={styles.navigation}>
          <button
            className={styles.navBtn}
            onClick={navigateUp}
            disabled={!directoryContent?.parentPath}
          >
            <i className="fas fa-arrow-left"></i>
            Voltar
          </button>
          <button className={styles.navBtn} onClick={refresh}>
            <i className="fas fa-sync-alt"></i>
            Atualizar
          </button>
          <button className={styles.navBtn} onClick={handleNewFolder}>
            <i className="fas fa-folder-plus"></i>
            Nova Pasta
          </button>
        </div>
      )}

      {/* Modo de seleção ativo */}
      {selectMode && (
        <div className={styles.selectionBar}>
          <div className={styles.selectionInfo}>
            <span>
              {selectedItems.size === 0 ? 'Modo seleção ativo' : `${selectedItems.size} item(s) selecionado(s)`}
            </span>
            <button className={styles.actionBtn} onClick={() => {
              clearSelection();
              setSelectMode(false);
            }}>
              <i className="fas fa-times"></i> Limpar
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <div className={styles.content}>
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
                className={`${viewMode === 'grid' ? styles.itemCard : styles.itemRow} ${selectedItems.has(item.path) ? styles.selected : ''} ${isGlobalSearch ? styles.globalSearchItem : ''}`}
                onClick={(e) => handleItemClick(item, index, e)}
                onContextMenu={(e) => handleContextMenu(e, item.path)}
              >
                <div className={styles.itemIcon}>
                  <i
                    className={`${item.icon} ${item.type === 'directory' ? styles.folderIcon : styles.fileIcon}`}
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
        onSetColor={handleSetColor}
        onPreview={handlePreview}
        onDownload={handleDownload}
        canPaste={clipboard.items.length > 0}
      />

      {/* Paste Bar */}
      <PasteBar
        isVisible={showPasteBar}
        items={clipboard.items}
        operation={clipboard.operation}
        onPaste={handlePaste}
        onCancel={() => {
          copyItems([]);
          setShowPasteBar(false);
        }}
      />

      {/* File Preview */}
      {previewFile && (
        <PopupDefault
          isOpen={true}
          title={`Visualizar - ${previewFile.name}`}
          onClose={() => setPreviewFile(null)}
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