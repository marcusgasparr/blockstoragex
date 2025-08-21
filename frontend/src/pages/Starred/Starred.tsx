import React, { useEffect, useState } from "react";
import styles from "./Starred.module.scss";
import { useFileSystem } from "../../hooks/useFileSystem";
import { useNavigate } from 'react-router-dom';
import { ContextMenu } from "../../components/ContextMenu/ContextMenu";
import FilePreview from "../../components/FilePreview/FilePreview";
import PopupDefault from "../../layouts/LayoutDefault/PopupDefault";
import { FileSystemItem } from "../../services/fileSystemService";

const Starred: React.FC = () => {
  const navigate = useNavigate();
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
  } = useFileSystem("H:\\");

  const fetchStarred = async () => {
    setLoading(true);
    setError(null);
    let timeoutId: number | null = null;
    try {
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error("Tempo limite excedido ao buscar favoritos.")), 10000);
      });
      const resultPromise = getAllStarredItems("H:\\");
      const result = await Promise.race([resultPromise, timeoutPromise]);
      setStarredFiles(result as any[]);
    } catch (err: any) {
      setError(err.message || "Erro ao buscar arquivos favoritos.");
      setStarredFiles([]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStarred();
  }, [refreshTrigger]);

  // Handler para favoritar/desfavoritar e atualizar favoritos
  const handleToggleStar = async (itemPath?: string) => {
    try {
      const pathToToggle = itemPath || selectedItem?.path;
      if (!pathToToggle) return;

      const isStarred = await toggleStar(pathToToggle);
      console.log('Status de favorito atualizado');
      setRefreshTrigger(t => t + 1);
      closeContextMenu();

      // Se foi desfavoritado, o item sumirá da lista
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
    }
  };

  // Handlers do menu de contexto
  const handleContextMenu = (e: React.MouseEvent, item: FileSystemItem) => {
    e.preventDefault();
    setSelectedItem(item);
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY }
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 } });
    setSelectedItem(null);
  };

  const handleGoToFile = () => {
    if (!selectedItem) return;

    // Navegar para o diretório pai do arquivo
    const pathParts = selectedItem.path.split('\\');
    pathParts.pop();
    const parentPath = pathParts.join('\\');

    // Navegar para MyDrive com o caminho específico e selecionar o arquivo
    navigate(`/?path=${encodeURIComponent(parentPath)}&selected=${encodeURIComponent(selectedItem.path)}`);
    closeContextMenu();
  };

  const handleSelectMode = () => {
    if (!selectedItem) return;
    // Selecionar o item atual
    setSelectedItems(new Set([selectedItem.path]));
    closeContextMenu();
  };

  const handleCopy = () => {
    if (!selectedItem) return;
    copyItems([selectedItem]);
    closeContextMenu();
  };

  const handleCut = () => {
    if (!selectedItem) return;
    cutItems([selectedItem]);
    closeContextMenu();
  };

  const handlePaste = async () => {
    if (clipboard.items.length === 0) return;

    try {
      await pasteItems();
      setRefreshTrigger(t => t + 1);
    } catch (error) {
      console.error('Erro ao colar:', error);
    }
    closeContextMenu();
  };

  const handleDownload = async () => {
    if (!selectedItem) return;

    try {
      if (selectedItem.type === 'file') {
        // Download de arquivo
        const response = await fetch(`http://localhost:3001/api/files/download?path=${encodeURIComponent(selectedItem.path)}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedItem.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else if (selectedItem.type === 'directory') {
        // Download de pasta como zip
        const response = await fetch(`http://localhost:3001/api/files/download-folder?path=${encodeURIComponent(selectedItem.path)}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedItem.name + '.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      alert('Erro ao fazer download do arquivo.');
    }
    closeContextMenu();
  };

  const handleDoubleClick = (item: FileSystemItem) => {
    if (item.type === 'directory') {
      // Navegar para a pasta
      navigate(`/?path=${encodeURIComponent(item.path)}`);
    } else {
      // Abrir preview do arquivo
      setPreviewFile(item);
    }
  };

  return (
    <div className={styles.starred}>
      <div className={styles.header}>
        <h1 className={styles.title}>Favoritos</h1>
        <span className={styles.count}>{starredFiles.length} arquivos</span>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <i className="fas fa-spinner fa-spin"></i>
          <p>Carregando arquivos...</p>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
        </div>
      ) : (
        <div className={styles.filesGrid}>
          {starredFiles.length === 0 ? (
            <div className={styles.emptyState}>
              <i className="fas fa-star"></i>
              <h3>Nenhum arquivo favoritado</h3>
              <p>Adicione arquivos aos favoritos para vê-los aqui</p>
            </div>
          ) : (
            starredFiles.map((item) => (
              <div
                key={item.path}
                className={`${styles.fileCard} ${selectedItems.has(item.path) ? styles.selected : ''}`}
                onDoubleClick={() => handleDoubleClick(item)}
                onContextMenu={(e) => handleContextMenu(e, item)}
              >
                <div className={styles.fileIcon}>
                  <i
                    className={item.icon}
                    style={{
                      color: item.type === 'directory' && item.folderColor
                        ? item.folderColor
                        : undefined
                    }}
                  ></i>
                  <i className={`fas fa-star ${styles.starIcon}`}></i>
                </div>
                <div className={styles.fileInfo}>
                  <span className={styles.fileName} title={item.name}>
                    {item.name}
                  </span>
                  <span className={styles.fileSize}>
                    {item.type === 'file' ? formatFileSize(item.size) : 'Pasta'}
                  </span>
                  <span className={styles.fileDate}>
                    {formatDate(item.modified)}
                  </span>
                </div>
                <button
                  className={styles.moreBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, item);
                  }}
                >
                  <i className="fas fa-ellipsis-v"></i>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Menu de contexto específico para favoritos */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        selectedItems={selectedItem ? [selectedItem] : []}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        onDelete={() => { }} // Não permite excluir na página de favoritos
        onRename={() => { }} // Não permite renomear na página de favoritos
        onCreateFolder={() => { }} // Não permite criar pasta na página de favoritos
        onToggleStar={() => handleToggleStar()}
        onSetFolderColor={() => { }} // Não permite alterar cor na página de favoritos
        onDownload={handleDownload}
        onSelectMode={handleSelectMode}
        canPaste={clipboard.items.length > 0}
        // Props específicas para favoritos
        isStarredPage={true}
        onGoToFile={handleGoToFile}
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
    </div>
  );
};

export default Starred;