import { useState, useEffect, useCallback } from 'react';
import PrinterForm from './components/PrinterForm';
import PrinterCanvas from './components/PrinterCanvas';
import PrinterSetupModal from './components/PrinterSetupModal';
import PaperSettingsModal from './components/PaperSettingsModal';
import TemplateModal from './components/TemplateModal';
import DataInputModal from './components/DataInputModal';
import { PWAUpdateNotification } from './components/PWAUpdateNotification';
import TopBar from './components/TopBar';
import Toolbar from './components/Toolbar';
import ActionBar from './components/ActionBar';
import { usePrinter } from './hooks/usePrinter';
import { useMqttPrinting, type MqttMessageResult } from './hooks/useMqttPrinting';
import { getDefaultConfig, loadPrinterConfig, savePrinterConfig } from './utils/printerStorage';
import { getTemplate, getDefaultTemplate } from './utils/templateStorage';
import { getFreshTextFieldValues } from './utils/svgTextUtils';
import { loadTheme, saveTheme } from './utils/themeStorage';
import { loadMqttConfig, saveMqttConfig } from './utils/mqttStorage';
import { validateFieldKeys, hasValidationErrors, formatValidationError } from './utils/templateFieldValidation';
import { printTemplateWithValues } from './utils/printFieldValues';

import type { Template, PrinterConfig, Theme, MqttConfig } from './types';
import './App.css';

const DEFAULT_MQTT_CONFIG: MqttConfig = {
  brokerUrl: '',
  requestTopic: 'labelync/print'
};

// Surface color to sync into the theme-color meta tag for each resolved theme
const THEME_COLOR: Record<'light' | 'dark', string> = {
  dark: '#2a3240',
  light: '#ffffff',
};

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
  const [isDataInputModalOpen, setIsDataInputModalOpen] = useState(false);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  const [copies, setCopies] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);

  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [mqttConfig, setMqttConfig] = useState<MqttConfig>(() => loadMqttConfig() ?? DEFAULT_MQTT_CONFIG);

  const { isConnected, deviceId, reconnectablePort, connect, reconnect, disconnect, printImage } = usePrinter();

  const notify = useCallback((message: string, type: 'error' | 'success' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), type === 'error' ? 5000 : 3000);
  }, []);

  // Applies incoming MQTT data to whatever template is currently loaded —
  // live requests never carry their own template selection (see _dev/mqtt.md).
  const handleMqttMessage = useCallback(async (fields: Record<string, string>): Promise<MqttMessageResult> => {
    const validation = validateFieldKeys(currentTemplate.fieldMetadata, Object.keys(fields));
    if (hasValidationErrors(validation)) {
      const error = formatValidationError(validation);
      notify(`MQTT print skipped — field mismatch (${error}).`, 'error');
      return { success: false, error };
    }

    try {
      await printTemplateWithValues(currentTemplate, fields, printerConfig, hiddenFields, printImage);
      notify('Printed a label from an MQTT message.', 'success');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      notify(`MQTT print failed: ${message}`, 'error');
      return { success: false, error: message };
    }
  }, [currentTemplate, printerConfig, hiddenFields, printImage, notify]);

  const {
    connectionState: mqttConnectionState,
    connectionError: mqttConnectionError,
    activityLog: mqttActivityLog,
    connect: connectMqtt,
    disconnect: disconnectMqtt
  } = useMqttPrinting(handleMqttMessage);

  const handleMqttConfigChange = (config: MqttConfig) => {
    setMqttConfig(config);
    saveMqttConfig(config);
  };

  const handleMqttConnect = () => connectMqtt(mqttConfig);

  // Apply the selected theme to the document and keep the PWA theme-color
  // meta tag in sync, including when "system" tracks OS preference changes.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
    saveTheme(theme);

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const applyMetaThemeColor = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mql.matches);
      const meta = document.querySelector('meta[name="theme-color"]');
      meta?.setAttribute('content', isDark ? THEME_COLOR.dark : THEME_COLOR.light);
    };

    applyMetaThemeColor();

    if (theme === 'system') {
      mql.addEventListener('change', applyMetaThemeColor);
      return () => mql.removeEventListener('change', applyMetaThemeColor);
    }
  }, [theme]);

  const handleCycleTheme = () => {
    setTheme(prev => (prev === 'system' ? 'light' : prev === 'light' ? 'dark' : 'system'));
  };

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
            setTextFieldValues(getFreshTextFieldValues(template.textFieldValues, template.fieldMetadata));
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

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      const success = await reconnect();
      if (!success) {
        setNotification({ message: 'Failed to reconnect to printer. Please connect manually.', type: 'error' });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      setNotification({
        message: 'Reconnect failed: ' + (error instanceof Error ? error.message : 'Unknown error') + '. Please connect manually.',
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsReconnecting(false);
    }
  };

  const handlePrint = async () => {
    const canvas = document.getElementById('qrCodeCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    setIsPrinting(true);
    let printed = 0;
    try {
      for (let i = 0; i < copies; i++) {
        await printImage(canvas, printerConfig);
        printed++;
      }
      setNotification({
        message: printed === 1 ? 'Label printed successfully.' : `Printed ${printed} labels successfully.`,
        type: 'success'
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      const message = printed > 0
        ? `Printed ${printed} of ${copies} label${copies === 1 ? '' : 's'}, then failed: ${reason}`
        : `Print failed: ${reason}`;
      setNotification({ message, type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsPrinting(false);
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
    const freshValues = getFreshTextFieldValues(template.textFieldValues, template.fieldMetadata);
    setCurrentTemplate(template);
    setTextFieldValues(freshValues);
    setHiddenFields({}); // Reset hidden fields for new template

    // Update printer config with template info and save
    const updatedConfig: PrinterConfig = {
      ...printerConfig,
      svgTemplate: template.svgContent,
      svgTextFields: freshValues,
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

  const footer = (
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
  );

  return (
    <div className="app-root">
      <PWAUpdateNotification />

      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <TopBar
        isConnected={isConnected}
        deviceLabel={`Phomemo ${printerConfig.deviceModel}`}
        theme={theme}
        onDisconnect={handleDisconnect}
        onOpenSetup={() => setIsSetupModalOpen(true)}
        onCycleTheme={handleCycleTheme}
      />

      {!isConnected ? (
        <div className="disconnected-panel">
          <div className="disconnected-card">
            {!isSerialSupported && (
              <div className="browser-warning">
                <p><strong>⚠️ Unsupported Browser</strong></p>
                <p>This app requires the Web Serial API, which is available in Chrome/Chromium 89+, Microsoft Edge 89+, and Opera 75+.</p>
                <p>Safari and Firefox do not currently support this API.</p>
              </div>
            )}

            {reconnectablePort && (
              <button
                className="connect-button reconnect-button"
                onClick={handleReconnect}
                disabled={!isSerialSupported || isConnecting || isReconnecting}
              >
                {isReconnecting ? 'Reconnecting...' : `Reconnect to Phomemo ${reconnectablePort.deviceModel}`}
              </button>
            )}

            <button
              className="connect-button"
              onClick={handleConnect}
              disabled={!isSerialSupported || isConnecting || isReconnecting}
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

            {footer}
          </div>
        </div>
      ) : (
        <div className="app-body">
          <Toolbar
            theme={theme}
            onOpenPaperSettings={() => setIsPaperSettingsModalOpen(true)}
            onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
            onOpenDataInput={() => setIsDataInputModalOpen(true)}
            onOpenSetup={() => setIsSetupModalOpen(true)}
            onCycleTheme={handleCycleTheme}
          />

          <div className="content-split">
            <div className="controls-pane">
              <PrinterForm
                template={currentTemplate}
                textFieldValues={textFieldValues}
                onTextFieldChange={handleTextFieldChange}
                hiddenFields={hiddenFields}
                onFieldVisibilityChange={handleFieldVisibilityChange}
              />

              <ActionBar
                copies={copies}
                onCopiesChange={setCopies}
                onPrint={handlePrint}
                isPrinting={isPrinting}
              />

              {footer}
            </div>

            <div className="preview-pane">
              <PrinterCanvas
                template={currentTemplate}
                textFieldValues={textFieldValues}
                printerConfig={printerConfig}
                hiddenFields={hiddenFields}
              />
            </div>
          </div>
        </div>
      )}

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
        template={currentTemplate}
      />

      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
        currentTemplateId={currentTemplate.id}
      />

      <DataInputModal
        isOpen={isDataInputModalOpen}
        onClose={() => setIsDataInputModalOpen(false)}
        template={currentTemplate}
        printerConfig={printerConfig}
        hiddenFields={hiddenFields}
        printImage={printImage}
        onNotify={notify}
        mqttConfig={mqttConfig}
        onMqttConfigChange={handleMqttConfigChange}
        mqttConnectionState={mqttConnectionState}
        mqttConnectionError={mqttConnectionError}
        mqttActivityLog={mqttActivityLog}
        onMqttConnect={handleMqttConnect}
        onMqttDisconnect={disconnectMqtt}
      />
    </div>
  );
}

export default App;
