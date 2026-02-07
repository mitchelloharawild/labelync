import React from 'react';
import type { PrinterConfig } from '../types';
import Modal from './Modal';
import './PrinterSetupModal.css';

interface PrinterSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PrinterConfig;
  onSave: (config: PrinterConfig) => void;
}

const PrinterSetupModal: React.FC<PrinterSetupModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave
}) => {
  const [localConfig, setLocalConfig] = React.useState<PrinterConfig>(config);

  React.useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleChange = (field: keyof PrinterConfig, value: string | number) => {
    setLocalConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  const footer = (
    <>
      <button className="button button-secondary" onClick={onClose}>
        Cancel
      </button>
      <button className="button button-primary" onClick={handleSave}>
        Save Settings
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Printer Setup" footer={footer}>
      <div className="form-group">
            <label htmlFor="deviceModel">Device Model:</label>
            <select
              id="deviceModel"
              value={localConfig.deviceModel}
              onChange={(e) => handleChange('deviceModel', e.target.value as PrinterConfig['deviceModel'])}
            >
              <option value="M110">Phomemo M110</option>
              <option value="M120">Phomemo M120</option>
              <option value="M220">Phomemo M220</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="darkness">
              Darkness: {localConfig.darkness} (0x{localConfig.darkness.toString(16).padStart(2, '0').toUpperCase()})
            </label>
            <input
              type="range"
              id="darkness"
              min="1"
              max="15"
              value={localConfig.darkness}
              onChange={(e) => handleChange('darkness', parseInt(e.target.value))}
            />
            <div className="range-labels">
              <span>Light (1)</span>
              <span>Dark (15)</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="speed">
              Speed: {localConfig.speed} (0x{localConfig.speed.toString(16).padStart(2, '0').toUpperCase()})
            </label>
            <input
              type="range"
              id="speed"
              min="1"
              max="5"
              value={localConfig.speed}
              onChange={(e) => handleChange('speed', parseInt(e.target.value))}
            />
            <div className="range-labels">
              <span>Slow (1)</span>
              <span>Fast (5)</span>
            </div>
          </div>
    </Modal>
  );
};

export default PrinterSetupModal;
