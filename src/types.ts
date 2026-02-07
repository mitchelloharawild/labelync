export interface FormData {
  qrText: string;
  width: number;
  height: number;
  centeredText: string;
  useDate: boolean;
  date: string;
  image: File | null;
}

export interface PrinterConfig {
  deviceModel: 'M110' | 'M120' | 'M220';
  darkness: number; // 0x01 - 0x0f
  speed: number; // 0x01 - 0x05
  paperType: number; // 0x0a="Label With Gaps" 0x0b="Continuous" 0x26="Label With Marks"
  paperWidth: number; // in mm
  paperHeight: number; // in mm
}
