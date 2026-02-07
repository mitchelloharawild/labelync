import { useCanvas } from '../hooks/useCanvas';
import type { FormData } from '../types';
import './PrinterCanvas.css';

interface PrinterCanvasProps {
  formData: FormData;
}

const PrinterCanvas = ({ formData }: PrinterCanvasProps) => {
  const canvasRef = useCanvas(formData);

  return (
    <canvas 
      ref={canvasRef} 
      className="printer-canvas"
      id="qrCodeCanvas"
    />
  );
};

export default PrinterCanvas;
