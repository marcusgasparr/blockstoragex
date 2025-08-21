import React, { useEffect, useState } from "react";
import styles from "./Starred.module.scss";
import { useFileSystem } from "../../hooks/useFileSystem";
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
  
  const [starredFiles, setStarredFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Estados para menu de contexto
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({ isOpen: false, position: { x: 0, y: 0 } });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<FileSystemItem | null>(null);
  const [previewFile, setPreviewFile] = useState<FileSystemItem | null>(null);

  const {
    getAllStarredItems,
    toggleStar,
    formatFileSize,
    formatDate,
    clipboard,
    copyItems,
    cutItems,
    pasteItems
  } = useFileSystem(selectedDrive);

  const fetchStarred = async () => {
    setLoading(true);
    setError(null);
    let timeoutId: number | null = null;
    try {
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error("Tempo limite excedido ao buscar favoritos.")), 10000);
      });
      const resultPromise = getAllStarredItems(selectedDrive);
      const result = await Promise.race([resultPromise, timeoutPromise]);
      setStarredFiles(result as any[]);
      console.log('⭐ Favoritos carregados:', (result as any[]).length, 'itens');
    } catch (err: any) {
      console.error('❌ Erro ao buscar favoritos:', err);
      setError(err.message || "Erro ao buscar arquivos favoritos.");
      setStarredFiles([]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStarred();
  }, [refreshTrigger, selectedDrive]);

  // Handler para favoritar/desfavoritar e atualizar favoritos
  const handleToggleStar = async (itemPath: string) => {
    try {
      await toggleStar(itemPath);
      // Forçar atualização da lista
      setRefreshTrigger(prev => prev + 1);
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
          <button onClick={fetchStarred} className={styles.retryBtn}>
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
          <button onClick={fetchStarred} className={styles.refreshBtn} disabled={loading}>
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
              className={`${styles.starredItem} ${selectedItems.has(item.path) ? styles.selected : ''}`}
              onClick={() => handleItemClick(item)}
              onDoubleClick={() => handleItemDoubleClick(item)}
              onContextMenu={(e) => handleContextMenu(e, item)}
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
                <i className={`fas fa-star ${styles.starIcon}`}></i>
              </div>

              <div className={styles.itemInfo}>
                <h3 className={styles.itemName} title={item.name}>
                  {item.name}
                </h3>
                <p className={styles.itemPath} title={item.path}>
                  {item.path}
                </p>
                <div className={styles.itemDetails}>
                  <span className={styles.itemType}>
                    {item.type === 'directory' ? 'Pasta' : 'Arquivo'}
                  </span>
                  {item.type === 'file' && (
                    <>
                      <span className={styles.itemSize}>
                        {formatFileSize(item.size)}
                      </span>
                      <span className={styles.itemDate}>
                        {formatDate(item.modified)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className={styles.itemActions}>
                {item.type === 'file' && (
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
                <button
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, item);
                  }}
                  title="Mais opções"
                >
                  <i className="fas fa-ellipsis-v"></i>
                </button>
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