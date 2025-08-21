import React from 'react';
import { useDiskInfo } from '../../hooks/useDiskInfo';
import styles from './DiskInfo.module.scss';

interface DiskInfoProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const DiskInfo: React.FC<DiskInfoProps> = ({ 
  autoRefresh = false, 
  refreshInterval = 30000 
}) => {
  const { diskInfo, loading, error, refetch } = useDiskInfo(autoRefresh, refreshInterval);

  if (loading && !diskInfo) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando informações do disco...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Erro ao carregar informações</h3>
          <p>{error}</p>
          <button onClick={refetch} className={styles.retryButton}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!diskInfo) {
    return (
      <div className={styles.container}>
        <div className={styles.noData}>Nenhuma informação disponível</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Informações do Disco</h2>
        <button 
          onClick={refetch} 
          className={styles.refreshButton}
          disabled={loading}
        >
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {/* Resumo geral */}
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <h3>Espaço Total</h3>
          <p className={styles.value}>{diskInfo.totalSizeFormatted}</p>
        </div>
        <div className={styles.summaryCard}>
          <h3>Espaço Usado</h3>
          <p className={styles.value}>{diskInfo.totalUsedFormatted}</p>
        </div>
        <div className={styles.summaryCard}>
          <h3>Espaço Livre</h3>
          <p className={styles.value}>{diskInfo.totalAvailableFormatted}</p>
        </div>
      </div>

      {/* Lista de discos */}
      <div className={styles.disksList}>
        <h3>Discos Individuais</h3>
        {diskInfo.disks.map((disk, index) => (
          <div key={index} className={styles.diskCard}>
            <div className={styles.diskHeader}>
              <h4>{disk.filesystem}</h4>
              <span className={styles.diskType}>{disk.type}</span>
            </div>
            
            <div className={styles.diskDetails}>
              <p><strong>Ponto de montagem:</strong> {disk.mountpoint}</p>
              <p><strong>Tamanho:</strong> {disk.sizeFormatted}</p>
              <p><strong>Usado:</strong> {disk.usedFormatted}</p>
              <p><strong>Disponível:</strong> {disk.availableFormatted}</p>
            </div>

            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ 
                  width: `${disk.capacity}%`,
                  backgroundColor: disk.capacity > 90 ? '#ff4757' : disk.capacity > 70 ? '#ffa502' : '#2ed573'
                }}
              />
              <span className={styles.progressText}>{disk.capacity}% usado</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
