import React, { useEffect, useState } from "react";
import styles from "./Recent.module.scss";
import { useFileSystem } from "../../hooks/useFileSystem";
import { useNavigate } from 'react-router-dom';
import { ContextMenu } from "../../components/ContextMenu/ContextMenu";
import FilePreview from "../../components/FilePreview/FilePreview";
import PopupDefault from "../../layouts/PopupDefault/PopupDefault";
import { FileSystemItem } from "../../services/fileSystemService";

interface RecentProps {
  currentDrive?: string;
}

const Recent: React.FC<RecentProps> = ({ currentDrive }) => {
  const navigate = useNavigate();
  const selectedDrive = currentDrive || localStorage.getItem('selectedDrive') || 'G:\\';
  console.log('🕒 Recent usando disco:', selectedDrive);
  
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para menu de contexto e preview
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({ isOpen: false, position: { x: 0, y: 0 } });
  const [selectedItem, setSelectedItem] = useState<FileSystemItem | null>(null);
  const [previewFile, setPreviewFile] = useState<FileSystemItem | null>(null);

  const {
    directoryContent,
    loading: filesLoading,
    error: filesError,
    formatFileSize,
    formatDate,
    clipboard,
    copyItems,
    cutItems,
    pasteItems,
    toggleStar
  } = useFileSystem(selectedDrive);

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      if (directoryContent && directoryContent.items) {
        const sorted = [...directoryContent.items]
          .filter(item => item.type === "file")
          .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
          .slice(0, 100);
        setRecentFiles(sorted);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao buscar arquivos recentes.");
      setRecentFiles([]);
    } finally {
      setLoading(false);
    }
  }, [directoryContent]);

  const handleItemClick = (item: FileSystemItem) => {
    setSelectedItem(item);
  };

  const handleItemDoubleClick = (item: FileSystemItem) => {
    if (item.type === 'file') {
      setPreviewFile(item);
    }
  };

  const handleContextMenu = (event: React.MouseEvent, item: FileSystemItem) => {
    event.preventDefault();
    setSelectedItem(item);
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

  const handleToggleStar = async (item: FileSystemItem) => {
    await toggleStar(item.path);
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

  if (loading || filesLoading) {
    return (
      <div className={styles.recent}>
        <div className={styles.header}>
          <h1 className={styles.title}>Arquivos Recentes</h1>
        </div>
        <div className={styles.loadingState}>
          <i className="fas fa-spinner fa-spin"></i>
          <p>Carregando arquivos recentes...</p>
        </div>
      </div>
    );
  }

  if (error || filesError) {
    return (
      <div className={styles.recent}>
        <div className={styles.header}>
          <h1 className={styles.title}>Arquivos Recentes</h1>
        </div>
        <div className={styles.errorState}>
          <i className="fas fa-exclamation-triangle"></i>
          <p>Erro: {error || filesError}</p>
          <button onClick={() => window.location.reload()} className={styles.retryBtn}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.recent}>
      <div className={styles.header}>
        <h1 className={styles.title}>Arquivos Recentes</h1>
        <p className={styles.subtitle}>
          {recentFiles.length} arquivos encontrados no disco {selectedDrive}
        </p>
      </div>

      {recentFiles.length === 0 ? (
        <div className={styles.emptyState}>
          <i className="fas fa-clock"></i>
          <p>Nenhum arquivo recente encontrado</p>
          <span>Os arquivos modificados recentemente aparecerão aqui</span>
        </div>
      ) : (
        <div className={styles.filesList}>
          {recentFiles.map((file, index) => (
            <div
              key={file.path}
              className={`${styles.fileItem} ${selectedItem?.path === file.path ? styles.selected : ''}`}
              onClick={() => handleItemClick(file)}
              onDoubleClick={() => handleItemDoubleClick(file)}
              onContextMenu={(e) => handleContextMenu(e, file)}
            >
              <div className={styles.fileIcon}>
                <i className={file.icon}></i>
                {file.isStarred && (
                  <i className={`fas fa-star ${styles.starIcon}`}></i>
                )}
              </div>
              
              <div className={styles.fileInfo}>
                <h3 className={styles.fileName}>{file.name}</h3>
                <p className={styles.filePath}>{file.path}</p>
                <div className={styles.fileDetails}>
                  <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
                  <span className={styles.fileDate}>
                    Modificado em {formatDate(file.modified)}
                  </span>
                </div>
              </div>

              <div className={styles.fileActions}>
                <button
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(file);
                  }}
                  title="Visualizar"
                >
                  <i className="fas fa-eye"></i>
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, file);
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
        onPreview={() => selectedItem && handlePreview(selectedItem)}
        onDownload={() => selectedItem && handleDownload(selectedItem)}
        onToggleStar={() => selectedItem && handleToggleStar(selectedItem)}
        onCopy={() => selectedItem && handleCopy(selectedItem)}
        onCut={() => selectedItem && handleCut(selectedItem)}
        onPaste={pasteItems}
        canPaste={clipboard.items.length > 0}
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

export default Recent;