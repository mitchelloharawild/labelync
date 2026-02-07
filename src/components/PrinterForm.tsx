import React from 'react';
import type { Template } from '../types';
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

  const extractMultiLineFields = (svgContent: string): Set<string> => {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const textElements = svgDoc.querySelectorAll('text[id]');
    
    const multiLine = new Set<string>();
    
    textElements.forEach(el => {
      const id = el.getAttribute('id');
      if (id) {
        const tspans = el.querySelectorAll('tspan');
        if (tspans.length > 0) {
          multiLine.add(id);
        }
      }
    });
    
    return multiLine;
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

  return (
    <form className="printer-form">
      <div className="template-name-display">
        <span>📄 {template.name}</span>
      </div>
      
      {template.textFieldIds.map(fieldId => (
        <div key={fieldId} className="form-field">
          <label htmlFor={fieldId}>{fieldId}:</label>
          {multiLineFields.has(fieldId) ? (
            <textarea
              id={fieldId}
              name={fieldId}
              value={textFieldValues[fieldId] || ''}
              onChange={(e) => handleChange(fieldId, e.target.value)}
              placeholder={`Enter ${fieldId}`}
              rows={3}
            />
          ) : (
            <input
              type="text"
              id={fieldId}
              name={fieldId}
              value={textFieldValues[fieldId] || ''}
              onChange={(e) => handleChange(fieldId, e.target.value)}
              placeholder={`Enter ${fieldId}`}
            />
          )}
        </div>
      ))}
    </form>
  );
};

export default PrinterForm;
