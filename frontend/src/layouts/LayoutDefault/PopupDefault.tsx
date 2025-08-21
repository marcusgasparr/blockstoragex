import React from 'react';
import styles from './PopupDefault.module.scss';

interface PopupDefaultProps {
  isOpen: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
}

const PopupDefault: React.FC<PopupDefaultProps> = ({ isOpen, title, children, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
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
