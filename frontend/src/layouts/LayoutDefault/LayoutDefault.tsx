import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import TopBar from './components/TopBar/TopBar';
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
  const [currentDrive, setCurrentDrive] = useState('H:\\');

  const handleDriveChange = (newDrive: string) => {
    setCurrentDrive(newDrive);
    // Recarregar a página com o novo disco
    window.location.reload();
  };

  return (
    <div className={styles.layout}>
      <TopBar
        onSearch={location.pathname === '/' ? searchCallback : undefined}
        onOpenSettings={() => setShowSettings(true)}
        onOpenHelp={() => setShowHelp(true)}
      />
      <div className={styles.content}>
        <Sidebar />
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