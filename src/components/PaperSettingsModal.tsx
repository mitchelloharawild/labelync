import React from 'react';
import type { PrinterConfig, Template } from '../types';
import { getProtocolFamily, M02_FIXED_PAPER_WIDTH_MM } from '../types';
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

  const protocolFamily = getProtocolFamily(config.deviceModel);
  const isM02Family = protocolFamily === 'M02';
  // The M02 family's print head is a fixed 48mm wide, so its paper width
  // isn't user-editable — always use the fixed value regardless of what's
  // stored in localConfig (e.g. left over from switching from another family).
  const effectivePaperWidth = isM02Family ? M02_FIXED_PAPER_WIDTH_MM : localConfig.paperWidth;

  const handleSave = () => {
    onSave({ ...localConfig, paperWidth: effectivePaperWidth });
    onClose();
  };

  const templateAspectRatio = React.useMemo(
    () => (template ? getSvgAspectRatio(template.svgContent) : null),
    [template]
  );

  const aspectRatioWarning = React.useMemo(() => {
    if (!templateAspectRatio || !effectivePaperWidth || !localConfig.paperHeight) return null;

    const isLandscape = localConfig.orientation === 'landscape';
    const displayWidth = isLandscape ? localConfig.paperHeight : effectivePaperWidth;
    const displayHeight = isLandscape ? effectivePaperWidth : localConfig.paperHeight;
    const paperAspectRatio = displayWidth / displayHeight;

    const deviation = Math.abs(paperAspectRatio - templateAspectRatio) / templateAspectRatio;
    if (deviation <= ASPECT_RATIO_TOLERANCE) return null;

    return { paperAspectRatio, templateAspectRatio };
  }, [templateAspectRatio, effectivePaperWidth, localConfig.paperHeight, localConfig.orientation]);

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
      {!isM02Family && (
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
      )}

      {isM02Family && (
        <p className="m02-media-type-note">
          Media type settings aren&apos;t documented for the M02 printer family.
        </p>
      )}

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
                value={effectivePaperWidth}
                onChange={(e) => handleChange('paperWidth', parseInt(e.target.value))}
                min="10"
                max="100"
                disabled={isM02Family}
              />
              {isM02Family && (
                <small className="m02-media-type-note">
                  Fixed at {M02_FIXED_PAPER_WIDTH_MM}mm for this printer family.
                </small>
              )}
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
