import React, { useState, useEffect } from 'react';
import styles from './ContextMenu.module.scss';
import { FileSystemItem } from '../../services/fileSystemService';

export interface ExtraAction {
  icon: string;
  label: string;
  action: () => void;
  disabled?: boolean;
}

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  selectedItems: FileSystemItem[];
  onClose: () => void;
  onNewFolder?: () => void;
  onRename?: (itemPath: string) => void;
  onDelete?: () => void;
  onCopy?: (item: FileSystemItem) => void;
  onCut?: (item: FileSystemItem) => void;
  onPaste?: () => void;
  onToggleStar?: (itemPath: string) => void;
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
  onPreview,
  onDownload,
  canPaste = false,
  extraActions = []
}) => {
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  const selectedItem = selectedItems[0];
  const isMultipleSelection = selectedItems.length > 1;

  // Effect para reposicionar o menu principal
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

          // Ajustar horizontalmente se sair da tela pela direita
          if (position.x + rect.width > viewportWidth - 20) {
            newX = position.x - rect.width; // Abrir para a esquerda
          }

          // Ajustar verticalmente se sair da tela por baixo
          if (position.y + rect.height > viewportHeight - 20) {
            newY = position.y - rect.height; // Abrir para cima
          }

          // Garantir que não fique fora da tela pela esquerda
          if (newX < 20) {
            newX = 20;
          }

          // Garantir que não fique fora da tela por cima
          if (newY < 20) {
            newY = 20;
          }

          // Se ainda estiver saindo da tela pela direita após ajustar para esquerda
          if (newX + rect.width > viewportWidth - 20) {
            newX = viewportWidth - rect.width - 20;
          }

          // Se ainda estiver saindo da tela por baixo após ajustar para cima
          if (newY + rect.height > viewportHeight - 20) {
            newY = viewportHeight - rect.height - 20;
          }

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
              <span>Baixar</span>
              <kbd>Ctrl+S</kbd>
            </button>
          )}

          {/* Separador */}
          {((selectedItem && !isMultipleSelection && selectedItem.type === 'file') || isMultipleSelection) && 
           (onCopy || onCut || onRename) && <div className={styles.separator}></div>}

          {/* Copiar */}
          {selectedItem && !isMultipleSelection && onCopy && (
            <button
              className={styles.menuItem}
              onClick={() => handleAction(() => onCopy(selectedItem))}
            >
              <i className="fas fa-copy"></i>
              <span>Copiar</span>
              <kbd>Ctrl+C</kbd>
            </button>
          )}

          {/* Recortar */}
          {selectedItem && !isMultipleSelection && onCut && (
            <button
              className={styles.menuItem}
              onClick={() => handleAction(() => onCut(selectedItem))}
            >
              <i className="fas fa-cut"></i>
              <span>Recortar</span>
              <kbd>Ctrl+X</kbd>
            </button>
          )}

          {/* Colar */}
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

          {/* Renomear */}
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

          {/* Separador */}
          {(onToggleStar || onNewFolder) && <div className={styles.separator}></div>}

          {/* Adicionar/Remover estrela */}
          {selectedItem && !isMultipleSelection && onToggleStar && (
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

          {/* Separador */}
          {onDelete && <div className={styles.separator}></div>}

          {/* Ações extras */}
          {extraActions.map((action, index) => (
            <button
              key={index}
              className={`${styles.menuItem} ${action.disabled ? styles.disabled : ''}`}
              onClick={() => !action.disabled && handleAction(action.action)}
              disabled={action.disabled}
            >
              <i className={action.icon}></i>
              <span>{action.label}</span>
            </button>
          ))}

          {/* Excluir */}
          {onDelete && (
            <button
              className={`${styles.menuItem} ${styles.danger}`}
              onClick={() => handleAction(onDelete)}
            >
              <i className="fas fa-trash"></i>
              <span>Excluir</span>
              <kbd>Delete</kbd>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default ContextMenu;