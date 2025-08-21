import React from 'react';
import styles from './PasteBar.module.scss';
import { FileSystemItem } from '../../services/fileSystemService';

interface PasteBarProps {
  isVisible: boolean;
  operation: 'copy' | 'cut' | null;
  items: FileSystemItem[];
  onPaste: () => void;
  onCancel: () => void;
}

export const PasteBar: React.FC<PasteBarProps> = ({
  isVisible,
  operation,
  items,
  onPaste,
  onCancel
}) => {
  if (!isVisible || !operation || items.length === 0) return null;

  const operationText = operation === 'copy' ? 'Copiando' : 'Movendo';
  const fileName = items.length === 1 
    ? items[0].name 
    : `${items.length} itens`;

  return (
    <div className={styles.pasteBar}>
      <div className={styles.content}>
        <div className={styles.operationInfo}>
          <div className={styles.operationIcon}>
            <i className={operation === 'copy' ? 'fas fa-copy' : 'fas fa-cut'}></i>
          </div>
          <div className={styles.text}>
            <span className={styles.operation}>{operationText}</span>
            <span className={styles.fileName}>{fileName}</span>
          </div>
        </div>
        
        <div className={styles.actions}>
          <button 
            className={styles.cancelBtn}
            onClick={onCancel}
            title="Cancelar operação"
          >
            <i className="fas fa-times"></i>
          </button>
          <button 
            className={styles.pasteBtn}
            onClick={onPaste}
            title="Colar aqui"
          >
            <i className="fas fa-paste"></i>
            Colar Aqui
          </button>
        </div>
      </div>
    </div>
  );
};