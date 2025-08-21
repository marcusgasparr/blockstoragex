import React, { useState, useEffect } from 'react';
import { FileSystemItem } from '../../services/fileSystemService';
import styles from './ContextMenu.module.scss';

interface ExtraAction {
  label: string;
  icon: string;
  action: () => void;
  variant?: 'default' | 'danger' | 'primary';
}

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  selectedItems: FileSystemItem[];
  onNewFolder?: () => void;
  onRename?: (itemPath: string) => void;
  onDelete?: () => void;
  onCopy?: (item: FileSystemItem) => void;
  onCut?: (item: FileSystemItem) => void;
  onPaste?: () => void;
  onToggleStar?: (itemPath: string) => void;
  onSetColor?: (itemPath: string, color: string) => void;
  onPreview?: (item: FileSystemItem) => void;
  onDownload?: (item: FileSystemItem) => void;
  canPaste?: boolean;
  extraActions?: ExtraAction[];
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  selectedItems,
  onNewFolder,
  onRename,
  onDelete,
  onCopy,
  onCut,
  onPaste,
  onToggleStar,
  onSetColor,
  onPreview,
  onDownload,
  canPaste = false,
  extraActions = []
}) => {
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [showColorSubmenu, setShowColorSubmenu] = useState(false);

  const selectedItem = selectedItems[0];
  const isMultipleSelection = selectedItems.length > 1;

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        const menu = document.querySelector(`.${styles.contextMenu}`) as HTMLElement;
        if (menu) {
          const rect = menu.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          let newX = position.x;
          let newY = position.y;
          
          // Ajustar horizontalmente se sair da tela
          if (position.x + rect.width > viewportWidth) {
            newX = viewportWidth - rect.width - 16;
          }
          
          // Ajustar verticalmente se sair da tela
          if (position.y + rect.height > viewportHeight) {
            newY = viewportHeight - rect.height - 16;
          }
          
          // Garantir que não fique com valores negativos
          newX = Math.max(16, newX);
          newY = Math.max(16, newY);
          
          setAdjustedPosition({ x: newX, y: newY });
        }
      });
    }
  }, [isOpen, position]);

  if (!isOpen) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const colors = [
    { name: 'Vermelho', value: '#ff6b6b', icon: '🔴' },
    { name: 'Laranja', value: '#ffa502', icon: '🟠' },
    { name: 'Amarelo', value: '#fffa65', icon: '🟡' },
    { name: 'Verde', value: '#26de81', icon: '🟢' },
    { name: 'Azul', value: '#45b7d1', icon: '🔵' },
    { name: 'Roxo', value: '#a55eea', icon: '🟣' },
    { name: 'Rosa', value: '#fd79a8', icon: '🩷' },
    { name: 'Cinza', value: '#778ca3', icon: '⚫' }
  ];

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div
        className={styles.contextMenu}
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
        }}
      >
        {/* Header com informações do item */}
        {selectedItem && !isMultipleSelection && (
          <div className={styles.menuHeader}>
            <div className={styles.itemInfo}>
              <i className={`${selectedItem.icon} ${styles.itemIcon}`}></i>
              <div className={styles.itemDetails}>
                <span className={styles.itemName}>{selectedItem.name}</span>
                <span className={styles.itemType}>
                  {selectedItem.type === 'directory' ? 'Pasta' : 'Arquivo'}
                </span>
              </div>
            </div>
            {selectedItem.isStarred && (
              <i className={`fas fa-star ${styles.starBadge}`}></i>
            )}
          </div>
        )}

        {/* Header para seleção múltipla */}
        {isMultipleSelection && (
          <div className={styles.menuHeader}>
            <div className={styles.multiSelection}>
              <i className="fas fa-layer-group"></i>
              <span>{selectedItems.length} itens selecionados</span>
            </div>
          </div>
        )}

        <div className={styles.menuContent}>
          {/* Ações de visualização */}
          {selectedItem && !isMultipleSelection && selectedItem.type === 'file' && onPreview && (
            <button
              className={`${styles.menuItem} ${styles.primary}`}
              onClick={() => handleAction(() => onPreview(selectedItem))}
            >
              <i className="fas fa-eye"></i>
              <span>Visualizar</span>
              <kbd>Enter</kbd>
            </button>
          )}

          {/* Download */}
          {selectedItem && !isMultipleSelection && selectedItem.type === 'file' && onDownload && (
            <button
              className={styles.menuItem}
              onClick={() => handleAction(() => onDownload(selectedItem))}
            >
              <i className="fas fa-download"></i>
              <span>Download</span>
              <kbd>Ctrl+S</kbd>
            </button>
          )}

          {/* Separador */}
          {((selectedItem && onPreview) || (selectedItem && onDownload)) && (
            <div className={styles.separator}></div>
          )}

          {/* Ações de clipboard */}
          {selectedItem && onCopy && (
            <button
              className={styles.menuItem}
              onClick={() => handleAction(() => onCopy(selectedItem))}
            >
              <i className="fas fa-copy"></i>
              <span>Copiar</span>
              <kbd>Ctrl+C</kbd>
            </button>
          )}

          {selectedItem && onCut && (
            <button
              className={styles.menuItem}
              onClick={() => handleAction(() => onCut(selectedItem))}
            >
              <i className="fas fa-cut"></i>
              <span>Recortar</span>
              <kbd>Ctrl+X</kbd>
            </button>
          )}

          {canPaste && onPaste && (
            <button
              className={styles.menuItem}
              onClick={() => handleAction(onPaste)}
            >
              <i className="fas fa-paste"></i>
              <span>Colar</span>
              <kbd>Ctrl+V</kbd>
            </button>
          )}

          {/* Separador */}
          {(onCopy || onCut || onPaste) && <div className={styles.separator}></div>}

          {/* Ações de edição */}
          {selectedItem && !isMultipleSelection && onRename && (
            <button
              className={styles.menuItem}
              onClick={() => handleAction(() => onRename(selectedItem.path))}
            >
              <i className="fas fa-edit"></i>
              <span>Renomear</span>
              <kbd>F2</kbd>
            </button>
          )}

          {/* Favoritar/Desfavoritar */}
          {selectedItem && onToggleStar && (
            <button
              className={styles.menuItem}
              onClick={() => handleAction(() => onToggleStar(selectedItem.path))}
            >
              <i className={selectedItem.isStarred ? "fas fa-star" : "far fa-star"}></i>
              <span>
                {selectedItem.isStarred ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              </span>
              <kbd>Ctrl+D</kbd>
            </button>
          )}

          {/* Cor da pasta */}
          {selectedItem && selectedItem.type === 'directory' && onSetColor && (
            <div 
              className={styles.submenuContainer}
              onMouseEnter={() => setShowColorSubmenu(true)}
              onMouseLeave={() => setShowColorSubmenu(false)}
            >
              <button className={`${styles.menuItem} ${styles.hasSubmenu}`}>
                <i className="fas fa-palette"></i>
                <span>Cor da pasta</span>
                <i className="fas fa-chevron-right"></i>
              </button>
              
              {showColorSubmenu && (
                <div className={styles.submenu}>
                  <div className={styles.submenuHeader}>
                    <span>Escolher cor</span>
                  </div>
                  <div className={styles.colorGrid}>
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        className={styles.colorOption}
                        style={{ backgroundColor: color.value }}
                        onClick={() => handleAction(() => onSetColor!(selectedItem.path, color.value))}
                        title={color.name}
                      >
                        <span className={styles.colorEmoji}>{color.icon}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    className={styles.removeColorBtn}
                    onClick={() => handleAction(() => onSetColor!(selectedItem.path, ''))}
                  >
                    <i className="fas fa-times"></i>
                    <span>Remover cor</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Separador */}
          <div className={styles.separator}></div>

          {/* Ações extras */}
          {extraActions.map((action, index) => (
            <button
              key={index}
              className={`${styles.menuItem} ${styles[action.variant || 'default']}`}
              onClick={() => handleAction(action.action)}
            >
              <i className={action.icon}></i>
              <span>{action.label}</span>
            </button>
          ))}

          {/* Nova pasta */}
          {onNewFolder && (
            <button
              className={styles.menuItem}
              onClick={() => handleAction(onNewFolder)}
            >
              <i className="fas fa-folder-plus"></i>
              <span>Nova pasta</span>
              <kbd>Ctrl+Shift+N</kbd>
            </button>
          )}

          {/* Excluir */}
          {onDelete && (
            <>
              <div className={styles.separator}></div>
              <button
                className={`${styles.menuItem} ${styles.danger}`}
                onClick={() => handleAction(onDelete)}
              >
                <i className="fas fa-trash"></i>
                <span>Excluir</span>
                <kbd>Del</kbd>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};