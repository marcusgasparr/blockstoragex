import React, { useEffect, useState } from 'react';
import styles from './FilePreview.module.scss';

interface FilePreviewProps {
  path: string;
  extension?: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({ path, extension }) => {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFile = async () => {
      setLoading(true);
      setError(null);

      try {
        const binaryTypes = ['.pdf', '.mp4', '.avi', '.mkv', '.mov', '.mp3', '.wav', '.flac', '.ogg'];

        if (binaryTypes.includes(extension || '')) {
          setContent(null);
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:3001/api/files/read?path=${encodeURIComponent(path)}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao ler arquivo');
        }

        const data = await response.json();
        setContent(data.data);
      } catch (err: any) {
        setError(err.message || 'Erro ao ler arquivo');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [path, extension]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>
          <i className="fas fa-spinner fa-spin"></i>
        </div>
        <p className={styles.loadingText}>Carregando arquivo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h3 className={styles.errorTitle}>Erro ao carregar arquivo</h3>
        <p className={styles.errorMessage}>{error}</p>
        <button
          className={styles.retryBtn}
          onClick={() => window.location.reload()}
        >
          <i className="fas fa-redo"></i>
          Tentar novamente
        </button>
      </div>
    );
  }

  // Video Player
  if (['.mp4', '.avi', '.mkv', '.mov', '.webm'].includes(extension || '')) {
    return (
      <div className={styles.mediaContainer}>
        <div className={styles.videoWrapper}>
          <video
            controls
            className={styles.videoPlayer}
            src={`http://localhost:3001/api/files/download?path=${encodeURIComponent(path)}`}
            poster=""
          >
            <p>Seu navegador não suporta reprodução de vídeo.</p>
          </video>
        </div>
        <div className={styles.mediaInfo}>
          <div className={styles.mediaDetails}>
            <i className="fas fa-play-circle"></i>
            <span>Arquivo de vídeo • {extension?.toUpperCase()}</span>
          </div>
        </div>
      </div>
    );
  }

  // Audio Player
  if (['.mp3', '.wav', '.flac', '.ogg', '.m4a'].includes(extension || '')) {
    return (
      <div className={styles.audioContainer}>
        <div className={styles.audioHeader}>
          <div className={styles.audioIcon}>
            <i className="fas fa-music"></i>
          </div>
          <div className={styles.audioMeta}>
            <h3 className={styles.audioTitle}>Reprodutor de Áudio</h3>
            <p className={styles.audioFormat}>Formato: {extension?.toUpperCase()}</p>
          </div>
        </div>
        <div className={styles.audioPlayerWrapper}>
          <audio
            controls
            className={styles.audioPlayer}
            src={`http://localhost:3001/api/files/download?path=${encodeURIComponent(path)}`}
          >
            Seu navegador não suporta reprodução de áudio.
          </audio>
        </div>
      </div>
    );
  }

  // PDF Viewer
  if (extension === '.pdf') {
    return (
      <div className={styles.documentContainer}>
        <div className={styles.documentHeader}>
          <div className={styles.documentInfo}>
            <i className="fas fa-file-pdf"></i>
            <span>Documento PDF</span>
          </div>
          <a
            href={`http://localhost:3001/api/files/download?path=${encodeURIComponent(path)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.openExternalBtn}
          >
            <i className="fas fa-external-link-alt"></i>
            Abrir em nova aba
          </a>
        </div>
        <div className={styles.pdfWrapper}>
          <iframe
            src={`http://localhost:3001/api/files/download?path=${encodeURIComponent(path)}`}
            title="Visualização PDF"
            className={styles.pdfViewer}
          />
        </div>
      </div>
    );
  }

  // JSON Viewer
  if (extension === '.json') {
    try {
      const jsonObj = content ? JSON.parse(content) : null;
      return (
        <div className={styles.codeContainer}>
          <div className={styles.codeHeader}>
            <div className={styles.codeInfo}>
              <i className="fas fa-code"></i>
              <span>Arquivo JSON</span>
            </div>
            <div className={styles.codeActions}>
              <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(content || '')}>
                <i className="fas fa-copy"></i>
                Copiar
              </button>
            </div>
          </div>
          <div className={styles.codeContent}>
            <pre className={styles.jsonCode}>
              {JSON.stringify(jsonObj, null, 2)}
            </pre>
          </div>
        </div>
      );
    } catch {
      // Se não conseguir parsear, mostra como texto
    }
  }

  // Text Viewer
  return (
    <div className={styles.textContainer}>
      <div className={styles.textHeader}>
        <div className={styles.textInfo}>
          <i className="fas fa-file-alt"></i>
          <span>Documento de Texto • {extension?.toUpperCase() || 'TXT'}</span>
        </div>
        <div className={styles.textActions}>
          <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(content || '')}>
            <i className="fas fa-copy"></i>
            Copiar texto
          </button>
        </div>
      </div>
      <div className={styles.textContent}>
        <pre className={styles.textBody}>
          {content}
        </pre>
      </div>
    </div>
  );
};

export default FilePreview;