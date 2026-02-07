import React from 'react';
import type { FormData } from '../types';
import './PrinterForm.css';

interface PrinterFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

const PrinterForm = ({ formData, setFormData }: PrinterFormProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked, files } = target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'file' && files) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <form className="printer-form">
      <label htmlFor="qrText">QR Code Content:</label>
      <input
        type="text"
        id="qrText"
        name="qrText"
        value={formData.qrText}
        onChange={handleChange}
        placeholder="Enter text for QR code"
      />

      <div className="input-group">
        <div>
          <label htmlFor="width">Width (mm):</label>
          <input
            type="number"
            id="width"
            name="width"
            value={formData.width}
            onChange={handleChange}
            placeholder="Width in mm"
          />
        </div>
        <div>
          <label htmlFor="height">Height (mm):</label>
          <input
            type="number"
            id="height"
            name="height"
            value={formData.height}
            onChange={handleChange}
            placeholder="Height in mm"
          />
        </div>
      </div>

      <label htmlFor="centeredText">Text:</label>
      <textarea
        id="centeredText"
        name="centeredText"
        value={formData.centeredText}
        onChange={handleChange}
        placeholder="Enter text to center"
        rows={3}
      />

      <div className="date-picker-container">
        <div className="checkbox-wrapper">
          <input
            type="checkbox"
            id="useDate"
            name="useDate"
            checked={formData.useDate}
            onChange={handleChange}
          />
          <label htmlFor="useDate">Include Date:</label>
        </div>
        {formData.useDate && (
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
          />
        )}
      </div>

      <div className="input-group">
        <label htmlFor="image">Upload Image:</label>
        <input
          type="file"
          id="image"
          name="image"
          onChange={handleChange}
          accept="image/*"
        />
      </div>
    </form>
  );
};

export default PrinterForm;
