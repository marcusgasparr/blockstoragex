import React, { useState } from 'react';
import PopupDefault from '../../../layouts/LayoutDefault/PopupDefault';
import styles from './SettingsPopup.module.scss';

interface SettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentDrive: string;
  onDriveChange: (drive: string) => void;
}

const SettingsPopup: React.FC<SettingsPopupProps> = ({
  isOpen,
  onClose,
  currentDrive,
  onDriveChange
}) => {
  const [selectedDrive, setSelectedDrive] = useState(currentDrive);

  const drives = [
    { value: 'C:\\', label: 'Disco C:\\ (Sistema)' },
    { value: 'D:\\', label: 'Disco D:\\ (Dados)' },
    { value: 'E:\\', label: 'Disco E:\\ (Extra)' },
    { value: 'F:\\', label: 'Disco F:\\ (Extra)' },
    { value: 'G:\\', label: 'Disco G:\\ (Extra)' },
    { value: 'H:\\', label: 'Disco H:\\ (Extra)' }
  ];

  const handleSave = () => {
    onDriveChange(selectedDrive);
    onClose();
  };

  return (
    <PopupDefault
      isOpen={isOpen}
      title="Configurações"
      onClose={onClose}
    >
      <div className={styles.settings}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Disco Padrão</h3>
          <p className={styles.sectionDescription}>
            Selecione qual disco será usado como base para navegação e busca.
          </p>
          
          <div className={styles.driveSelector}>
            {drives.map((drive) => (
              <label key={drive.value} className={styles.driveOption}>
                <input
                  type="radio"
                  name="drive"
                  value={drive.value}
                  checked={selectedDrive === drive.value}
                  onChange={(e) => setSelectedDrive(e.target.value)}
                />
                <span className={styles.driveLabel}>
                  <i className="fas fa-hdd"></i>
                  {drive.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.saveBtn} onClick={handleSave}>
            Salvar
          </button>
        </div>
      </div>
    </PopupDefault>
  );
};

export default SettingsPopup;