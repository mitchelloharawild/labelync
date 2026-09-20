import type { Template } from '../types';
import { extractMultiLineFields } from '../utils/svgTextUtils';
import './PrinterForm.css';

interface PrinterFormProps {
  template: Template | null;
  textFieldValues: Record<string, string>;
  onTextFieldChange: (fieldId: string, value: string) => void;
  hiddenFields: Record<string, boolean>;
  onFieldVisibilityChange: (fieldId: string, isHidden: boolean) => void;
}

const PrinterForm = ({ 
  template, 
  textFieldValues, 
  onTextFieldChange,
  hiddenFields,
  onFieldVisibilityChange
}: PrinterFormProps) => {
  const handleChange = (fieldId: string, value: string) => {
    onTextFieldChange(fieldId, value);
  };

  const toggleFieldVisibility = (fieldId: string) => {
    onFieldVisibilityChange(fieldId, !hiddenFields[fieldId]);
  };

  if (!template) {
    return (
      <div className="printer-form">
        <div className="no-template-message">
          <p>📋 No template selected</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            Click "Template Manager" to upload or select a template
          </p>
        </div>
      </div>
    );
  }

  const multiLineFields = extractMultiLineFields(template.svgContent);
  
  // Create a map of field metadata for quick lookup
  const metadataMap = new Map();
  template.fieldMetadata.forEach(meta => {
    metadataMap.set(meta.id, meta);
  });

  const renderFieldInput = (fieldId: string) => {
    const metadata = metadataMap.get(fieldId);
    const label = metadata?.label || fieldId;
    const value = textFieldValues[fieldId] || '';
    const isOptional = metadata?.optional === true;
    const isHidden = hiddenFields[fieldId] === true;

    // Render based on field type
    if (metadata?.type === 'date') {
      return (
        <div key={fieldId} className="form-field">
          <div className="form-field-header">
            <label htmlFor={fieldId}>{label}:</label>
            {isOptional && (
              <button
                type="button"
                className={`field-toggle-btn ${isHidden ? 'hidden' : ''}`}
                onClick={() => toggleFieldVisibility(fieldId)}
                title={isHidden ? 'Show in canvas' : 'Hide from canvas'}
              >
                {isHidden ? '👁️‍🗨️' : '👁️'}
              </button>
            )}
          </div>
          <div className="field-input-container">
            <input
              type="date"
              id={fieldId}
              name={fieldId}
              value={value}
              onChange={(e) => handleChange(fieldId, e.target.value)}
            />
            {metadata.dateFormat && (
              <small className="field-hint">Format: {metadata.dateFormat}</small>
            )}
          </div>
        </div>
      );
    }

    if (metadata?.type === 'qr') {
      return (
        <div key={fieldId} className="form-field">
          <div className="form-field-header">
            <label htmlFor={fieldId}>{label}:</label>
            {isOptional && (
              <button
                type="button"
                className={`field-toggle-btn ${isHidden ? 'hidden' : ''}`}
                onClick={() => toggleFieldVisibility(fieldId)}
                title={isHidden ? 'Show in canvas' : 'Hide from canvas'}
              >
                {isHidden ? '👁️‍🗨️' : '👁️'}
              </button>
            )}
          </div>
          <div className="field-input-container">
            <input
              type="text"
              id={fieldId}
              name={fieldId}
              value={value}
              onChange={(e) => handleChange(fieldId, e.target.value)}
              placeholder={`Enter ${label} (will be encoded as QR code)`}
            />
            <small className="field-hint">
              📱 QR Code • Error correction: {metadata.qrErrorCorrection || 'M'}
            </small>
          </div>
        </div>
      );
    }

    if (metadata?.type === 'barcode') {
      return (
        <div key={fieldId} className="form-field">
          <div className="form-field-header">
            <label htmlFor={fieldId}>{label}:</label>
            {isOptional && (
              <button
                type="button"
                className={`field-toggle-btn ${isHidden ? 'hidden' : ''}`}
                onClick={() => toggleFieldVisibility(fieldId)}
                title={isHidden ? 'Show in canvas' : 'Hide from canvas'}
              >
                {isHidden ? '👁️‍🗨️' : '👁️'}
              </button>
            )}
          </div>
          <div className="field-input-container">
            <input
              type="text"
              id={fieldId}
              name={fieldId}
              value={value}
              onChange={(e) => handleChange(fieldId, e.target.value)}
              placeholder={`Enter ${label} (will be encoded as barcode)`}
            />
            <small className="field-hint">
              📊 Barcode • Symbology: {metadata.barcodeSymbology || 'CODE128'}
            </small>
          </div>
        </div>
      );
    }

    if (metadata?.type === 'image') {
      return (
        <div key={fieldId} className="form-field">
          <div className="form-field-header">
            <label htmlFor={fieldId}>{label}:</label>
            {isOptional && (
              <button
                type="button"
                className={`field-toggle-btn ${isHidden ? 'hidden' : ''}`}
                onClick={() => toggleFieldVisibility(fieldId)}
                title={isHidden ? 'Show in canvas' : 'Hide from canvas'}
              >
                {isHidden ? '👁️‍🗨️' : '👁️'}
              </button>
            )}
          </div>
          <div className="field-input-container">
            <input
              type="file"
              id={fieldId}
              name={fieldId}
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const dataUrl = event.target?.result as string;
                    handleChange(fieldId, dataUrl);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            {value && (
              <div className="image-preview">
                <img src={value} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />
              </div>
            )}
          </div>
        </div>
      );
    }

    // Default: text or multi-line text
    if (multiLineFields.has(fieldId)) {
      return (
        <div key={fieldId} className="form-field">
          <div className="form-field-header">
            <label htmlFor={fieldId}>{label}:</label>
            {isOptional && (
              <button
                type="button"
                className={`field-toggle-btn ${isHidden ? 'hidden' : ''}`}
                onClick={() => toggleFieldVisibility(fieldId)}
                title={isHidden ? 'Show in canvas' : 'Hide from canvas'}
              >
                {isHidden ? '👁️‍🗨️' : '👁️'}
              </button>
            )}
          </div>
          <div className="field-input-container">
            <textarea
              id={fieldId}
              name={fieldId}
              value={value}
              onChange={(e) => handleChange(fieldId, e.target.value)}
              placeholder={`Enter ${label}`}
              rows={3}
            />
          </div>
        </div>
      );
    }

    return (
      <div key={fieldId} className="form-field">
        <div className="form-field-header">
          <label htmlFor={fieldId}>{label}:</label>
          {isOptional && (
            <button
              type="button"
              className={`field-toggle-btn ${isHidden ? 'hidden' : ''}`}
              onClick={() => toggleFieldVisibility(fieldId)}
              title={isHidden ? 'Show in canvas' : 'Hide from canvas'}
            >
              {isHidden ? '👁️‍🗨️' : '👁️'}
            </button>
          )}
        </div>
        <div className="field-input-container">
          <input
            type="text"
            id={fieldId}
            name={fieldId}
            value={value}
            onChange={(e) => handleChange(fieldId, e.target.value)}
            placeholder={`Enter ${label}`}
          />
        </div>
      </div>
    );
  };

  return (
    <form className="printer-form">
      <div className="template-name-display">
        <span>📄 {template.name}</span>
      </div>
      
      {template.fieldMetadata.map(meta => meta.id).map(fieldId => renderFieldInput(fieldId))}
    </form>
  );
};

export default PrinterForm;
