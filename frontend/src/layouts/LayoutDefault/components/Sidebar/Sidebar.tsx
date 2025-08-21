import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.scss';
import { useSpecificDisk } from '../../../../hooks/useSpecificDisk';


const Sidebar: React.FC = () => {
  // Hook para obter informações do disco
  const { diskInfo, loading } = useSpecificDisk('C:\\');

  // Calcular porcentagem de uso
  const usagePercentage = diskInfo ? diskInfo.capacity : 0;
  
  const location = useLocation(); // Saber em qual página está

  const navigationItems = [
    { icon: 'fas fa-folder', label: 'Meu Drive', path: '/' },
    { icon: 'fas fa-clock', label: 'Recentes', path: '/recentes' },
    { icon: 'fas fa-star', label: 'Com estrela', path: '/favoritos' },
    // { icon: 'fas fa-trash', label: 'Lixeira', path: '/lixeira' },
  ];


  return (
    <aside className={styles.sidebar}>
      <div className={styles.newButton}>
        <button className={styles.newBtn}>
          <i className="fas fa-plus"></i>
          Novo
        </button>
      </div>

      <nav className={styles.navigation}>
        {navigationItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}  // ⭐ URL individual
            className={`${styles.navItem} ${
              location.pathname === item.path ? styles.active : ''
            }`}
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
          {/* <small>{usagePercentage}% usado</small> */}
        </div>
        <span className={styles.descriptionBtn}>Desenvolvido por Marcus Gaspar®</span>
        {/* <button className={styles.upgradeBtn}>
          Comprar mais armazenamento
        </button> */}
      </div>
    </aside>
  );
};

export default Sidebar;