import type { DeviceModel } from 'phomemo-protocol';
export type { ProtocolFamily } from 'phomemo-protocol';
export { getProtocolFamily, M02_FIXED_PAPER_WIDTH_MM } from 'phomemo-protocol';

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
  deviceModel: DeviceModel;
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

// Settings for the live MQTT print endpoint. The broker is user-provided
// (self-hosted or a hosted broker of their choosing) — labelync only ever
// acts as an MQTT client over WebSockets, never a server.
export interface MqttConfig {
  brokerUrl: string; // e.g. wss://broker.local:8884/mqtt or ws://192.168.1.50:9001
  username?: string;
  password?: string;
  requestTopic: string; // e.g. labelync/print
  statusTopic?: string; // defaults to `${requestTopic}/status` if unset
  clientId?: string; // auto-generated if unset, persisted so reconnects reuse it
}
