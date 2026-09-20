import React from 'react';
import type { MqttConfig } from '../types';
import type { MqttActivityEntry, MqttConnectionState } from '../hooks/useMqttPrinting';
import './ModalForms.css';
import './MqttPanel.css';

interface MqttPanelProps {
  config: MqttConfig;
  onConfigChange: (config: MqttConfig) => void;
  connectionState: MqttConnectionState;
  connectionError: string | null;
  activityLog: MqttActivityEntry[];
  onConnect: () => void;
  onDisconnect: () => void;
}

const STATE_LABEL: Record<MqttConnectionState, string> = {
  disconnected: 'Disconnected',
  connecting: 'Connecting…',
  connected: 'Connected',
  error: 'Connection error'
};

const MqttPanel: React.FC<MqttPanelProps> = ({
  config,
  onConfigChange,
  connectionState,
  connectionError,
  activityLog,
  onConnect,
  onDisconnect
}) => {
  const isConnected = connectionState === 'connected' || connectionState === 'connecting';

  const updateField = (field: keyof MqttConfig, value: string) => {
    onConfigChange({ ...config, [field]: value });
  };

  const canConnect = config.brokerUrl.trim() !== '' && config.requestTopic.trim() !== '';

  return (
    <div className="batch-step mqtt-panel">
      <p>
        Print labels as they're published to an MQTT topic, using the current template
        (<strong>fields must match this template's field ids</strong>). Requires your own MQTT
        broker (self-hosted or hosted) reachable over WebSockets &mdash; labelync never runs a
        server of its own.
      </p>

      <fieldset className="mqtt-settings" disabled={isConnected}>
        <div className="form-group">
          <label htmlFor="mqtt-broker-url">Broker URL</label>
          <input
            id="mqtt-broker-url"
            type="text"
            placeholder="wss://broker.local:8884/mqtt"
            value={config.brokerUrl}
            onChange={(e) => updateField('brokerUrl', e.target.value)}
          />
        </div>

        <div className="form-group-inline">
          <div className="form-group">
            <label htmlFor="mqtt-username">Username (optional)</label>
            <input
              id="mqtt-username"
              type="text"
              value={config.username || ''}
              onChange={(e) => updateField('username', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="mqtt-password">Password (optional)</label>
            <input
              id="mqtt-password"
              type="password"
              value={config.password || ''}
              onChange={(e) => updateField('password', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="mqtt-request-topic">Request topic</label>
          <input
            id="mqtt-request-topic"
            type="text"
            placeholder="labelync/print"
            value={config.requestTopic}
            onChange={(e) => updateField('requestTopic', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="mqtt-status-topic">Status topic (optional)</label>
          <input
            id="mqtt-status-topic"
            type="text"
            placeholder={config.requestTopic ? `${config.requestTopic}/status` : 'defaults to <request topic>/status'}
            value={config.statusTopic || ''}
            onChange={(e) => updateField('statusTopic', e.target.value)}
          />
        </div>
      </fieldset>

      <p className="mqtt-security-note">
        Credentials are stored only in this browser. Anyone who can publish to the request topic
        can trigger a print of the current template &mdash; scope access to it using your
        broker's own ACLs if it supports them.
      </p>

      <div className="mqtt-connection-row">
        <span className={`mqtt-status-dot mqtt-status-${connectionState}`} />
        <span className="mqtt-status-label">{STATE_LABEL[connectionState]}</span>
        {isConnected ? (
          <button className="button button-secondary" onClick={onDisconnect}>Disconnect</button>
        ) : (
          <button className="button button-primary" onClick={onConnect} disabled={!canConnect}>Connect</button>
        )}
      </div>

      {connectionState === 'error' && connectionError && (
        <div className="batch-error">{connectionError}</div>
      )}

      {activityLog.length > 0 && (
        <div className="mqtt-activity-log">
          <p className="batch-failed-heading">Activity</p>
          <ul>
            {activityLog.map(entry => (
              <li key={entry.id} className={`mqtt-log-${entry.status}`}>
                <span className="mqtt-log-time">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                {entry.status === 'printed' ? 'Printed' : `Failed${entry.error ? `: ${entry.error}` : ''}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MqttPanel;
