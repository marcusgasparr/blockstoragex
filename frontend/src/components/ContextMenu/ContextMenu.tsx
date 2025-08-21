import React, { useEffect, useRef, useState } from 'react';
import styles from './ContextMenu.module.scss';
import { FileSystemItem } from '../../services/fileSystemService';

// Tipagem original para menu
interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  selectedItems: FileSystemItem[];
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onRename: () => void;
  onCreateFolder: () => void;
  onToggleStar: () => void;
  onSetFolderColor: (color: string) => void;
  canPaste: boolean;
  onDownload: () => void;
  onSelectMode: () => void;
}

// Tipagem robusta para itens do menu
interface MenuItemBase {
  label?: string;
  icon?: string;
  action?: () => void;
  disabled?: boolean;
  shortcut?: string;
  danger?: boolean;
}
interface SeparatorItem {
  type: 'separator';
}
interface SubmenuItem extends MenuItemBase {
  submenu: Array<{ label: string; color?: string; action?: () => void }>;
}
type MenuItem = MenuItemBase | SeparatorItem | SubmenuItem;

export const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  selectedItems,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onRename,
  onCreateFolder,
  onToggleStar,
  onSetFolderColor,
  canPaste,
  onDownload,
  onSelectMode
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current;
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      const menuRect = menu.getBoundingClientRect();
      let newX = position.x;
      let newY = position.y;

      // Ajustar posição X se o menu sair da tela
      if (position.x + menuRect.width > viewport.width) {
        newX = viewport.width - menuRect.width - 10;
      }

      // Ajustar posição Y se o menu sair da tela
      if (position.y + menuRect.height > viewport.height) {
        newY = viewport.height - menuRect.height - 10;
      }

      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [isOpen, position]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasSelection = selectedItems.length > 0;
  const isSingleSelection = selectedItems.length === 1;
  const isDirectory = hasSelection && selectedItems[0].type === 'directory';
  const isStarred = hasSelection && selectedItems[0].isStarred;

  const menuItems = [
    {
      label: 'Selecionar',
      icon: 'fas fa-check-square',
      action: onSelectMode,
      disabled: false
    },
    {
      label: 'Nova Pasta',
      icon: 'fas fa-folder-plus',
      action: onCreateFolder,
      disabled: false
    },
    { type: 'separator' },
    {
      label: 'Copiar',
      icon: 'fas fa-copy',
      action: onCopy,
      disabled: false,
      shortcut: 'Ctrl+C'
    },
    {
      label: 'Recortar',
      icon: 'fas fa-cut',
      action: onCut,
      disabled: false,
      shortcut: 'Ctrl+X'
    },
    {
      label: 'Colar',
      icon: 'fas fa-paste',
      action: onPaste,
      disabled: false,
      shortcut: 'Ctrl+V'
    },
    { type: 'separator' },
    {
      label: 'Download',
      icon: 'fas fa-download',
      action: onDownload,
      disabled: false
    },
    {
      label: selectedItems.length === 1 && selectedItems[0].isStarred ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos',
      icon: selectedItems.length === 1 && selectedItems[0].isStarred ? 'fas fa-star' : 'far fa-star',
      action: onToggleStar,
      disabled: false
    },
    {
      label: 'Cor da Pasta',
      icon: 'fas fa-palette',
      action: () => {},
      disabled: false,
      submenu: [
        { label: 'Azul', color: '#007acc', action: () => onSetFolderColor('#007acc') },
        { label: 'Verde', color: '#28a745', action: () => onSetFolderColor('#28a745') },
        { label: 'Vermelho', color: '#dc3545', action: () => onSetFolderColor('#dc3545') },
        { label: 'Laranja', color: '#fd7e14', action: () => onSetFolderColor('#fd7e14') },
        { label: 'Roxo', color: '#6f42c1', action: () => onSetFolderColor('#6f42c1') },
        { label: 'Padrão', color: '', action: () => onSetFolderColor('') }
      ]
    },
    { type: 'separator' },
    {
      label: 'Renomear',
      icon: 'fas fa-edit',
      action: onRename,
      disabled: false,
      shortcut: 'F2'
    },
    {
      label: 'Excluirr',
      icon: 'fas fa-trash',
      action: onDelete,
      disabled: false,
      shortcut: 'Delete',
      danger: true
    }
  ];

  return (
    <div 
      ref={menuRef}
      className={styles.contextMenu}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y
      }}
    >
      {menuItems.map((item, index) => {
        if (item.type === 'separator') {
          return <div key={index} className={styles.separator} />;
        }
        if (item.submenu) {
          return (
            <div key={index} className={styles.submenuContainer}>
              <div className={`${styles.menuItem} ${styles.hasSubmenu}`}>
                <i className={`${styles.icon} ${item.icon}`}></i>
                <span className={styles.label}>{item.label}</span>
                <i className={`${styles.arrow} fas fa-chevron-right`}></i>
              </div>
              <div className={styles.submenu}>
                {item.submenu.map((subItem, subIndex) => (
                  <button
                    key={subIndex}
                    className={styles.menuItem}
                    onClick={() => {
                      subItem.action && subItem.action();
                      onClose();
                    }}
                  >
                    {subItem.color && (
                      <div 
                        className={styles.colorDot}
                        style={{ backgroundColor: subItem.color || '#6c757d' }}
                      />
                    )}
                    <span className={styles.label}>{subItem.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        }
        return (
          <button
            key={index}
            className={`${styles.menuItem} ${item.danger ? styles.danger : ''}`}
            onClick={() => {
              if (!item.disabled && item.action) {
                item.action();
                onClose();
              }
            }}
            disabled={item.disabled}
          >
            <i className={`${styles.icon} ${item.icon}`}></i>
            <span className={styles.label}>{item.label}</span>
            {item.shortcut && (
              <span className={styles.shortcut}>{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};