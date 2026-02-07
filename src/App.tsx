import { useState, useRef, useEffect } from 'react';
import PrinterForm from './components/PrinterForm';
import PrinterCanvas from './components/PrinterCanvas';
import PrinterSetupModal from './components/PrinterSetupModal';
import PaperSettingsModal from './components/PaperSettingsModal';
import { usePrinter } from './hooks/usePrinter';
import { getDefaultConfig, loadPrinterConfig, savePrinterConfig } from './utils/printerStorage';
import type { FormData, PrinterConfig } from './types';
import './App.css';

function App() {
  const [formData, setFormData] = useState<FormData>({
    qrText: '',
    width: 30,
    height: 20,
    centeredText: '',
    useDate: true,
    date: new Date().toISOString().split('T')[0],
    image: null
  });

  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>(getDefaultConfig());

  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isPaperSettingsModalOpen, setIsPaperSettingsModalOpen] = useState(false);

  const { isConnected, deviceId, connect, disconnect, printImage } = usePrinter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load printer config when device connects
  useEffect(() => {
    if (deviceId) {
      const savedConfig = loadPrinterConfig(deviceId);
      if (savedConfig) {
        setPrinterConfig(savedConfig);
        // Update form data dimensions to match saved paper size
        setFormData(prev => ({
          ...prev,
          width: savedConfig.paperWidth,
          height: savedConfig.paperHeight
        }));
      } else {
        // Use default config for new devices
        const defaultConfig = getDefaultConfig();
        setPrinterConfig(defaultConfig);
        setFormData(prev => ({
          ...prev,
          width: defaultConfig.paperWidth,
          height: defaultConfig.paperHeight
        }));
      }
    }
  }, [deviceId]);

  const handleConnect = async () => {
    await connect();
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handlePrint = async () => {
    const canvas = document.getElementById('qrCodeCanvas') as HTMLCanvasElement;
    if (canvas) {
      await printImage(canvas, printerConfig);
    }
  };

  const handleSaveConfig = (config: PrinterConfig) => {
    setPrinterConfig(config);
    // Update form data dimensions if paper size changed
    setFormData(prev => ({
      ...prev,
      width: config.paperWidth,
      height: config.paperHeight
    }));
    
    // Save config to localStorage for this device
    if (deviceId) {
      savePrinterConfig(deviceId, config);
    }
  };

  const handleSavePaperSettings = (paperSettings: Partial<PrinterConfig>) => {
    const updatedConfig = { ...printerConfig, ...paperSettings };
    setPrinterConfig(updatedConfig);
    // Update form data dimensions if paper size changed
    if (paperSettings.paperWidth !== undefined && paperSettings.paperHeight !== undefined) {
      setFormData(prev => ({
        ...prev,
        width: paperSettings.paperWidth!,
        height: paperSettings.paperHeight!
      }));
    }
    
    // Save config to localStorage for this device
    if (deviceId) {
      savePrinterConfig(deviceId, updatedConfig);
    }
  };

  return (
    <div className="app-container">
      <div className="form-container">
        <h2>Phomemo Printer</h2>
        
        {!isConnected ? (
          <button 
            className="print-button connect-button" 
            onClick={handleConnect}
          >
            Connect printer
          </button>
        ) : (
          <div className="connection-controls">
            <button 
              className="print-button disconnect-button" 
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
            <button 
              className="settings-button-small" 
              onClick={() => setIsSetupModalOpen(true)}
              title="Printer Settings"
            >
              ⚙️
            </button>
          </div>
        )}
        
        {isConnected && (
          <button 
            className="print-button paper-settings-button" 
            onClick={() => setIsPaperSettingsModalOpen(true)}
          >
            📄 Paper Settings
          </button>
        )}
        
        <PrinterForm formData={formData} setFormData={setFormData} />

        <button 
          className="print-button" 
          onClick={handlePrint}
          disabled={!isConnected}
        >
          🖨 Print Sticker
        </button>

        <PrinterCanvas formData={formData} />
      </div>

      <PrinterSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        config={printerConfig}
        onSave={handleSaveConfig}
      />

      <PaperSettingsModal
        isOpen={isPaperSettingsModalOpen}
        onClose={() => setIsPaperSettingsModalOpen(false)}
        config={printerConfig}
        onSave={handleSavePaperSettings}
      />
    </div>
  );
}

export default App;
