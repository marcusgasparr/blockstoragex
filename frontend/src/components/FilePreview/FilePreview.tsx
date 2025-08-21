import React, { useState, useEffect } from 'react';
import { FileSystemItem } from '../../services/fileSystemService';
import styles from './FilePreview.module.scss';

interface FilePreviewProps {
  file: FileSystemItem;
  onClose: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFileContent();
  }, [file]);

  const loadFileContent = async () => {
    if (!file || file.type !== 'file') {
      setError('Arquivo inválido');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Verificar se é um arquivo de texto
      const textExtensions = ['.txt', '.md', '.json', '.xml', '.css', '.js', '.html', '.csv'];
      const isTextFile = textExtensions.some(ext => 
        file.extension?.toLowerCase() === ext
      );

      if (isTextFile) {
        const response = await fetch(
          `http://localhost:3001/api/files/read?path=${encodeURIComponent(file.path)}`
        );
        
        if (!response.ok) {
          throw new Error('Erro ao carregar arquivo');
        }

        const data = await response.json();
        if (data.success) {
          setContent(data.data);
        } else {
          throw new Error(data.message || 'Erro ao carregar conteúdo');
        }
      } else {
        setError('Tipo de arquivo não suportado para visualização');
      }
    } catch (err) {
      console.error('Erro ao carregar arquivo:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const getFileTypeInfo = () => {
    const ext = file.extension?.toLowerCase();
    
    switch (ext) {
      case '.txt':
        return { type: 'Texto', icon: 'fas fa-file-alt' };
      case '.md':
        return { type: 'Markdown', icon: 'fab fa-markdown' };
      case '.json':
        return { type: 'JSON', icon: 'fas fa-code' };
      case '.xml':
        return { type: 'XML', icon: 'fas fa-code' };
      case '.css':
        return { type: 'CSS', icon: 'fab fa-css3-alt' };
      case '.js':
        return { type: 'JavaScript', icon: 'fab fa-js-square' };
      case '.html':
        return { type: 'HTML', icon: 'fab fa-html5' };
      case '.csv':
        return { type: 'CSV', icon: 'fas fa-table' };
      case '.pdf':
        return { type: 'PDF', icon: 'fas fa-file-pdf' };
      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.gif':
        return { type: 'Imagem', icon: 'fas fa-image' };
      default:
        return { type: 'Arquivo', icon: 'fas fa-file' };
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    window.open(
      `http://localhost:3001/api/files/download?path=${encodeURIComponent(file.path)}`,
      '_blank'
    );
  };

  const fileInfo = getFileTypeInfo();

  return (
    <div className={styles.filePreview}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.fileInfo}>
          <i className={`${fileInfo.icon} ${styles.fileIcon}`}></i>
          <div className={styles.details}>
            <h3 className={styles.fileName}>{file.name}</h3>
            <div className={styles.metadata}>
              <span>{fileInfo.type}</span>
              <span>•</span>
              <span>{formatFileSize(file.size)}</span>
              <span>•</span>
              <span>{new Date(file.modified).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={handleDownload}
            title="Download"
          >
            <i className="fas fa-download"></i>
          </button>
          <button
            className={styles.actionBtn}
            onClick={onClose}
            title="Fechar"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>
            <i className="fas fa-spinner fa-spin"></i>
            <p>Carregando arquivo...</p>
          </div>
        ) : error ? (
          <div className={styles.error}>
            <i className="fas fa-exclamation-triangle"></i>
            <div className={styles.errorContent}>
              <h4>Não foi possível visualizar o arquivo</h4>
              <p>{error}</p>
              <button onClick={handleDownload} className={styles.downloadBtn}>
                <i className="fas fa-download"></i>
                Fazer download
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.fileContent}>
            {/* Visualização de imagem */}
            {file.extension && ['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(file.extension.toLowerCase()) ? (
              <div className={styles.imagePreview}>
                <img
                  src={`http://localhost:3001/api/files/read?path=${encodeURIComponent(file.path)}`}
                  alt={file.name}
                  className={styles.image}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    setError('Erro ao carregar imagem');
                  }}
                />
              </div>
            ) : content ? (
              /* Visualização de texto */
              <div className={styles.textPreview}>
                <pre className={styles.textContent}>{content}</pre>
              </div>
            ) : (
              /* Fallback */
              <div className={styles.noPreview}>
                <i className={`${fileInfo.icon} ${styles.largeIcon}`}></i>
                <h4>Visualização não disponível</h4>
                <p>Este tipo de arquivo não pode ser visualizado diretamente.</p>
                <button onClick={handleDownload} className={styles.downloadBtn}>
                  <i className="fas fa-download"></i>
                  Fazer download para abrir
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.path}>
          <i className="fas fa-folder"></i>
          <span>{file.path}</span>
        </div>
      </div>
    </div>
  );
};

export default FilePreview;