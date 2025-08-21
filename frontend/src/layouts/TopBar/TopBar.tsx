import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './TopBar.module.scss';

interface TopBarProps {
  onSearch?: (query: string) => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onSearch, onOpenSettings, onOpenHelp }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Para busca global, sempre navegar para MyDrive com busca global
      navigate(`/?globalSearch=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      searchInputRef.current?.blur();
    } else if (e.key === 'a' && e.ctrlKey) {
      // Ctrl+A quando focado na busca - selecionar todo o texto
      e.stopPropagation();
      searchInputRef.current?.select();
    }
  };

  // Prevenir propagação de eventos de teclado quando focado na busca
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
  };

  // Adicionar listener global para prevenir shortcuts quando focado na busca
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isSearchFocused && (e.ctrlKey || e.key === 'Delete' || e.key === 'F2')) {
        e.stopPropagation();
      }
    };

    if (isSearchFocused) {
      document.addEventListener('keydown', handleGlobalKeyDown, true);
    }

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [isSearchFocused]);

  return (
    <header className={styles.topbar}>
      <div className={styles.leftSection}>
        <div className={styles.logo}>
          <i className="fas fa-cube"></i>
          <span className={styles.logoText}>BlockStorageX</span>
        </div>
      </div>
      
      <div className={styles.centerSection}>
        <div className={styles.searchContainer}>
          <form onSubmit={handleSearch} className={styles.searchBox}>
            <i className="fas fa-search"></i>
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Buscar em todo o disco..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
            {searchQuery && (
              <button 
                type="button" 
                className={styles.clearBtn}
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </form>
        </div>
      </div>
      
      <div className={styles.rightSection}>
        <button 
          className={styles.iconBtn} 
          title="Ajuda"
          onClick={onOpenHelp}
        >
          <i className="fas fa-question-circle"></i>
        </button>
        <button 
          className={styles.iconBtn} 
          title="Configurações"
          onClick={onOpenSettings}
        >
          <i className="fas fa-cog"></i>
        </button>
        <div className={styles.userProfile}>
          <img 
            src="https://static.vecteezy.com/system/resources/thumbnails/036/885/313/small_2x/blue-profile-icon-free-png.png" 
            alt="Perfil do usuário" 
            className={styles.profileImage}
          />
        </div>
      </div>
    </header>
  );
};

export default TopBar;