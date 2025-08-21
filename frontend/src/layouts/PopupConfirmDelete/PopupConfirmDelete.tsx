import React from 'react';
import styles from './PopupConfirmDelete.module.scss';

interface PopupConfirmDeleteProps {
  isOpen: boolean;
  itemName: string;
  itemCount?: number;
  onClose: () => void;
  onConfirm: () => void;
}

const PopupConfirmDelete: React.FC<PopupConfirmDeleteProps> = ({
  isOpen,
  itemName,
  itemCount = 1,
  onClose,
  onConfirm
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  if (!isOpen) return null;

  const getMessage = () => {
    if (itemCount === 1) {
      return `Você tem certeza que quer excluir ${itemName}?`;
    } else {
      return `Você tem certeza que quer excluir ${itemCount} itens selecionados?`;
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Excluir</h3>
        </div>
        
        <div className={styles.content}>
          <p className={styles.message}>{getMessage()}</p>
        </div>
        
        <div className={styles.actions}>
          <button type="button" onClick={onClose} className={styles.cancelBtn}>
            Cancelar
          </button>
          <button type="button" onClick={handleConfirm} className={styles.deleteBtn}>
            Quero excluir
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopupConfirmDelete;