// Theme preference: 'system' follows the OS prefers-color-scheme setting
export type Theme = 'system' | 'light' | 'dark';

export interface FormData {
  qrText: string;
  centeredText: string;
  useDate: boolean;
  date: string;
  image: File | null;
}

// Field types supported in SVG templates
export enum FieldType {
  TEXT = 'text',
  DATE = 'date',
  QR = 'qr',
  IMAGE = 'image',
  BARCODE = 'barcode'
}

// Metadata for a field in an SVG template
export interface FieldMetadata {
  id: string;
  type: FieldType;
  label?: string; // Optional display label from data-label attribute
  optional?: boolean; // Whether the field is optional (can be hidden/shown)
  // QR code specific options
  qrVersion?: string; // QR code version (1-40, or 'auto')
  qrErrorCorrection?: 'L' | 'M' | 'Q' | 'H'; // Error correction level
  // Date specific options
  dateFormat?: string; // Date format string (e.g., 'YYYY-MM-DD', 'DD/MM/YYYY')
  // Image specific options
  imageWidth?: number;
  imageHeight?: number;
  // Barcode specific options
  barcodeSymbology?: string; // Barcode symbology (e.g. 'CODE128'), defaults to 'CODE128'
}

export interface Template {
  id: string;
  name: string;
  svgContent: string;
  textFieldValues: Record<string, string>;
  fieldMetadata: FieldMetadata[];
  thumbnail?: string; // base64 encoded preview image
  createdAt: number;
  lastUsedAt: number;
}

export interface PrinterConfig {
  deviceModel: 'M110' | 'M120' | 'M220';
  darkness: number; // 0x01 - 0x0f
  speed: number; // 0x01 - 0x05
  paperType: number; // 0x0a="Label With Gaps" 0x0b="Continuous" 0x26="Label With Marks"
  paperWidth: number; // in mm
  paperHeight: number; // in mm
  orientation: 'portrait' | 'landscape'; // orientation affects printing rotation
  svgTemplate?: string; // SVG template content
  svgTextFields?: Record<string, string>; // text field IDs and their values
  lastUsedTemplateId?: string; // ID of the last used template
}
