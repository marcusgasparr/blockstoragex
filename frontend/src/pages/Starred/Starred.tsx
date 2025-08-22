import React, { useEffect, useState } from "react";
import styles from "./Starred.module.scss";
import { useFileSystem } from "../../hooks/useFileSystem";
import { useFavorites } from "../../hooks/useFavorites";
import { useNavigate } from 'react-router-dom';
import { ContextMenu } from "../../components/ContextMenu/ContextMenu";
import FilePreview from "../../components/FilePreview/FilePreview";
import PopupDefault from "../../layouts/PopupDefault/PopupDefault";
import { FileSystemItem } from "../../services/fileSystemService";

interface StarredProps {
  currentDrive?: string;
}

const Starred: React.FC<StarredProps> = ({ currentDrive }) => {
  const navigate = useNavigate();
  const selectedDrive = currentDrive || localStorage.getItem('selectedDrive') || 'G:\\';
  console.log('⭐ Starred usando disco:', selectedDrive);
  
  // Estados para menu de contexto
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({ isOpen: false, position: { x: 0, y: 0 } });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<FileSystemItem | null>(null);
  const [previewFile, setPreviewFile] = useState<FileSystemItem | null>(null);

  // Hook para sistema de arquivos (operações gerais)
  const {
    formatFileSize,
    formatDate,
    clipboard,
    copyItems,
    cutItems,
    pasteItems
  } = useFileSystem(selectedDrive);

  // Hook para gerenciar favoritos
  const {
    favorites,
    loading,
    error,
    toggleFavorite,
    refreshFavorites,
    stats
  } = useFavorites(1, selectedDrive);

  // Função auxiliar para obter ícone do arquivo
  const getFileIcon = (fileName: string, isDirectory: boolean): string => {
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
  };

  // Converter favoritos para formato FileSystemItem
  const starredFiles: FileSystemItem[] = favorites.map(fav => ({
    name: fav.file_name,
    path: fav.file_path,
    type: fav.isDirectory ? 'directory' : 'file',
    size: fav.size,
    modified: new Date(fav.modified || fav.created_at),
    extension: fav.file_type || undefined,
    icon: getFileIcon(fav.file_name, fav.isDirectory),
    isStarred: true,
    exists: fav.exists
  }));

  // Handler para favoritar/desfavoritar e atualizar favoritos
  const handleToggleStar = async (itemPath: string) => {
    try {
      await toggleFavorite(itemPath);
      console.log('⭐ Favorito alternado para:', itemPath);
    } catch (err) {
      console.error('Erro ao alterar favorito:', err);
    }
    closeContextMenu();
  };

  const handleItemClick = (item: FileSystemItem) => {
    setSelectedItem(item);
    setSelectedItems(new Set([item.path]));
  };

  const handleItemDoubleClick = (item: FileSystemItem) => {
    if (item.type === 'file') {
      setPreviewFile(item);
    } else {
      // Navegar para a pasta no MyDrive
      navigate(`/?path=${encodeURIComponent(item.path)}`);
    }
  };

  const handleContextMenu = (event: React.MouseEvent, item: FileSystemItem) => {
    event.preventDefault();
    setSelectedItem(item);
    setSelectedItems(new Set([item.path]));
    setContextMenu({
      isOpen: true,
      position: { x: event.clientX, y: event.clientY }
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 } });
  };

  const handlePreview = (item: FileSystemItem) => {
    setPreviewFile(item);
    closeContextMenu();
  };

  const handleDownload = (item: FileSystemItem) => {
    window.open(`http://localhost:3001/api/files/download?path=${encodeURIComponent(item.path)}`, '_blank');
    closeContextMenu();
  };

  const handleCopy = (item: FileSystemItem) => {
    copyItems([item]);
    closeContextMenu();
  };

  const handleCut = (item: FileSystemItem) => {
    cutItems([item]);
    closeContextMenu();
  };

  const handleGoToLocation = (item: FileSystemItem) => {
    const parentPath = item.path.substring(0, item.path.lastIndexOf('\\'));
    navigate(`/?path=${encodeURIComponent(parentPath)}`);
    closeContextMenu();
  };

  const handleRefresh = () => {
    refreshFavorites();
  };

  if (loading) {
    return (
      <div className={styles.starred}>
        <div className={styles.header}>
          <h1 className={styles.title}>Arquivos Favoritos</h1>
        </div>
        <div className={styles.loadingState}>
          <i className="fas fa-spinner fa-spin"></i>
          <p>Carregando arquivos favoritos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.starred}>
        <div className={styles.header}>
          <h1 className={styles.title}>Arquivos Favoritos</h1>
        </div>
        <div className={styles.errorState}>
          <i className="fas fa-exclamation-triangle"></i>
          <p>Erro: {error}</p>
          <button onClick={handleRefresh} className={styles.retryBtn}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.starred}>
      <div className={styles.header}>
        <h1 className={styles.title}>Arquivos Favoritos</h1>
        <div className={styles.headerActions}>
          <p className={styles.subtitle}>
            {starredFiles.length} {starredFiles.length === 1 ? 'item favorito' : 'itens favoritos'} no disco {selectedDrive}
          </p>
          <button onClick={handleRefresh} className={styles.refreshBtn} disabled={loading}>
            <i className="fas fa-sync-alt"></i>
            Atualizar
          </button>
        </div>
      </div>

      {starredFiles.length === 0 ? (
        <div className={styles.emptyState}>
          <i className="fas fa-star"></i>
          <p>Nenhum arquivo favorito encontrado</p>
          <span>Adicione arquivos e pastas aos favoritos para vê-los aqui</span>
        </div>
      ) : (
        <div className={styles.starredGrid}>
          {starredFiles.map((item, index) => (
            <div
              key={item.path}
              className={`${styles.starredItem} ${selectedItems.has(item.path) ? styles.selected : ''} ${!item.exists ? styles.unavailable : ''}`}
              onClick={() => handleItemClick(item)}
              onDoubleClick={() => handleItemDoubleClick(item)}
              onContextMenu={(e) => handleContextMenu(e, item)}
            >
              <div className={styles.itemIcon}>
                <i className={item.icon} />
                <div className={styles.starIcon}>
                  <i className="fas fa-star"></i>
                </div>
                {!item.exists && (
                  <div className={styles.unavailableIcon}>
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                )}
              </div>

              <div className={styles.itemContent}>
                <div className={styles.itemName} title={item.name}>
                  {item.name}
                </div>
                <div className={styles.itemPath} title={item.path}>
                  {item.path}
                </div>
                <div className={styles.itemDetails}>
                  <span className={styles.itemType}>
                    {item.type === 'directory' ? 'Pasta' : (item.extension || 'Arquivo')}
                  </span>
                  {item.type === 'file' && (
                    <span className={styles.itemSize}>
                      {formatFileSize(item.size)}
                    </span>
                  )}
                  <span className={styles.itemDate}>
                    {formatDate(item.modified)}
                  </span>
                </div>
                {!item.exists && (
                  <div className={styles.unavailableLabel}>
                    Arquivo não encontrado
                  </div>
                )}
              </div>

              <div className={styles.itemActions}>
                <button
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStar(item.path);
                  }}
                  title="Remover dos favoritos"
                >
                  <i className="fas fa-star"></i>
                </button>
                {item.exists && item.type === 'file' && (
                  <button
                    className={styles.actionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(item);
                    }}
                    title="Visualizar"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                )}
                {item.exists && (
                  <button
                    className={styles.actionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGoToLocation(item);
                    }}
                    title="Ir para localização"
                  >
                    <i className="fas fa-map-marker-alt"></i>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        selectedItems={selectedItem ? [selectedItem] : []}
        onPreview={selectedItem?.type === 'file' ? () => selectedItem && handlePreview(selectedItem) : undefined}
        onDownload={selectedItem?.type === 'file' ? () => selectedItem && handleDownload(selectedItem) : undefined}
        onToggleStar={() => selectedItem && handleToggleStar(selectedItem.path)}
        onCopy={() => selectedItem && handleCopy(selectedItem)}
        onCut={() => selectedItem && handleCut(selectedItem)}
        onPaste={pasteItems}
        canPaste={clipboard.items.length > 0}
        extraActions={[
          {
            label: 'Ir para localização',
            icon: 'fas fa-map-marker-alt',
            action: () => selectedItem && handleGoToLocation(selectedItem)
          }
        ]}
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
    </div>
  );
};

export default Starred;