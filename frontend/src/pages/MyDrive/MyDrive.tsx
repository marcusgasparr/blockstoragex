import React, { useState, useEffect } from 'react';
import styles from './MyDrive.module.scss';
import { useFileSystem } from '../../hooks/useFileSystem';
import { ContextMenu } from '../../components/ContextMenu/ContextMenu';
import FilePreview from '../../components/FilePreview/FilePreview';
import PopupDefault from '../../layouts/LayoutDefault/PopupDefault';
import { FileSystemItem } from '../../services/fileSystemService';

const MyDrive: React.FC = () => {

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
  } = useFileSystem('H:\\');

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({ isOpen: false, position: { x: 0, y: 0 } });
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [showPasteBar, setShowPasteBar] = useState(false);

  // Estado para popup de visualização
  const [previewFile, setPreviewFile] = useState<FileSystemItem | null>(null);
  const [selectMode, setSelectMode] = useState(false);

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

  // Handlers do menu de contexto
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
    setSelectMode(!selectMode);
    console.log('Modo seleção:', !selectMode ? 'ativado' : 'desativado');
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
    // Limpar clipboard se necessário
    // setClipboard({ items: [], operation: null }); // descomente se quiser limpar
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedItems, clipboard, selectAll, handleDelete, handleRename, handleCopy, handleCut, handlePaste]);

  return (
    <div className={styles.home}>
      <div className={styles.header}>
        <h1 className={styles.title}>Meu Drive</h1>
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

      <div className={styles.filters}>
        <button className={styles.filterBtn}>
          Tipo <i className="fas fa-chevron-down"></i>
        </button>
        {/* <button className={styles.filterBtn}>
          Modificado <i className="fas fa-chevron-down"></i>
        </button> */}
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {directoryContent ? `${directoryContent.totalItems} itens` : 'Carregando...'}
          </h2>
          {selectedItems.size > 0 && (
            <div className={styles.selectionActions}>
              <span className={styles.selectionCount}>
                {selectedItems.size} item(s) selecionado(s)
              </span>
              <button className={styles.actionBtn} onClick={clearSelection}>
                <i className="fas fa-times"></i> Limpar
              </button>
            </div>
          )}
        </div>

        {filesLoading ? (
          <div className={styles.loadingState}>
            <i className="fas fa-spinner fa-spin"></i>
            <p>Carregando arquivos...</p>
          </div>
        ) : filesError ? (
          <div className={styles.errorState}>
            <i className="fas fa-exclamation-triangle"></i>
            <p>Erro: {filesError}</p>
            <button onClick={refresh} className={styles.retryBtn}>Tentar novamente</button>
          </div>
        ) : directoryContent ? (
          <div className={viewMode === 'grid' ? styles.itemsGrid : styles.itemsList}>
            {directoryContent.items.map((item, index) => (
              <div
                key={item.path}
                className={`${viewMode === 'grid' ? styles.itemCard : styles.itemRow
                  } ${selectedItems.has(item.path) ? styles.selected : ''}`}
                onClick={(e) => {
                  if (selectMode) {
                    // No modo seleção, apenas seleciona/deseleciona
                    selectItem(item.path, index, e);
                  } else {
                    // Comportamento normal
                    if (item.type === 'directory') {
                      navigateToDirectory(item.path);
                    } else {
                      setPreviewFile(item);
                    }
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
                    <span className={styles.itemName} title={item.name}>
                      {item.name}
                    </span>
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
        ) : null}
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
    </div>
  );
};

export default MyDrive;