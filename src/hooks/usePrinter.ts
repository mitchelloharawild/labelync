import { useState, useCallback } from 'react';
import type { PrinterConfig } from '../types';
import { getDeviceId } from '../utils/printerStorage';

interface UsePrinterReturn {
  isConnected: boolean;
  deviceId: string | null;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  printImage: (canvas: HTMLCanvasElement, config: PrinterConfig) => Promise<boolean>;
}

export const usePrinter = (): UsePrinterReturn => {
  const [serialPort, setSerialPort] = useState<SerialPort | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const connect = useCallback(async (): Promise<boolean> => {
    if (serialPort) {
      await serialPort.close();
      setSerialPort(null);
      setIsConnected(false);
      setDeviceId(null);
      return false;
    }

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 128000 });
      
      const id = getDeviceId(port);
      
      setSerialPort(port);
      setIsConnected(true);
      setDeviceId(id);
      return true;
    } catch (e) {
      console.error('Failed to connect:', e);
      return false;
    }
  }, [serialPort]);

  const disconnect = useCallback(async (): Promise<void> => {
    if (!serialPort) return;
    
    await serialPort.close();
    setSerialPort(null);
    setIsConnected(false);
    setDeviceId(null);
  }, [serialPort]);

  const printImage = useCallback(async (canvas: HTMLCanvasElement, config: PrinterConfig): Promise<boolean> => {
    if (!serialPort) {
      console.error('No device connected');
      return false;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return false;
    }
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const arrayWidth = Math.ceil(imageData.width / 8);
    const arrayHeight = imageData.height;
    const array = new Uint8Array(arrayWidth * arrayHeight);
    array.fill(0x00);

    for (let y = 0; y < imageData.height; ++y) {
      for (let x = 0; x < imageData.width; ++x) {
        const imageDataIndex = (y * imageData.width + x) * 4;
        const r = imageData.data[imageDataIndex];
        const g = imageData.data[imageDataIndex + 1];
        const b = imageData.data[imageDataIndex + 2];

        if (r < 0x80 && g < 0x80 && b < 0x80) {
          const byteIndex = Math.floor(x / 8);
          const bitIndex = x % 8;
          array[y * arrayWidth + byteIndex] |= (0x80 >> bitIndex);
        }
      }
    }

    const HEADER = new Uint8Array([
      0x1b, 0x4e, 0x0d, config.speed,
      0x1b, 0x4e, 0x04, config.darkness,
      0x1f, 0x11, config.paperType
    ]);
    
    const BLOCK_MARKER = new Uint8Array([
      0x1d, 0x76, 0x30, 0x00,
      arrayWidth & 0xff,
      arrayWidth >> 8,
      arrayHeight & 0xff,
      arrayHeight >> 8
    ]);
    
    const FOOTER = new Uint8Array([
      0x1f, 0xf0, 0x05, 0x00,
      0x1f, 0xf0, 0x03, 0x00
    ]);

    try {
      const writer = serialPort.writable.getWriter();

      await writer.write(HEADER);
      await writer.write(BLOCK_MARKER);
      await writer.write(array);
      await writer.write(FOOTER);

      await writer.close();

      return true;
    } catch (e) {
      console.error('Print error:', e);
      return false;
    }
  }, [serialPort]);

  return {
    isConnected,
    deviceId,
    connect,
    disconnect,
    printImage
  };
};
