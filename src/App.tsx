import { useState, useRef, useEffect } from 'react';
import PrinterForm from './components/PrinterForm';
import PrinterCanvas from './components/PrinterCanvas';
import PrinterSetupModal from './components/PrinterSetupModal';
import PaperSettingsModal from './components/PaperSettingsModal';
import TemplateModal from './components/TemplateModal';
import { usePrinter } from './hooks/usePrinter';
import { getDefaultConfig, loadPrinterConfig, savePrinterConfig } from './utils/printerStorage';
import { getTemplate, getDefaultTemplate } from './utils/templateStorage';
import { updateSVGTextFields } from './utils/svgTextUtils';
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

  // Check if browser supports Web Serial API
  const isSerialSupported = 'serial' in navigator;

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

  const handleExportSVG = () => {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(currentTemplate.svgContent, 'image/svg+xml');
    const svgElement = svgDoc.querySelector('svg');
    
    if (!svgElement) return;

    // Get SVG dimensions
    const widthAttr = svgElement.getAttribute('width') || '384';
    let svgWidth: number;
    
    if (widthAttr.match(/[a-z]/i)) {
      const viewBox = svgElement.getAttribute('viewBox');
      if (viewBox) {
        const viewBoxValues = viewBox.split(/\s+/);
        svgWidth = parseFloat(viewBoxValues[2]) || 384;
      } else {
        svgWidth = 384;
      }
    } else {
      svgWidth = parseFloat(widthAttr);
    }
    
    const padding = 20;
    const maxTextWidth = svgWidth - (padding * 2);

    // Update text fields in the SVG
    updateSVGTextFields(svgDoc, textFieldValues, maxTextWidth);

    // Serialize the updated SVG
    const serializer = new XMLSerializer();
    const updatedSvgString = serializer.serializeToString(svgDoc);

    // Create a blob and download link
    const blob = new Blob([updatedSvgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentTemplate.name.replace(/\s+/g, '_')}_${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          <>
            {!isSerialSupported && (
              <div className="browser-warning">
                <p><strong>⚠️ Unsupported Browser</strong></p>
                <p>This app requires the Web Serial API, which is available in Chrome/Chromium 89+, Microsoft Edge 89+, and Opera 75+.</p>
                <p>Safari and Firefox do not currently support this API.</p>
              </div>
            )}

            <button 
              className="print-button connect-button" 
              onClick={handleConnect}
              disabled={!isSerialSupported}
            >
              Connect printer
            </button>
            
            <div className="quick-start-guide">
              <div className="guide-section">
                <h4>Supported Printers</h4>
                <ul>
                  <li>✅ Phomemo M110 (tested)</li>
                  <li>❓ Phomemo M120 (untested)</li>
                  <li>❓ Phomemo M220 (untested)</li>
                </ul>
                <p style={{ fontSize: '0.85rem', marginTop: '8px', fontStyle: 'italic' }}>
                  Have a different model? Please report if it works at{' '}
                  <a href="https://github.com/mitchelloharawild/phomemo-pwa/issues" target="_blank" rel="noopener noreferrer">
                    github.com/mitchelloharawild/phomemo-pwa
                  </a>
                </p>
              </div>
              
              <div className="guide-section">
                <h4>Quick Start</h4>
                <ol>
                  <li>Click "Connect printer" above</li>
                  <li>Select your Phomemo printer from the dialog</li>
                  <li>Configure your paper settings</li>
                  <li>Choose or create a template</li>
                  <li>Design and print your stickers</li>
                </ol>
              </div>
              
              <div className="guide-section tips-section">
                <h4>✨ Features</h4>
                <ul>
                  <li>Device-specific settings saved automatically</li>
                  <li>Real-time preview of your design</li>
                  <li>Customizable SVG templates</li>
                  <li>Works offline after first load</li>
                </ul>
              </div>
            </div>
          </>
        ) : (
          <>
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

            {/* <button 
              className="print-button export-button" 
              onClick={handleExportSVG}
            >
              💾 Export SVG
            </button> */}

            <PrinterCanvas 
              template={currentTemplate}
              textFieldValues={textFieldValues}
              printerConfig={printerConfig} 
            />
          </>
        )}
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
