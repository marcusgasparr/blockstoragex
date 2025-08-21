import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import TopBar from '../TopBar/TopBar';
import SettingsPopup from '../../pages/components/SettingsPopup/SettingsPopup';
import HelpPopup from '../../pages/components/HelpPopup/HelpPopup';
import styles from './LayoutDefault.module.scss';

interface LayoutDefaultProps {
  children: React.ReactNode;
}

const LayoutDefault: React.FC<LayoutDefaultProps> = ({ children }) => {
  const location = useLocation();
  const [searchCallback, setSearchCallback] = useState<((query: string) => void) | undefined>();
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Estado para o disco atual
  const [currentDrive, setCurrentDrive] = useState(() => {
    const saved = localStorage.getItem('selectedDrive');
    console.log('🏁 LayoutDefault iniciando com disco salvo:', saved);
    return saved || 'G:\\';
  });

  // Effect para sincronizar com mudanças do localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedDrive' && e.newValue) {
        console.log('🔄 LayoutDefault detectou mudança no localStorage:', e.newValue);
        setCurrentDrive(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleDriveChange = (newDrive: string) => {
    console.log('🔄 LayoutDefault: Alterando disco de', currentDrive, 'para', newDrive);
    
    // Verificar se realmente houve mudança
    if (currentDrive === newDrive) {
      console.log('⚠️ Disco já é o mesmo, não fazendo nada');
      return;
    }
    
    // Atualizar estado local
    setCurrentDrive(newDrive);
    
    // Salvar no localStorage
    localStorage.setItem('selectedDrive', newDrive);
    console.log('💾 Disco salvo no localStorage:', newDrive);
    
    // Aguardar um pouco antes de recarregar para garantir que foi salvo
    setTimeout(() => {
      console.log('🔄 Recarregando página com novo disco...');
      window.location.reload();
    }, 100);
  };

  console.log('🖥️ LayoutDefault renderizando com currentDrive:', currentDrive);

  return (
    <div className={styles.layout}>
      <TopBar
        onSearch={location.pathname === '/' ? searchCallback : undefined}
        onOpenSettings={() => setShowSettings(true)}
        onOpenHelp={() => setShowHelp(true)}
      />
      <div className={styles.content}>
        <Sidebar currentDrive={currentDrive} />
        <main className={styles.main}>
          {React.cloneElement(children as React.ReactElement, {
            onSearchCallback: setSearchCallback,
            currentDrive: currentDrive
          })}
        </main>
      </div>

      <SettingsPopup
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentDrive={currentDrive}
        onDriveChange={handleDriveChange}
      />

      <HelpPopup
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
};

export default LayoutDefault;