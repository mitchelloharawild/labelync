import React from 'react';
import type { PaperPreset, PrinterConfig, Template } from '../types';
import { getProtocolFamily, M02_FIXED_PAPER_WIDTH_MM } from '../types';
import Modal from './Modal';
import { getSvgAspectRatio } from '../utils/svgAspectRatio';
import {
  loadPaperPresets,
  savePaperPreset,
  deletePaperPreset,
  updatePaperPresetUsage,
  isSamePaperSize
} from '../utils/paperStorage';
import './PaperSettingsModal.css';

interface PaperSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PrinterConfig;
  onSave: (config: Partial<PrinterConfig>) => void;
  template?: Template;
}

type Orientation = PrinterConfig['orientation'];

// How far the paper's aspect ratio may deviate from the template's before we warn.
const ASPECT_RATIO_TOLERANCE = 0.03;

// Largest dimension (px) of the paper shape drawn on each preset card.
const PREVIEW_SIZE = 72;

const paperTypeOptions = [
  { value: 0x0a, label: 'Label With Gaps' },
  { value: 0x0b, label: 'Continuous' },
  { value: 0x26, label: 'Label With Marks' }
];

const getPaperTypeLabel = (paperType: number) =>
  paperTypeOptions.find(option => option.value === paperType)?.label ?? 'Unknown';

// Width/height of the paper as it appears on screen, accounting for orientation.
const getDisplaySize = (width: number, height: number, orientation: Orientation) =>
  orientation === 'landscape'
    ? { displayWidth: height, displayHeight: width }
    : { displayWidth: width, displayHeight: height };

const PaperSettingsModal: React.FC<PaperSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  template
}) => {
  const protocolFamily = getProtocolFamily(config.deviceModel);
  const isM02Family = protocolFamily === 'M02';
  const orientation: Orientation = config.orientation || 'portrait';

  const [view, setView] = React.useState<'list' | 'create'>('list');
  const [presets, setPresets] = React.useState<PaperPreset[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState({
    paperType: config.paperType,
    paperWidth: config.paperWidth,
    paperHeight: config.paperHeight
  });

  // The M02 family's print head is a fixed 48mm wide, so its paper width
  // isn't user-editable — always use the fixed value regardless of what's
  // stored (e.g. left over from switching from another family).
  const currentSize = {
    family: protocolFamily,
    paperType: config.paperType,
    paperWidth: isM02Family ? M02_FIXED_PAPER_WIDTH_MM : config.paperWidth,
    paperHeight: config.paperHeight
  };
  const draftWidth = isM02Family ? M02_FIXED_PAPER_WIDTH_MM : draft.paperWidth;

  React.useEffect(() => {
    if (!isOpen) return;
    setView('list');
    setDeleteConfirmId(null);

    // Remember the paper size currently in use so it's always selectable.
    if (!loadPaperPresets(protocolFamily).some(p => isSamePaperSize(p, currentSize))) {
      savePaperPreset(currentSize);
    }
    setPresets(loadPaperPresets(protocolFamily));
    // Only reload when the modal opens or the printer family changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, protocolFamily]);

  const templateAspectRatio = React.useMemo(
    () => (template ? getSvgAspectRatio(template.svgContent) : null),
    [template]
  );

  const getAspectRatioMismatch = (width: number, height: number) => {
    if (!templateAspectRatio || !width || !height) return null;

    const { displayWidth, displayHeight } = getDisplaySize(width, height, orientation);
    const paperAspectRatio = displayWidth / displayHeight;

    const deviation = Math.abs(paperAspectRatio - templateAspectRatio) / templateAspectRatio;
    if (deviation <= ASPECT_RATIO_TOLERANCE) return null;

    return { paperAspectRatio, templateAspectRatio };
  };

  const aspectRatioWarning = view === 'create'
    ? getAspectRatioMismatch(draftWidth, draft.paperHeight)
    : getAspectRatioMismatch(currentSize.paperWidth, currentSize.paperHeight);

  const handleOrientationChange = (newOrientation: Orientation) => {
    onSave({ orientation: newOrientation });
  };

  const handleSelectPreset = (preset: PaperPreset) => {
    updatePaperPresetUsage(preset.id);
    onSave({
      paperType: preset.paperType,
      paperWidth: preset.paperWidth,
      paperHeight: preset.paperHeight
    });
    onClose();
  };

  const handleDeleteClick = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(presetId);
  };

  const handleConfirmDelete = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deletePaperPreset(presetId);
    setPresets(prev => prev.filter(p => p.id !== presetId));
    setDeleteConfirmId(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  const handleNewClick = () => {
    setDraft({
      paperType: config.paperType,
      paperWidth: config.paperWidth,
      paperHeight: config.paperHeight
    });
    setView('create');
  };

  const handleDraftChange = (field: keyof typeof draft, value: number) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const isDraftValid = draftWidth > 0 && draft.paperHeight > 0;

  const handleCreate = () => {
    if (!isDraftValid) return;
    const preset = savePaperPreset({
      family: protocolFamily,
      paperType: draft.paperType,
      paperWidth: draftWidth,
      paperHeight: draft.paperHeight
    });
    handleSelectPreset(preset);
  };

  const renderPresetCard = (preset: PaperPreset) => {
    const { displayWidth, displayHeight } = getDisplaySize(preset.paperWidth, preset.paperHeight, orientation);
    const scale = PREVIEW_SIZE / Math.max(displayWidth, displayHeight);
    const isActive = isSamePaperSize(preset, currentSize);
    const mismatch = getAspectRatioMismatch(preset.paperWidth, preset.paperHeight);

    return (
      <div
        key={preset.id}
        className={`paper-card ${isActive ? 'active' : ''}`}
        onClick={() => handleSelectPreset(preset)}
      >
        <div className="paper-preview">
          <div
            className="paper-shape"
            style={{ width: displayWidth * scale, height: displayHeight * scale }}
          />
          {deleteConfirmId === preset.id ? (
            <div className="delete-confirm">
              <button
                className="confirm-delete-btn"
                onClick={(e) => handleConfirmDelete(preset.id, e)}
                title="Confirm delete"
              >
                ✓
              </button>
              <button
                className="cancel-delete-btn"
                onClick={handleCancelDelete}
                title="Cancel"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              className="delete-btn"
              onClick={(e) => handleDeleteClick(preset.id, e)}
              title="Delete paper size"
            >
              🗑️
            </button>
          )}
        </div>
        <div className="paper-info">
          <div className="paper-name">
            {preset.paperWidth} × {preset.paperHeight} mm
          </div>
          <div className="paper-meta">
            {isM02Family ? 'M02 paper' : getPaperTypeLabel(preset.paperType)}
            {mismatch && (
              <span className="paper-mismatch" title="Doesn't match the current template's shape">
                {' '}⚠
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const listFooter = (
    <button className="button button-primary new-paper-btn" onClick={handleNewClick}>
      ➕ New Paper Size
    </button>
  );

  const createFooter = (
    <>
      <button className="button button-secondary" onClick={() => setView('list')}>
        Back
      </button>
      <button className="button button-primary" onClick={handleCreate} disabled={!isDraftValid}>
        Save &amp; Use
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={view === 'create' ? 'New Paper Size' : 'Paper Settings'}
      footer={view === 'create' ? createFooter : listFooter}
      className="paper-modal-content"
    >
      {view === 'list' ? (
        <>
          <div className="form-group">
            <label>Orientation:</label>
            <div className="orientation-buttons">
              <button
                className={`orientation-button ${orientation === 'portrait' ? 'active' : ''}`}
                onClick={() => handleOrientationChange('portrait')}
                type="button"
              >
                📄 Portrait
              </button>
              <button
                className={`orientation-button ${orientation === 'landscape' ? 'active' : ''}`}
                onClick={() => handleOrientationChange('landscape')}
                type="button"
              >
                📃 Landscape
              </button>
            </div>
            <small className="orientation-note">
              {orientation === 'landscape' &&
                'Canvas will be rotated 90° clockwise during printing'}
            </small>
          </div>

          <div className="form-group">
            <label>Paper Size:</label>
            <div className="paper-grid">
              {presets.map(renderPresetCard)}
            </div>
          </div>
        </>
      ) : (
        <>
          {!isM02Family && (
            <div className="form-group">
              <label htmlFor="paperType">Paper Type:</label>
              <select
                id="paperType"
                value={draft.paperType}
                onChange={(e) => handleDraftChange('paperType', parseInt(e.target.value))}
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

          <div className="form-group-inline">
            <div className="form-group">
              <label htmlFor="paperWidth">Paper Width (mm):</label>
              <input
                type="number"
                id="paperWidth"
                value={draftWidth}
                onChange={(e) => handleDraftChange('paperWidth', parseInt(e.target.value))}
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
                value={draft.paperHeight}
                onChange={(e) => handleDraftChange('paperHeight', parseInt(e.target.value))}
                min="10"
                max="200"
              />
            </div>
          </div>
        </>
      )}

      {aspectRatioWarning && (
        <div className="aspect-ratio-warning">
          Paper size ({aspectRatioWarning.paperAspectRatio.toFixed(2)}:1) doesn't match the
          current template's shape ({aspectRatioWarning.templateAspectRatio.toFixed(2)}:1).
          The preview and print will be letterboxed to avoid stretching &mdash;{' '}
          {view === 'create'
            ? 'adjust the paper dimensions above to match the template.'
            : 'pick or create a paper size that matches the template.'}
        </div>
      )}
    </Modal>
  );
};

export default PaperSettingsModal;
