import React, { useState, useEffect } from 'react';
import styles from './PopupCreateShortcut.module.scss';

interface PopupCreateShortcutProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, url: string) => void;
  initialName?: string;
  initialUrl?: string;
}

const PopupCreateShortcut: React.FC<PopupCreateShortcutProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialName = '',
  initialUrl = ''
}) => {
  const [shortcutName, setShortcutName] = useState(initialName);
  const [shortcutUrl, setShortcutUrl] = useState(initialUrl);
  const [errors, setErrors] = useState<{ name?: string; url?: string }>({});

  // Reset form quando abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setShortcutName(initialName);
      setShortcutUrl(initialUrl);
      setErrors({});
    }
  }, [isOpen, initialName, initialUrl]);

  const validateForm = (): boolean => {
    const newErrors: { name?: string; url?: string } = {};

    // Validar nome
    if (!shortcutName.trim()) {
      newErrors.name = 'Nome do atalho é obrigatório';
    } else if (shortcutName.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Validar URL
    if (!shortcutUrl.trim()) {
      newErrors.url = 'URL é obrigatória';
    } else {
      try {
        new URL(shortcutUrl.trim());
      } catch {
        newErrors.url = 'URL inválida. Use formato: https://exemplo.com';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onConfirm(shortcutName.trim(), shortcutUrl.trim());
      handleClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handleClose = () => {
    setShortcutName('');
    setShortcutUrl('');
    setErrors({});
    onClose();
  };

  // Auto-completar https:// se não tiver protocolo
  const handleUrlBlur = () => {
    if (shortcutUrl && !shortcutUrl.match(/^https?:\/\//)) {
      setShortcutUrl(`https://${shortcutUrl}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            <i className="fas fa-external-link-alt"></i>
            Criar Atalho
          </h3>
          <button 
            className={styles.closeBtn} 
            onClick={handleClose}
            type="button"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="shortcut-name" className={styles.label}>
              Nome do Atalho
            </label>
            <input
              id="shortcut-name"
              type="text"
              placeholder="Ex: GitHub, Google Drive, etc."
              value={shortcutName}
              onChange={(e) => setShortcutName(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              autoFocus
            />
            {errors.name && (
              <span className={styles.errorText}>
                <i className="fas fa-exclamation-circle"></i>
                {errors.name}
              </span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="shortcut-url" className={styles.label}>
              URL do Site
            </label>
            <input
              id="shortcut-url"
              type="url"
              placeholder="https://exemplo.com"
              value={shortcutUrl}
              onChange={(e) => setShortcutUrl(e.target.value)}
              onBlur={handleUrlBlur}
              onKeyDown={handleKeyDown}
              className={`${styles.input} ${errors.url ? styles.inputError : ''}`}
            />
            {errors.url && (
              <span className={styles.errorText}>
                <i className="fas fa-exclamation-circle"></i>
                {errors.url}
              </span>
            )}
          </div>
          
          <div className={styles.actions}>
            <button type="button" onClick={handleClose} className={styles.cancelBtn}>
              Cancelar
            </button>
            <button type="submit" className={styles.confirmBtn}>
              <i className="fas fa-plus"></i>
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PopupCreateShortcut;
