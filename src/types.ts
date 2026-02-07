export interface FormData {
  qrText: string;
  centeredText: string;
  useDate: boolean;
  date: string;
  image: File | null;
}

export interface Template {
  id: string;
  name: string;
  svgContent: string;
  textFieldIds: string[];
  textFieldValues: Record<string, string>;
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
