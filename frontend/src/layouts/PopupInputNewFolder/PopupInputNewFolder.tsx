import React, { useState } from 'react';
import styles from './PopupInputNewFolder.module.scss';

interface PopupInputProps {
  isOpen: boolean;
  title: string;
  placeholder: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
  confirmText?: string;
  cancelText?: string;
  initialValue?: string;
}

const PopupInput: React.FC<PopupInputProps> = ({
  isOpen,
  title,
  placeholder,
  onClose,
  onConfirm,
  confirmText = 'Criar',
  cancelText = 'Cancelar',
  initialValue = ''
}) => {
  const [inputValue, setInputValue] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onConfirm(inputValue.trim());
      setInputValue('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handleClose = () => {
    setInputValue('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.input}
            autoFocus
          />
          
          <div className={styles.actions}>
            <button type="button" onClick={handleClose} className={styles.cancelBtn}>
              {cancelText}
            </button>
            <button type="submit" className={styles.confirmBtn} disabled={!inputValue.trim()}>
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PopupInput;