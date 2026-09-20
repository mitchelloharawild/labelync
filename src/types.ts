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
  deviceModel: 'M110' | 'M120' | 'M220' | 'M02' | 'M02Pro' | 'M02S' | 'T02';
  darkness: number; // 0x01 - 0x0f (M110 family only; ignored for M02 family)
  speed: number; // 0x01 - 0x05 (M110 family only; ignored for M02 family)
  paperType: number; // 0x0a="Label With Gaps" 0x0b="Continuous" 0x26="Label With Marks" (M110 family only; ignored for M02 family)
  paperWidth: number; // in mm (fixed at M02_FIXED_PAPER_WIDTH_MM for the M02 family)
  paperHeight: number; // in mm
  orientation: 'portrait' | 'landscape'; // orientation affects printing rotation
  svgTemplate?: string; // SVG template content
  svgTextFields?: Record<string, string>; // text field IDs and their values
  lastUsedTemplateId?: string; // ID of the last used template
}

// The two supported Phomemo printer families speak different wire protocols
// (see src/hooks/usePrinter.ts):
// - 'M110': ESC N speed/darkness + 0x1f 0x11 media type header, 0x1f 0xf0 footer.
//   Covers the M110/M120/M220 models.
// - 'M02': plain ESC/POS (ESC @ / ESC a / 0x1f 0x11 0x02 0x04 header, ESC d feed +
//   0x1f 0x11 status-query footer). Covers the M02/M02 Pro/M02S/T02 models.
//   Experimental/untested on real hardware — see README.
export type ProtocolFamily = 'M110' | 'M02';

const DEVICE_PROTOCOL_FAMILY: Record<PrinterConfig['deviceModel'], ProtocolFamily> = {
  M110: 'M110',
  M120: 'M110',
  M220: 'M110',
  M02: 'M02',
  M02Pro: 'M02',
  M02S: 'M02',
  T02: 'M02'
};

export const getProtocolFamily = (deviceModel: PrinterConfig['deviceModel']): ProtocolFamily =>
  DEVICE_PROTOCOL_FAMILY[deviceModel];

// The M02 family's print head is a fixed 384 dots / 48 bytes per line (48mm),
// unlike the M110 family where the printable width is derived from paperWidth.
export const M02_FIXED_PAPER_WIDTH_MM = 48;
