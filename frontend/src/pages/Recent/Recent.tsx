import React, { useEffect, useState } from "react";
import styles from "./Recent.module.scss";
import { useFileSystem } from "../../hooks/useFileSystem";
import { useNavigate } from 'react-router-dom';
import { ContextMenu } from "../../components/ContextMenu/ContextMenu";
import FilePreview from "../../components/FilePreview/FilePreview";
import PopupDefault from "../../layouts/LayoutDefault/PopupDefault";
import { FileSystemItem } from "../../services/fileSystemService";

const Recent: React.FC = () => {
  const navigate = useNavigate();
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
  } = useFileSystem("H:\\");

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
    } finally {
      setLoading(false);
    }
  }, [directoryContent]);

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
    pathParts.pop(); // Remove o nome do arquivo
    const parentPath = pathParts.join('\\');

    // Navegar para MyDrive com o caminho específico e selecionar o arquivo
    navigate(`/?path=${encodeURIComponent(parentPath)}&selected=${encodeURIComponent(selectedItem.path)}`);
    closeContextMenu();
  };

  const handleSelectMode = () => {
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
    } catch (error) {
      console.error('Erro ao colar:', error);
    }
    closeContextMenu();
  };

  const handleDownload = async () => {
    if (!selectedItem) return;

    try {
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
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      alert('Erro ao fazer download do arquivo.');
    }
    closeContextMenu();
  };

  const handleToggleStar = async () => {
    if (!selectedItem) return;

    try {
      await toggleStar(selectedItem.path);
      // Atualizar o estado local do arquivo
      setRecentFiles(prev => prev.map(file =>
        file.path === selectedItem.path
          ? { ...file, isStarred: !file.isStarred }
          : file
      ));
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
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
    <div className={styles.recent}>
      <div className={styles.header}>
        <h1 className={styles.title}>Arquivos Recentes</h1>
        <span className={styles.count}>{recentFiles.length} arquivos</span>
      </div>

      {loading || filesLoading ? (
        <div className={styles.loadingState}>
          <i className="fas fa-spinner fa-spin"></i>
          <p>Carregando arquivos...</p>
        </div>
      ) : error || filesError ? (
        <div className={styles.errorState}>
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error || filesError}</p>
        </div>
      ) : (
        <div className={styles.filesGrid}>
          {recentFiles.length === 0 ? (
            <div className={styles.emptyState}>
              <i className="fas fa-clock"></i>
              <h3>Nenhum arquivo recente</h3>
              <p>Os arquivos que você acessou recentemente aparecerão aqui</p>
            </div>
          ) : (
            recentFiles.map((file) => (
              <div
                key={file.path}
                className={styles.fileCard}
                onDoubleClick={() => handleDoubleClick(file)}
                onContextMenu={(e) => handleContextMenu(e, file)}
              >
                <div className={styles.filePreview}>
                  <i className={file.icon}></i>
                  {file.isStarred && (
                    <i className={`fas fa-star ${styles.starIcon}`}></i>
                  )}
                </div>
                <div className={styles.fileInfo}>
                  <span className={styles.fileName} title={file.name}>
                    {file.name}
                  </span>
                  <span className={styles.fileDate}>
                    {formatDate(new Date(file.modified))}
                  </span>
                  <span className={styles.fileSize}>
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <button
                  className={styles.moreBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, file);
                  }}
                >
                  <i className="fas fa-ellipsis-v"></i>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Menu de contexto para arquivos recentes */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        selectedItems={selectedItem ? [selectedItem] : []}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        onDelete={() => { }} // Não permite excluir na página de recentes
        onRename={() => { }} // Não permite renomear na página de recentes
        onCreateFolder={() => { }} // Não permite criar pasta na página de recentes
        onToggleStar={handleToggleStar}
        onSetFolderColor={() => { }} // Não permite alterar cor na página de recentes
        onDownload={handleDownload}
        onSelectMode={handleSelectMode}
        canPaste={clipboard.items.length > 0}
        // Props específicas para recentes
        isStarredPage={true} // Usar o mesmo menu simplificado
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

export default Recent;