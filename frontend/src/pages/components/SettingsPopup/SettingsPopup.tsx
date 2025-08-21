import React, { useState, useEffect } from 'react';
import PopupDefault from '../../../layouts/PopupDefault/PopupDefault';
import { diskService } from '../../../services/diskService';
import styles from './SettingsPopup.module.scss';

interface SettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentDrive: string;
  onDriveChange: (drive: string) => void;
}

interface AvailableDrive {
  mountpoint: string;
  filesystem: string;
  size: number;
  type: string;
  label: string;
}

const SettingsPopup: React.FC<SettingsPopupProps> = ({
  isOpen,
  onClose,
  currentDrive,
  onDriveChange
}) => {
  const [selectedDrive, setSelectedDrive] = useState(currentDrive);
  const [availableDisks, setAvailableDisks] = useState<AvailableDrive[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debug para verificar se o popup está recebendo o valor correto
  console.log('⚙️ SettingsPopup - Drive atual:', currentDrive);
  console.log('⚙️ SettingsPopup - Drive selecionado:', selectedDrive);

  // Atualizar selectedDrive quando currentDrive mudar
  useEffect(() => {
    setSelectedDrive(currentDrive);
  }, [currentDrive]);

  // Buscar discos disponíveis quando o popup abrir
  useEffect(() => {
    if (isOpen) {
      fetchAvailableDisks();
    }
  }, [isOpen]);

  const fetchAvailableDisks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Buscando discos disponíveis...');
      const systemInfo = await diskService.getDiskInfo();
      
      // Converter para formato esperado e filtrar apenas discos válidos
      const disks: AvailableDrive[] = systemInfo.disks
        .filter(disk => {
          // Filtrar apenas discos que são drives de letra (Windows)
          const isWindowsDrive = /^[A-Z]:\\?$/i.test(disk.mountpoint);
          const hasValidSize = disk.size > 0;
          return isWindowsDrive && hasValidSize;
        })
        .map(disk => ({
          mountpoint: disk.mountpoint.endsWith('\\') ? disk.mountpoint : disk.mountpoint + '\\',
          filesystem: disk.filesystem,
          size: disk.size,
          type: disk.type,
          label: `Disco ${disk.mountpoint} (${disk.filesystem || disk.type}) - ${formatBytes(disk.size)}`
        }))
        .sort((a, b) => a.mountpoint.localeCompare(b.mountpoint));

      console.log('💿 Discos encontrados:', disks);
      setAvailableDisks(disks);
      
    } catch (err) {
      console.error('❌ Erro ao buscar discos:', err);
      setError('Erro ao carregar discos disponíveis');
      
      // Fallback para discos comuns se a API falhar
      const fallbackDisks: AvailableDrive[] = [
        { mountpoint: 'C:\\', filesystem: 'NTFS', size: 0, type: 'Local Disk', label: 'Disco C:\\ (Sistema)' },
        { mountpoint: 'D:\\', filesystem: 'NTFS', size: 0, type: 'Local Disk', label: 'Disco D:\\ (Dados)' },
        { mountpoint: 'E:\\', filesystem: 'NTFS', size: 0, type: 'Local Disk', label: 'Disco E:\\ (Extra)' },
        { mountpoint: 'G:\\', filesystem: 'NTFS', size: 0, type: 'Local Disk', label: 'Disco G:\\ (Extra)' },
        { mountpoint: 'H:\\', filesystem: 'NTFS', size: 0, type: 'Local Disk', label: 'Disco H:\\ (Extra)' }
      ];
      setAvailableDisks(fallbackDisks);
      
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 GB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSave = () => {
    console.log('💾 Salvando novo disco:', selectedDrive);
    console.log('📤 Chamando onDriveChange com:', selectedDrive);
    onDriveChange(selectedDrive);
    onClose();
  };

  const handleCancel = () => {
    // Reverter para o valor original
    setSelectedDrive(currentDrive);
    onClose();
  };

  return (
    <PopupDefault
      isOpen={isOpen}
      title="Configurações"
      onClose={handleCancel}
    >
      <div className={styles.settings}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Disco Padrão</h3>
          <p className={styles.sectionDescription}>
            Selecione qual disco será usado como base para navegação e busca.
          </p>
          
          {loading ? (
            <div className={styles.loading}>
              <i className="fas fa-spinner fa-spin"></i>
              <span>Carregando discos disponíveis...</span>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <i className="fas fa-exclamation-triangle"></i>
              <span>{error}</span>
            </div>
          ) : (
            <div className={styles.driveSelector}>
              {availableDisks.length > 0 ? (
                availableDisks.map((drive) => (
                  <label key={drive.mountpoint} className={styles.driveOption}>
                    <input
                      type="radio"
                      name="drive"
                      value={drive.mountpoint}
                      checked={selectedDrive === drive.mountpoint}
                      onChange={(e) => {
                        console.log('🔄 Selecionando disco:', e.target.value);
                        setSelectedDrive(e.target.value);
                      }}
                    />
                    <span className={styles.driveLabel}>
                      <i className="fas fa-hdd"></i>
                      {drive.label}
                    </span>
                  </label>
                ))
              ) : (
                <div className={styles.noDrives}>
                  <i className="fas fa-info-circle"></i>
                  <span>Nenhum disco encontrado</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={handleCancel}>
            Cancelar
          </button>
          <button 
            className={styles.saveBtn} 
            onClick={handleSave}
            disabled={loading || !selectedDrive}
          >
            Salvar
          </button>
        </div>
      </div>
    </PopupDefault>
  );
};

export default SettingsPopup;