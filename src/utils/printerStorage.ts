import type { PrinterConfig } from '../types';
import { getProtocolFamily, M02_FIXED_PAPER_WIDTH_MM } from '../types';

const STORAGE_KEY_PREFIX = 'printer_config_';

export const getDeviceId = (port: SerialPort): string => {
  const info = port.getInfo();
  // Create a unique ID from USB vendor and product IDs
  // If available, this will be consistent for the same physical device
  return `${info.usbVendorId}_${info.usbProductId}`;
};

export const savePrinterConfig = (deviceId: string, config: PrinterConfig): void => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${deviceId}`;
    localStorage.setItem(key, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save printer config:', error);
  }
};

export const loadPrinterConfig = (deviceId: string): PrinterConfig | null => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${deviceId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const config = JSON.parse(stored) as PrinterConfig;
      return config;
    }
  } catch (error) {
    console.error('Failed to load printer config:', error);
  }
  return null;
};

export const getDefaultConfig = (deviceModel: PrinterConfig['deviceModel'] = 'M110'): PrinterConfig => {
  if (getProtocolFamily(deviceModel) === 'M02') {
    // No documented darkness/speed/media-type commands for this family, and
    // the print width is fixed by the hardware rather than configurable.
    return {
      deviceModel,
      darkness: 0,
      speed: 0,
      paperType: 0,
      paperWidth: M02_FIXED_PAPER_WIDTH_MM,
      paperHeight: 30,
      orientation: 'portrait'
    };
  }

  return {
    deviceModel,
    darkness: 0x08,
    speed: 0x05,
    paperType: 0x0a,
    paperWidth: 30,
    paperHeight: 20,
    orientation: 'portrait'
  };
};
