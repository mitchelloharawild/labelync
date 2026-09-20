import { useState, useCallback, useEffect } from 'react';
import type { PrinterConfig } from '../types';
import { rasterizeMonochrome, buildPrintCommands } from 'phomemo-protocol';
import { openPhomemoSerialPort, getSerialDeviceId, writePrintCommands } from 'phomemo-protocol/serial';
import { loadPrinterConfig } from '../utils/printerStorage';

export interface KnownPort {
  port: SerialPort;
  deviceId: string;
  deviceModel: PrinterConfig['deviceModel'];
}

interface UsePrinterReturn {
  isConnected: boolean;
  deviceId: string | null;
  reconnectablePort: KnownPort | null;
  connect: () => Promise<boolean>;
  reconnect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  printImage: (canvas: HTMLCanvasElement, config: PrinterConfig) => Promise<void>;
}

export const usePrinter = (): UsePrinterReturn => {
  const [serialPort, setSerialPort] = useState<SerialPort | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [reconnectablePort, setReconnectablePort] = useState<KnownPort | null>(null);

  // On mount, check for already-authorized ports (granted in a previous session)
  // that match a previously-saved printer config, so we can offer a one-click
  // reconnect instead of re-prompting the OS device picker.
  useEffect(() => {
    if (!('serial' in navigator)) return;

    let cancelled = false;

    (async () => {
      try {
        const ports = await navigator.serial.getPorts();
        for (const port of ports) {
          const id = getSerialDeviceId(port);
          const savedConfig = loadPrinterConfig(id);
          if (savedConfig) {
            if (!cancelled) {
              setReconnectablePort({ port, deviceId: id, deviceModel: savedConfig.deviceModel });
            }
            return;
          }
        }
      } catch (e) {
        console.error('Failed to enumerate authorized serial ports:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Shared logic for opening a SerialPort (whether obtained via requestPort()
  // or an already-authorized port from getPorts()) and updating connection state.
  const openPort = useCallback(async (port: SerialPort): Promise<boolean> => {
    // Create a promise that rejects after 10 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000);
    });

    // Race between opening the port and the timeout
    await Promise.race([
      openPhomemoSerialPort(port),
      timeoutPromise
    ]);

    const id = getSerialDeviceId(port);

    setSerialPort(port);
    setIsConnected(true);
    setDeviceId(id);
    setReconnectablePort(null);
    return true;
  }, []);

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
      return await openPort(port);
    } catch (e) {
      console.error('Failed to connect:', e);

      // User cancelled the connection dialog
      if (e instanceof DOMException && e.name === 'NotFoundError') {
        return false;
      }

      // Rethrow other errors to be handled by the caller
      throw e;
    }
  }, [serialPort, openPort]);

  const reconnect = useCallback(async (): Promise<boolean> => {
    if (!reconnectablePort) return false;

    try {
      return await openPort(reconnectablePort.port);
    } catch (e) {
      console.error('Failed to reconnect:', e);
      // The previously authorized port is no longer available (unplugged,
      // revoked, etc.) — clear it so the UI falls back to "Connect printer".
      setReconnectablePort(null);
      throw e;
    }
  }, [reconnectablePort, openPort]);

  const disconnect = useCallback(async (): Promise<void> => {
    if (!serialPort) return;
    
    await serialPort.close();
    setSerialPort(null);
    setIsConnected(false);
    setDeviceId(null);
  }, [serialPort]);

  const rotateCanvas90Clockwise = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const rotatedCanvas = document.createElement('canvas');
    rotatedCanvas.width = canvas.height;
    rotatedCanvas.height = canvas.width;
    
    const ctx = rotatedCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context for rotation');
    }
    
    // Translate to center, rotate 90 degrees clockwise, then translate back
    ctx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    
    return rotatedCanvas;
  };

  const printImage = useCallback(async (canvas: HTMLCanvasElement, config: PrinterConfig): Promise<void> => {
    if (!serialPort) {
      throw new Error('No printer connected');
    }

    // Rotate canvas if in landscape mode
    const printCanvas = config.orientation === 'landscape'
      ? rotateCanvas90Clockwise(canvas)
      : canvas;

    const ctx = printCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    const imageData = ctx.getImageData(0, 0, printCanvas.width, printCanvas.height);
    const bitmap = rasterizeMonochrome(imageData);
    const commands = buildPrintCommands(bitmap, {
      deviceModel: config.deviceModel,
      darkness: config.darkness,
      speed: config.speed,
      paperType: config.paperType
    });

    try {
      await writePrintCommands(serialPort, commands);
    } catch (e) {
      console.error('Print error:', e);
      throw e instanceof Error ? e : new Error('Print failed');
    }
  }, [serialPort]);

  return {
    isConnected,
    deviceId,
    reconnectablePort,
    connect,
    reconnect,
    disconnect,
    printImage
  };
};
