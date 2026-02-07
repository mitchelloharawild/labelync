import React from 'react';
import type { Template, FieldType } from '../types';
import { extractMultiLineFields } from '../utils/svgTextUtils';
import './PrinterForm.css';

interface PrinterFormProps {
  template: Template | null;
  textFieldValues: Record<string, string>;
  onTextFieldChange: (fieldId: string, value: string) => void;
}

const PrinterForm = ({ template, textFieldValues, onTextFieldChange }: PrinterFormProps) => {
  const handleChange = (fieldId: string, value: string) => {
    onTextFieldChange(fieldId, value);
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

    // Render based on field type
    if (metadata?.type === 'date') {
      return (
        <div key={fieldId} className="form-field">
          <label htmlFor={fieldId}>{label}:</label>
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
      );
    }

    if (metadata?.type === 'qr') {
      return (
        <div key={fieldId} className="form-field">
          <label htmlFor={fieldId}>{label}:</label>
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
      );
    }

    if (metadata?.type === 'image') {
      return (
        <div key={fieldId} className="form-field">
          <label htmlFor={fieldId}>{label}:</label>
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
      );
    }

    // Default: text or multi-line text
    if (multiLineFields.has(fieldId)) {
      return (
        <div key={fieldId} className="form-field">
          <label htmlFor={fieldId}>{label}:</label>
          <textarea
            id={fieldId}
            name={fieldId}
            value={value}
            onChange={(e) => handleChange(fieldId, e.target.value)}
            placeholder={`Enter ${label}`}
            rows={3}
          />
        </div>
      );
    }

    return (
      <div key={fieldId} className="form-field">
        <label htmlFor={fieldId}>{label}:</label>
        <input
          type="text"
          id={fieldId}
          name={fieldId}
          value={value}
          onChange={(e) => handleChange(fieldId, e.target.value)}
          placeholder={`Enter ${label}`}
        />
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
