// Utilities for rendering special field types (QR codes, dates, images)

import QRCode from 'qrcode';
import { FieldMetadata, FieldType } from '../types';

/**
 * Format a date string according to the specified format
 */
export const formatDate = (dateString: string, format: string = 'YYYY-MM-DD'): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // Return as-is if invalid
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const monthShort = date.toLocaleDateString('en-US', { month: 'short' });
  const monthLong = date.toLocaleDateString('en-US', { month: 'long' });
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dayNameShort = date.toLocaleDateString('en-US', { weekday: 'short' });
  
  // Replace format tokens
  let formatted = format;
  formatted = formatted.replace('YYYY', String(year));
  formatted = formatted.replace('YY', String(year).slice(-2));
  formatted = formatted.replace('MMMM', monthLong);
  formatted = formatted.replace('MMM', monthShort);
  formatted = formatted.replace('MM', month);
  formatted = formatted.replace('M', String(date.getMonth() + 1));
  formatted = formatted.replace('DD', day);
  formatted = formatted.replace('D', String(date.getDate()));
  formatted = formatted.replace('dddd', dayName);
  formatted = formatted.replace('ddd', dayNameShort);
  
  return formatted;
};

/**
 * Generate QR code as SVG path data
 */
export const generateQRCodeSVG = async (
  text: string,
  options: {
    version?: string;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    margin?: number;
  } = {}
): Promise<string> => {
  if (!text) return '';
  
  try {
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
      margin: options.margin || 1,
      width: 200, // Generate at higher resolution
    });
    
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
};

/**
 * Update a rect element to display a QR code
 */
export const updateQRCodeElement = async (
  svgDoc: Document,
  fieldId: string,
  value: string,
  metadata: FieldMetadata
): Promise<void> => {
  const element = svgDoc.getElementById(fieldId);
  if (!element) return;
  
  // Get rect dimensions and position
  const x = parseFloat(element.getAttribute('x') || '0');
  const y = parseFloat(element.getAttribute('y') || '0');
  const width = parseFloat(element.getAttribute('width') || '100');
  const height = parseFloat(element.getAttribute('height') || '100');
  
  // Remove the rect element
  element.remove();
  
  // Generate QR code
  const qrDataUrl = await generateQRCodeSVG(value, {
    version: metadata.qrVersion,
    errorCorrectionLevel: metadata.qrErrorCorrection,
    margin: 0,
  });
  
  if (qrDataUrl) {
    // Create an image element with the QR code
    const image = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'image');
    image.setAttribute('id', fieldId);
    image.setAttribute('x', x.toString());
    image.setAttribute('y', y.toString());
    image.setAttribute('width', width.toString());
    image.setAttribute('height', height.toString());
    image.setAttribute('href', qrDataUrl);
    
    // Add to SVG
    const svgElement = svgDoc.querySelector('svg');
    if (svgElement) {
      svgElement.appendChild(image);
    }
  }
};

/**
 * Update a text element to display a formatted date
 */
export const updateDateElement = (
  svgDoc: Document,
  fieldId: string,
  value: string,
  metadata: FieldMetadata
): string => {
  return formatDate(value, metadata.dateFormat);
};

/**
 * Update an image element with uploaded image data
 */
export const updateImageElement = (
  svgDoc: Document,
  fieldId: string,
  value: string, // base64 data URL
  metadata: FieldMetadata
): void => {
  const element = svgDoc.getElementById(fieldId);
  if (!element || !value) return;
  
  if (element.tagName === 'image') {
    element.setAttribute('href', value);
    
    // Optionally update dimensions if specified
    if (metadata.imageWidth) {
      element.setAttribute('width', metadata.imageWidth.toString());
    }
    if (metadata.imageHeight) {
      element.setAttribute('height', metadata.imageHeight.toString());
    }
  }
};
