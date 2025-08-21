import React, { useEffect, useState } from "react";
import styles from "./Recent.module.scss";
import { useFileSystem } from "../../hooks/useFileSystem";

const Recent: React.FC = () => {
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { directoryContent, loading: filesLoading, error: filesError, formatFileSize, formatDate } = useFileSystem("H:\\");

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
            <p className={styles.emptyState}>Nenhum arquivo recente encontrado.</p>
          ) : (
            recentFiles.map((file) => (
              <div key={file.path} className={styles.fileCard}>
                <div className={styles.filePreview}>
                  <i className={file.icon}></i>
                </div>
                <div className={styles.fileInfo}>
                  <span className={styles.fileName} title={file.name}>{file.name}</span>
                  <span className={styles.fileDate}>{formatDate(new Date(file.modified))}</span>
                  <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Recent;
