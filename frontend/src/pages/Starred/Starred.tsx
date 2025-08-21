import React, { useEffect, useState } from "react";
import styles from "./Starred.module.scss";
import { useFileSystem } from "../../hooks/useFileSystem";
import { useNavigate } from 'react-router-dom';

const Starred: React.FC = () => {
  const [starredFiles, setStarredFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { getAllStarredItems, toggleStar, formatFileSize, formatDate } = useFileSystem("H:\\");

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
  const handleToggleStar = async () => {
    const items = getSelectedItemsData();
    if (items.length !== 1) {
      console.warn('Selecione apenas um item para favoritar');
      return;
    }

    try {
      const isStarred = await toggleStar(items[0].path);
      console.log('Status de favorito atualizado para:', items[0].name);
      refresh();

      // Se foi favoritado, navegar para a página de favoritos
      if (isStarred) {
        navigate('/favoritos');
      }
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
      alert('Erro ao atualizar favorito.');
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
            <p className={styles.emptyState}>Nenhum arquivo favorito encontrado.</p>
          ) : (
            starredFiles.map((file) => (
              <div key={file.path} className={styles.fileCard}>
                <div className={styles.filePreview}>
                  <i className={file.icon}></i>
                  <i className={`fas fa-star ${styles.starIcon}`}></i>
                </div>
                <div className={styles.fileInfo}>
                  <span className={styles.fileName} title={file.name}>{file.name}</span>
                  <span className={styles.fileDate}>{formatDate(new Date(file.modified))}</span>
                  {file.type === "file" && (
                    <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
                  )}
                  <button className={styles.unstarBtn + " " + styles.modernUnstarBtn} onClick={() => handleToggleStar(file.path)}>
                    <i className="fas fa-star"></i> Remover dos favoritos
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Starred;
