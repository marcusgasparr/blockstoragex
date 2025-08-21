import React from 'react';
import styles from './TopBar.module.scss';

const TopBar: React.FC = () => {
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
          <div className={styles.searchBox}>
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Pesquisar no BlockStorageX"
              className={styles.searchInput}
            />
          </div>
        </div>
      </div>
      
      <div className={styles.rightSection}>
        <button className={styles.iconBtn} title="Ajuda">
          <i className="fas fa-question-circle"></i>
        </button>
        <button className={styles.iconBtn} title="Configurações">
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