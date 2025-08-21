import React, { useEffect, useRef, useState } from 'react';
import styles from './ContextMenu.module.scss';
import { FileSystemItem } from '../../services/fileSystemService';

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
  // Props específicas para página de favoritos
  isStarredPage?: boolean;
  onGoToFile?: () => void;
}

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
  onSelectMode,
  isStarredPage = false,
  onGoToFile
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current;
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollTop: window.pageYOffset || document.documentElement.scrollTop,
        scrollLeft: window.pageXOffset || document.documentElement.scrollLeft
      };

      // Forçar recálculo do tamanho do menu
      menu.style.visibility = 'hidden';
      menu.style.display = 'block';
      const menuRect = menu.getBoundingClientRect();
      menu.style.visibility = 'visible';

      const margin = 16; // Margem mínima das bordas
      let newX = position.x;
      let newY = position.y;

      // Ajustar posição X (horizontal)
      if (newX + menuRect.width + margin > viewport.width) {
        // Se não cabe à direita, posiciona à esquerda do cursor
        newX = position.x - menuRect.width;

        // Se ainda não cabe à esquerda, força dentro da tela
        if (newX < margin) {
          newX = viewport.width - menuRect.width - margin;
        }
      }

      // Garantir margem mínima à esquerda
      if (newX < margin) {
        newX = margin;
      }

      // Ajustar posição Y (vertical)
      const availableHeight = viewport.height - margin * 2;

      if (newY + menuRect.height + margin > viewport.height) {
        // Se não cabe abaixo, posiciona acima do cursor
        newY = position.y - menuRect.height;

        // Se ainda não cabe acima, força dentro da tela
        if (newY < margin + viewport.scrollTop) {
          newY = viewport.height - menuRect.height - margin;
        }
      }

      // Garantir margem mínima no topo
      if (newY < margin + viewport.scrollTop) {
        newY = margin + viewport.scrollTop;
      }

      // Se o menu for muito alto para a viewport, limitar altura
      if (menuRect.height > availableHeight) {
        newY = margin + viewport.scrollTop;
        menu.style.maxHeight = `${availableHeight}px`;
        menu.style.overflowY = 'auto';
      } else {
        menu.style.maxHeight = '';
        menu.style.overflowY = '';
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

  // Menu específico para página de favoritos
  if (isStarredPage) {
    const starredMenuItems: MenuItem[] = [
      {
        label: 'Ir até o arquivo',
        icon: 'fas fa-external-link-alt',
        action: onGoToFile,
        disabled: !hasSelection
      },
      {
        label: 'Selecionar',
        icon: 'fas fa-check-square',
        action: onSelectMode,
        disabled: false
      },
      { type: 'separator' },
      {
        label: 'Copiar',
        icon: 'fas fa-copy',
        action: onCopy,
        disabled: !hasSelection,
        shortcut: 'Ctrl+C'
      },
      {
        label: 'Recortar',
        icon: 'fas fa-cut',
        action: onCut,
        disabled: !hasSelection,
        shortcut: 'Ctrl+X'
      },
      {
        label: 'Colar',
        icon: 'fas fa-paste',
        action: onPaste,
        disabled: !canPaste,
        shortcut: 'Ctrl+V'
      },
      { type: 'separator' },
      {
        label: 'Download',
        icon: 'fas fa-download',
        action: onDownload,
        disabled: !hasSelection
      },
      {
        label: 'Remover dos Favoritos',
        icon: 'fas fa-star',
        action: onToggleStar,
        disabled: !hasSelection
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
        {starredMenuItems.map((item, index) => {
          if ('type' in item && item.type === 'separator') {
            return <div key={index} className={styles.separator} />;
          }

          return (
            <button
              key={index}
              className={`${styles.menuItem} ${'disabled' in item && item.disabled ? styles.disabled : ''}`}
              onClick={'action' in item ? item.action : undefined}
              disabled={'disabled' in item ? item.disabled : false}
            >
              <i className={`${styles.icon} ${'icon' in item ? item.icon : ''}`}></i>
              <span className={styles.label}>{'label' in item ? item.label : ''}</span>
              {'shortcut' in item && item.shortcut && (
                <span className={styles.shortcut}>{item.shortcut}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Menu padrão para outras páginas
  // Menu padrão para outras páginas
  const menuItems: MenuItem[] = [
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
      disabled: !hasSelection,
      shortcut: 'Ctrl+C'
    },
    {
      label: 'Recortar',
      icon: 'fas fa-cut',
      action: onCut,
      disabled: !hasSelection,
      shortcut: 'Ctrl+X'
    },
    {
      label: 'Colar',
      icon: 'fas fa-paste',
      action: onPaste,
      disabled: !canPaste,
      shortcut: 'Ctrl+V'
    },
    { type: 'separator' },
    {
      label: 'Download',
      icon: 'fas fa-download',
      action: onDownload,
      disabled: !hasSelection
    },
    {
      label: isStarred ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos',
      icon: isStarred ? 'fas fa-star' : 'far fa-star',
      action: onToggleStar,
      disabled: !isSingleSelection
    },
    {
      label: 'Cor da Pasta',
      icon: 'fas fa-palette',
      action: () => { },
      disabled: !isSingleSelection || !isDirectory,
      submenu: [
        { label: 'Azul', color: '#007acc', action: () => onSetFolderColor('#007acc') },
        { label: 'Verde', color: '#28a745', action: () => onSetFolderColor('#28a745') },
        { label: 'Vermelho', color: '#dc3545', action: () => onSetFolderColor('#dc3545') },
        { label: 'Laranja', color: '#fd7e14', action: () => onSetFolderColor('#fd7e14') },
        { label: 'Roxo', color: '#6f42c1', action: () => onSetFolderColor('#6f42c1') },
        { label: 'Padrão', color: '#6c757d', action: () => onSetFolderColor('default') }
      ]
    },
    { type: 'separator' },
    {
      label: 'Renomear',
      icon: 'fas fa-edit',
      action: onRename,
      disabled: !isSingleSelection,
      shortcut: 'F2'
    },
    {
      label: 'Excluir',
      icon: 'fas fa-trash',
      action: onDelete,
      disabled: !hasSelection,
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
        if ('type' in item && item.type === 'separator') {
          return <div key={index} className={styles.separator} />;
        }
        if ('submenu' in item && item.submenu) {
          return (
            <div key={index} className={styles.submenuContainer}>
              <div className={`${styles.menuItem} ${styles.hasSubmenu} ${'disabled' in item && item.disabled ? styles.disabled : ''}`}>
                <i className={`${styles.icon} ${'icon' in item ? item.icon : ''}`}></i>
                <span className={styles.label}>{'label' in item ? item.label : ''}</span>
                <i className={`${styles.arrow} fas fa-chevron-right`}></i>
              </div>
              {!('disabled' in item && item.disabled) && (
                <div className={styles.submenu}>
                  {'submenu' in item && item.submenu?.map((subItem, subIndex) => (
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
              )}
            </div>
          );
        }
        return (
          <button
            key={index}
            className={`${styles.menuItem} ${'danger' in item && item.danger ? styles.danger : ''}`}
            onClick={() => {
              if (!('disabled' in item && item.disabled) && 'action' in item && item.action) {
                item.action();
              }
              onClose();
            }}
            disabled={'disabled' in item ? item.disabled : false}
          >
            <i className={`${styles.icon} ${'icon' in item ? item.icon : ''}`}></i>
            <span className={styles.label}>{'label' in item ? item.label : ''}</span>
            {'shortcut' in item && item.shortcut && (
              <span className={styles.shortcut}>{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};