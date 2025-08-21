import React from 'react';
import styles from './PopupDefault.module.scss';

interface PopupDefaultProps {
  isOpen: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  isVideoPreview?: boolean;
}

const PopupDefault: React.FC<PopupDefaultProps> = ({ 
  isOpen, 
  title, 
  children, 
  onClose,
  isVideoPreview = false 
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={`${styles.popup} ${isVideoPreview ? styles.videoPreview : ''}`}>
        <div className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          <button className={styles.closeBtn} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};

export default PopupDefault;