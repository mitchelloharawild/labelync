import { useState, useEffect } from 'react';
import PrinterForm from './components/PrinterForm';
import PrinterCanvas from './components/PrinterCanvas';
import PrinterSetupModal from './components/PrinterSetupModal';
import PaperSettingsModal from './components/PaperSettingsModal';
import TemplateModal from './components/TemplateModal';
import { PWAUpdateNotification } from './components/PWAUpdateNotification';
import { usePrinter } from './hooks/usePrinter';
import { getDefaultConfig, loadPrinterConfig, savePrinterConfig } from './utils/printerStorage';
import { getTemplate, getDefaultTemplate } from './utils/templateStorage';

import type { Template, PrinterConfig } from './types';
import './App.css';

// @ts-ignore - Import version from package.json
import { version as APP_VERSION } from '../package.json';

function App() {
  const [currentTemplate, setCurrentTemplate] = useState<Template>(getDefaultTemplate());
  const [textFieldValues, setTextFieldValues] = useState<Record<string, string>>(
    getDefaultTemplate().textFieldValues
  );
  const [hiddenFields, setHiddenFields] = useState<Record<string, boolean>>({});

  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>(getDefaultConfig());

  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isPaperSettingsModalOpen, setIsPaperSettingsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const [isConnecting, setIsConnecting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  const { isConnected, deviceId, connect, disconnect, printImage } = usePrinter();

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
    setIsConnecting(true);
    try {
      const success = await connect();
      if (!success) {
        setNotification({ message: 'Failed to connect to printer. Please try again.', type: 'error' });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      setNotification({ message: 'Connection failed: ' + (error instanceof Error ? error.message : 'Unknown error'), type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsConnecting(false);
    }
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
    setHiddenFields({}); // Reset hidden fields for new template
    
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

  const handleFieldVisibilityChange = (fieldId: string, isHidden: boolean) => {
    setHiddenFields(prev => ({ ...prev, [fieldId]: isHidden }));
  };

  const handleCheckForUpdates = async () => {
    // Trigger a service worker update check
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          // Set up a listener to detect if an update is found
          let updateFound = false;
          
          const updateListener = () => {
            updateFound = true;
          };
          
          registration.addEventListener('updatefound', updateListener);
          
          // Force the service worker to check for updates
          await registration.update();
          
          // Give it a moment to detect updates
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Clean up listener
          registration.removeEventListener('updatefound', updateListener);
          
          if (updateFound) {
            setNotification({
              type: 'info',
              message: 'Update found! You will be notified when it\'s ready to install.'
            });
          } else {
            setNotification({
              type: 'success',
              message: 'No updates available. You\'re running the latest version!'
            });
          }
          
          setTimeout(() => setNotification(null), 3000);
        } else {
          setNotification({
            type: 'error',
            message: 'Service worker not registered. Unable to check for updates.'
          });
          setTimeout(() => setNotification(null), 3000);
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
        setNotification({
          type: 'error',
          message: 'Failed to check for updates. Please try again.'
        });
        setTimeout(() => setNotification(null), 3000);
      }
    } else {
      setNotification({
        type: 'error',
        message: 'Service workers not supported in this browser.'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="app-container">
      <PWAUpdateNotification />
      
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className="form-container">
        <h2>Labelync</h2>
        
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
              disabled={!isSerialSupported || isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect printer'}
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
                  <a href="https://github.com/mitchelloharawild/labelync/issues" target="_blank" rel="noopener noreferrer">
                    github.com/mitchelloharawild/labelync
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
              hiddenFields={hiddenFields}
              onFieldVisibilityChange={handleFieldVisibilityChange}
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
              hiddenFields={hiddenFields}
            />
          </>
        )}
        
        <footer className="app-footer">
          <span className="version-text">v{APP_VERSION}</span>
          <button 
            className="check-updates-button"
            onClick={handleCheckForUpdates}
            title="Check for updates on GitHub"
          >
            Check for Updates
          </button>
        </footer>
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
