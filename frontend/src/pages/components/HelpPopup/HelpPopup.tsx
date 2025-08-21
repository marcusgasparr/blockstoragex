import React from 'react';
import PopupDefault from '../../../layouts/LayoutDefault/PopupDefault';
import styles from './HelpPopup.module.scss';

interface HelpPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpPopup: React.FC<HelpPopupProps> = ({ isOpen, onClose }) => {
  return (
    <PopupDefault
      isOpen={isOpen}
      title="Sobre o BlockStorageX"
      onClose={onClose}
    >
      <div className={styles.help}>
        <div className={styles.logo}>
          <i className="fas fa-cube"></i>
          <h2>BlockStorageX</h2>
        </div>

        <div className={styles.description}>
          <p>
            BlockStorageX é um sistema avançado de gerenciamento de arquivos que permite
            navegar, organizar e buscar arquivos em seu sistema de forma intuitiva e eficiente.
          </p>
        </div>

        <div className={styles.features}>
          <h3>Principais Funcionalidades:</h3>
          <ul>
            <li>
              <i className="fas fa-search"></i>
              <div>
                <strong>Busca Global</strong>
                <span>Encontre arquivos em todo o disco rapidamente</span>
              </div>
            </li>
            <li>
              <i className="fas fa-filter"></i>
              <div>
                <strong>Filtros Avançados</strong>
                <span>Filtre por tipo de arquivo (imagens, documentos, vídeos, etc.)</span>
              </div>
            </li>
            <li>
              <i className="fas fa-star"></i>
              <div>
                <strong>Favoritos</strong>
                <span>Marque arquivos importantes para acesso rápido</span>
              </div>
            </li>
            <li>
              <i className="fas fa-eye"></i>
              <div>
                <strong>Preview de Arquivos</strong>
                <span>Visualize documentos, imagens e vídeos sem abrir aplicativos externos</span>
              </div>
            </li>
            <li>
              <i className="fas fa-copy"></i>
              <div>
                <strong>Operações de Arquivo</strong>
                <span>Copie, mova, renomeie e organize seus arquivos</span>
              </div>
            </li>
            <li>
              <i className="fas fa-palette"></i>
              <div>
                <strong>Organização Visual</strong>
                <span>Defina cores para pastas e organize visualmente</span>
              </div>
            </li>
          </ul>
        </div>

        <div className={styles.shortcuts}>
          <h3>Atalhos de Teclado:</h3>
          <div className={styles.shortcutList}>
            <div className={styles.shortcut}>
              <kbd>Ctrl + A</kbd>
              <span>Selecionar todos os arquivos</span>
            </div>
            <div className={styles.shortcut}>
              <kbd>Ctrl + C</kbd>
              <span>Copiar selecionados</span>
            </div>
            <div className={styles.shortcut}>
              <kbd>Ctrl + X</kbd>
              <span>Recortar selecionados</span>
            </div>
            <div className={styles.shortcut}>
              <kbd>Ctrl + V</kbd>
              <span>Colar</span>
            </div>
            <div className={styles.shortcut}>
              <kbd>F2</kbd>
              <span>Renomear arquivo</span>
            </div>
            <div className={styles.shortcut}>
              <kbd>Delete</kbd>
              <span>Excluir selecionados</span>
            </div>
            <div className={styles.shortcut}>
              <kbd>Esc</kbd>
              <span>Limpar busca/seleção</span>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <p>Desenvolvido por Marcus Gaspar®</p>
        </div>
      </div>
    </PopupDefault>
  );
};

export default HelpPopup;