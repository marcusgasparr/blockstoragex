import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.scss';
import { useSpecificDisk } from '../../hooks/useSpecificDisk';
import PopupInputNewFolder from '../PopupInputNewFolder/PopupInputNewFolder';

interface SidebarProps {
  currentDrive?: string;
}
const Sidebar: React.FC<SidebarProps> = ({ currentDrive }) => {

  // Hook para obter informações do disco selecionado
  const selectedDrive = currentDrive || localStorage.getItem('selectedDrive') || 'G:\\';
  console.log('📊 Sidebar usando disco:', selectedDrive);
  console.log('📊 Sidebar recebeu currentDrive prop:', currentDrive);

  const { diskInfo, loading } = useSpecificDisk(selectedDrive);

  // Estado para o dropdown e popup
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewFolderPopup, setShowNewFolderPopup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Calcular porcentagem de uso
  const usagePercentage = diskInfo ? diskInfo.capacity : 0;

  const location = useLocation(); // Saber em qual página está

  const navigationItems = [
    { icon: 'fas fa-folder', label: 'Meu Drive', path: '/' },
    { icon: 'fas fa-clock', label: 'Recentes', path: '/recentes' },
    { icon: 'fas fa-star', label: 'Com estrela', path: '/favoritos' },
    // { icon: 'fas fa-trash', label: 'Lixeira', path: '/lixeira' },
  ];

  // Função para determinar o caminho de upload
  const getUploadPath = () => {
    // Se estiver na página MyDrive (raiz), usar o caminho atual
    if (location.pathname === '/') {
      return localStorage.getItem('currentPath') || selectedDrive;
    }
    // Se estiver em outras páginas, fazer upload na raiz do disco
    return selectedDrive;
  };

  // Handlers para as ações do dropdown
  const handleNewFolder = () => {
    setShowDropdown(false);
    setShowNewFolderPopup(true);
  };

  const handleCreateFolder = async (name: string) => {
    try {
      const uploadPath = getUploadPath();
      const response = await fetch('http://localhost:3001/api/files/create-directory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: uploadPath,
          name: name
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Recarregar a página atual se estiver no MyDrive
        if (location.pathname === '/') {
          window.location.reload();
        }
      } else {
        alert('Erro ao criar pasta: ' + data.message);
      }
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
      alert('Erro ao criar pasta');
    }
  };

  const handleFileUpload = () => {
    setShowDropdown(false);
    fileInputRef.current?.click();
  };

  const handleFolderUpload = () => {
    setShowDropdown(false);
    folderInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const uploadPath = getUploadPath();

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', uploadPath);

      try {
        const response = await fetch('http://localhost:3001/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!data.success) {
          alert(`Erro ao fazer upload de ${file.name}: ${data.message}`);
        }
      } catch (error) {
        console.error('Erro no upload:', error);
        alert(`Erro ao fazer upload de ${file.name}`);
      }
    }

    // Recarregar a página atual se estiver no MyDrive
    if (location.pathname === '/') {
      setTimeout(() => window.location.reload(), 500);
    }

    // Limpar o input
    event.target.value = '';
  };

  const handleFolderChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const uploadPath = getUploadPath();

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', uploadPath);
      formData.append('relativePath', file.webkitRelativePath);

      try {
        const response = await fetch('http://localhost:3001/api/files/upload-folder', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!data.success) {
          alert(`Erro ao fazer upload de pasta: ${data.message}`);
          break;
        }
      } catch (error) {
        console.error('Erro no upload da pasta:', error);
        alert('Erro ao fazer upload da pasta');
        break;
      }
    }

    // Recarregar a página atual se estiver no MyDrive
    if (location.pathname === '/') {
      setTimeout(() => window.location.reload(), 1000);
    }

    // Limpar o input
    event.target.value = '';
  };

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(`.${styles.newButton}`)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.newButton}>
        <button
          className={styles.newBtn}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <i className="fas fa-plus"></i>
          Novo
          <i className={`fas fa-chevron-${showDropdown ? 'up' : 'down'} ${styles.chevron}`}></i>
        </button>

        {showDropdown && (
          <div className={styles.dropdown}>
            <button onClick={handleNewFolder} className={styles.dropdownItem}>
              <i className="fas fa-folder-plus"></i>
              <span>Nova pasta</span>
            </button>
            <button onClick={handleFileUpload} className={styles.dropdownItem}>
              <i className="fas fa-file-upload"></i>
              <span>Upload de arquivo</span>
            </button>
            <button onClick={handleFolderUpload} className={styles.dropdownItem}>
              <i className="fas fa-folder-upload"></i>
              <span>Upload de pasta</span>
            </button>
          </div>
        )}

        {/* Inputs escondidos para upload */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <input
          ref={folderInputRef}
          type="file"
          {...({ webkitdirectory: "" } as any)}
          style={{ display: 'none' }}
          onChange={handleFolderChange}
        />
      </div>

      <nav className={styles.navigation}>
        {navigationItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ''}`}
          >
            <i className={`${styles.icon} ${item.icon}`}></i>
            <span className={styles.label}>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.storage}>
        <div className={styles.storageInfo}>
          <p className={styles.storageText}>
            {loading ? 'Carregando...' :
              diskInfo ? `${diskInfo.usedFormatted} de ${diskInfo.sizeFormatted} usados` :
                'Erro ao carregar dados'}
          </p>
          <div className={styles.storageBar}>
            <div
              className={styles.storageProgress}
              style={{
                width: `${usagePercentage}%`,
                backgroundColor: usagePercentage > 90 ? '#ff4757' :
                  usagePercentage > 70 ? '#ffa502' : '#2ed573'
              }}
            ></div>
          </div>
        </div>
        <span className={styles.descriptionBtn}>Desenvolvido por Marcus Gaspar®</span>
      </div>

      {/* Popup para nova pasta */}
      <PopupInputNewFolder
        isOpen={showNewFolderPopup}
        title="Nova pasta"
        placeholder="Digite o nome da pasta"
        confirmText="Criar"
        onClose={() => setShowNewFolderPopup(false)}
        onConfirm={handleCreateFolder}
      />
    </aside>
  );
};

export default Sidebar;