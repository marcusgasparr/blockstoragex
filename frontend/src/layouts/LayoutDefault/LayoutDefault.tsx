import React from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import TopBar from './components/TopBar/TopBar';
import styles from './LayoutDefault.module.scss';

interface LayoutDefaultProps {
  children: React.ReactNode;
}

const LayoutDefault: React.FC<LayoutDefaultProps> = ({ children }) => {
  return (
    <div className={styles.layout}>
      <TopBar />
      <div className={styles.content}>
        <Sidebar />
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default LayoutDefault;