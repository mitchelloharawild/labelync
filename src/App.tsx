import { useState, useRef, useEffect } from 'react';
import PrinterForm from './components/PrinterForm';
import PrinterCanvas from './components/PrinterCanvas';
import PrinterSetupModal from './components/PrinterSetupModal';
import PaperSettingsModal from './components/PaperSettingsModal';
import TemplateModal from './components/TemplateModal';
import { usePrinter } from './hooks/usePrinter';
import { getDefaultConfig, loadPrinterConfig, savePrinterConfig } from './utils/printerStorage';
import { getTemplate, getDefaultTemplate } from './utils/templateStorage';
import type { Template, PrinterConfig } from './types';
import './App.css';

function App() {
  const [currentTemplate, setCurrentTemplate] = useState<Template>(getDefaultTemplate());
  const [textFieldValues, setTextFieldValues] = useState<Record<string, string>>(
    getDefaultTemplate().textFieldValues
  );

  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>(getDefaultConfig());

  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isPaperSettingsModalOpen, setIsPaperSettingsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const { isConnected, deviceId, connect, disconnect, printImage } = usePrinter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load printer config when device connects
  useEffect(() => {
    if (deviceId) {
      const savedConfig = loadPrinterConfig(deviceId);
      if (savedConfig) {
        setPrinterConfig(savedConfig);
        
        // Load last used template if available, otherwise use default
        if (savedConfig.lastUsedTemplateId) {
          const template = getTemplate(savedConfig.lastUsedTemplateId);
          if (template) {
            setCurrentTemplate(template);
            setTextFieldValues(template.textFieldValues);
          } else {
            // Template not found, use default
            const defaultTemplate = getDefaultTemplate();
            setCurrentTemplate(defaultTemplate);
            setTextFieldValues(defaultTemplate.textFieldValues);
          }
        } else {
          // No last used template, use default
          const defaultTemplate = getDefaultTemplate();
          setCurrentTemplate(defaultTemplate);
          setTextFieldValues(defaultTemplate.textFieldValues);
        }
      } else {
        // Use default config for new devices
        const defaultConfig = getDefaultConfig();
        setPrinterConfig(defaultConfig);
        const defaultTemplate = getDefaultTemplate();
        setCurrentTemplate(defaultTemplate);
        setTextFieldValues(defaultTemplate.textFieldValues);
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
    
    // Save config to localStorage for this device
    if (deviceId) {
      savePrinterConfig(deviceId, config);
    }
  };

  const handleSavePaperSettings = (paperSettings: Partial<PrinterConfig>) => {
    const updatedConfig = { ...printerConfig, ...paperSettings };
    setPrinterConfig(updatedConfig);
    
    // Save config to localStorage for this device
    if (deviceId) {
      savePrinterConfig(deviceId, updatedConfig);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    setCurrentTemplate(template);
    setTextFieldValues(template.textFieldValues);
    
    // Update printer config with template info and save
    const updatedConfig: PrinterConfig = {
      ...printerConfig,
      svgTemplate: template.svgContent,
      svgTextFields: template.textFieldValues,
      lastUsedTemplateId: template.id
    };
    setPrinterConfig(updatedConfig);
    
    if (deviceId) {
      savePrinterConfig(deviceId, updatedConfig);
    }
  };

  const handleTextFieldChange = (fieldId: string, value: string) => {
    const updatedValues = { ...textFieldValues, [fieldId]: value };
    setTextFieldValues(updatedValues);
    
    // Update printer config
    const updatedConfig: PrinterConfig = {
      ...printerConfig,
      svgTextFields: updatedValues
    };
    setPrinterConfig(updatedConfig);
    
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
          <>
            <button 
              className="print-button paper-settings-button" 
              onClick={() => setIsPaperSettingsModalOpen(true)}
            >
              📄 Paper Settings
            </button>
            
            <button 
              className="print-button template-button" 
              onClick={() => setIsTemplateModalOpen(true)}
            >
              📋 Template Manager
            </button>
          </>
        )}
        
        <PrinterForm 
          template={currentTemplate}
          textFieldValues={textFieldValues}
          onTextFieldChange={handleTextFieldChange}
        />

        <button 
          className="print-button" 
          onClick={handlePrint}
          disabled={!isConnected}
        >
          🖨 Print Sticker
        </button>

        <PrinterCanvas 
          template={currentTemplate}
          textFieldValues={textFieldValues}
          printerConfig={printerConfig} 
        />
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

      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
        currentTemplateId={currentTemplate.id}
      />
    </div>
  );
}

export default App;
