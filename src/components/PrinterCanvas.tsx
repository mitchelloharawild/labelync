import { useCanvas } from '../hooks/useCanvas';
import type { Template, PrinterConfig } from '../types';
import './PrinterCanvas.css';

interface PrinterCanvasProps {
  template: Template;
  textFieldValues: Record<string, string>;
  printerConfig: PrinterConfig;
}

const PrinterCanvas = ({ template, textFieldValues, printerConfig }: PrinterCanvasProps) => {
  const canvasRef = useCanvas(template, textFieldValues, printerConfig);

  return (
    <canvas 
      ref={canvasRef} 
      className="printer-canvas"
      id="qrCodeCanvas"
    />
  );
};

export default PrinterCanvas;
