import React from 'react';
import type { PrinterConfig, Template } from '../types';
import Modal from './Modal';
import { getSvgAspectRatio } from '../utils/svgAspectRatio';
import './PaperSettingsModal.css';

interface PaperSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PrinterConfig;
  onSave: (config: Partial<PrinterConfig>) => void;
  template?: Template;
}

// How far the paper's aspect ratio may deviate from the template's before we warn.
const ASPECT_RATIO_TOLERANCE = 0.03;

const PaperSettingsModal: React.FC<PaperSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  template
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

  const templateAspectRatio = React.useMemo(
    () => (template ? getSvgAspectRatio(template.svgContent) : null),
    [template]
  );

  const aspectRatioWarning = React.useMemo(() => {
    if (!templateAspectRatio || !localConfig.paperWidth || !localConfig.paperHeight) return null;

    const isLandscape = localConfig.orientation === 'landscape';
    const displayWidth = isLandscape ? localConfig.paperHeight : localConfig.paperWidth;
    const displayHeight = isLandscape ? localConfig.paperWidth : localConfig.paperHeight;
    const paperAspectRatio = displayWidth / displayHeight;

    const deviation = Math.abs(paperAspectRatio - templateAspectRatio) / templateAspectRatio;
    if (deviation <= ASPECT_RATIO_TOLERANCE) return null;

    return { paperAspectRatio, templateAspectRatio };
  }, [templateAspectRatio, localConfig.paperWidth, localConfig.paperHeight, localConfig.orientation]);

  const paperTypeOptions = [
    { value: 0x0a, label: 'Label With Gaps' },
    { value: 0x0b, label: 'Continuous' },
    { value: 0x26, label: 'Label With Marks' }
  ];

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
    <Modal isOpen={isOpen} onClose={onClose} title="Paper Settings" footer={footer}>
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

      {aspectRatioWarning && (
        <div className="aspect-ratio-warning">
          Paper size ({aspectRatioWarning.paperAspectRatio.toFixed(2)}:1) doesn't match the
          current template's shape ({aspectRatioWarning.templateAspectRatio.toFixed(2)}:1).
          The preview and print will be letterboxed to avoid stretching &mdash; adjust the
          paper dimensions above to match the template.
        </div>
      )}
    </Modal>
  );
};

export default PaperSettingsModal;
