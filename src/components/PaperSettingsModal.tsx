import React from 'react';
import type { PrinterConfig } from '../types';
import './PaperSettingsModal.css';

interface PaperSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PrinterConfig;
  onSave: (config: Partial<PrinterConfig>) => void;
}

const PaperSettingsModal: React.FC<PaperSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave
}) => {
  const [localConfig, setLocalConfig] = React.useState({
    paperType: config.paperType,
    paperWidth: config.paperWidth,
    paperHeight: config.paperHeight,
    orientation: config.orientation || 'portrait'
  });

  React.useEffect(() => {
    setLocalConfig({
      paperType: config.paperType,
      paperWidth: config.paperWidth,
      paperHeight: config.paperHeight,
      orientation: config.orientation || 'portrait'
    });
  }, [config]);

  if (!isOpen) return null;

  const handleChange = (field: 'paperType' | 'paperWidth' | 'paperHeight', value: number) => {
    setLocalConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOrientationChange = (orientation: 'portrait' | 'landscape') => {
    setLocalConfig(prev => ({
      ...prev,
      orientation
    }));
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  const paperTypeOptions = [
    { value: 0x0a, label: 'Label With Gaps' },
    { value: 0x0b, label: 'Continuous' },
    { value: 0x26, label: 'Label With Marks' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Paper Settings</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="paperType">Paper Type:</label>
            <select
              id="paperType"
              value={localConfig.paperType}
              onChange={(e) => handleChange('paperType', parseInt(e.target.value))}
            >
              {paperTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} (0x{option.value.toString(16).padStart(2, '0').toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Orientation:</label>
            <div className="orientation-buttons">
              <button
                className={`orientation-button ${localConfig.orientation === 'portrait' ? 'active' : ''}`}
                onClick={() => handleOrientationChange('portrait')}
                type="button"
              >
                📄 Portrait
              </button>
              <button
                className={`orientation-button ${localConfig.orientation === 'landscape' ? 'active' : ''}`}
                onClick={() => handleOrientationChange('landscape')}
                type="button"
              >
                📃 Landscape
              </button>
            </div>
            <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
              {localConfig.orientation === 'landscape' && 
                'Canvas will be rotated 90° clockwise during printing'}
            </small>
          </div>

          <div className="form-group-inline">
            <div className="form-group">
              <label htmlFor="paperWidth">Paper Width (mm):</label>
              <input
                type="number"
                id="paperWidth"
                value={localConfig.paperWidth}
                onChange={(e) => handleChange('paperWidth', parseInt(e.target.value))}
                min="10"
                max="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="paperHeight">Paper Height (mm):</label>
              <input
                type="number"
                id="paperHeight"
                value={localConfig.paperHeight}
                onChange={(e) => handleChange('paperHeight', parseInt(e.target.value))}
                min="10"
                max="200"
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="button button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button button-primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaperSettingsModal;
