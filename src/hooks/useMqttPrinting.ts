import { useCallback, useEffect, useRef, useState } from 'react';
import mqtt, { type MqttClient } from 'mqtt';
import type { MqttConfig } from '../types';

export type MqttConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface MqttActivityEntry {
  id: string;
  timestamp: number;
  status: 'printed' | 'failed';
  fields?: Record<string, string>;
  error?: string;
}

export type MqttMessageResult = { success: true } | { success: false; error: string };
export type MqttMessageHandler = (fields: Record<string, string>) => Promise<MqttMessageResult>;

interface UseMqttPrintingReturn {
  connectionState: MqttConnectionState;
  connectionError: string | null;
  activityLog: MqttActivityEntry[];
  connect: (config: MqttConfig) => void;
  disconnect: () => void;
}

const MAX_LOG_ENTRIES = 50;

/**
 * Owns the MQTT connection lifecycle for live printing. This is called once
 * at the App level (like usePrinter) rather than from inside the Data Input
 * modal, so incoming print requests keep printing while the modal is closed
 * — that's the whole point of "live" mode.
 *
 * `onMessage` is read from a ref rather than captured at connect() time, so
 * it always sees the latest template/printer config even though the
 * underlying MQTT subscription is only set up once per connect() call.
 */
export const useMqttPrinting = (onMessage: MqttMessageHandler): UseMqttPrintingReturn => {
  const [connectionState, setConnectionState] = useState<MqttConnectionState>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<MqttActivityEntry[]>([]);

  const clientRef = useRef<MqttClient | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const pushLogEntry = useCallback((entry: Omit<MqttActivityEntry, 'id' | 'timestamp'>) => {
    setActivityLog(prev => [
      { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, timestamp: Date.now() },
      ...prev
    ].slice(0, MAX_LOG_ENTRIES));
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.end(true);
    clientRef.current = null;
    setConnectionState('disconnected');
    setConnectionError(null);
  }, []);

  const connect = useCallback((config: MqttConfig) => {
    clientRef.current?.end(true);

    setConnectionState('connecting');
    setConnectionError(null);

    const statusTopic = config.statusTopic || `${config.requestTopic}/status`;

    const client = mqtt.connect(config.brokerUrl, {
      username: config.username || undefined,
      password: config.password || undefined,
      clientId: config.clientId || undefined,
      reconnectPeriod: 2000
    });
    clientRef.current = client;

    client.on('connect', () => {
      setConnectionState('connected');
      setConnectionError(null);
      client.subscribe(config.requestTopic, { qos: 0 });
    });

    client.on('reconnect', () => {
      setConnectionState('connecting');
    });

    client.on('error', (err) => {
      setConnectionState('error');
      setConnectionError(err.message);
    });

    client.on('close', () => {
      setConnectionState(prev => (prev === 'error' ? prev : 'disconnected'));
    });

    client.on('message', async (_topic, payload) => {
      let fields: Record<string, string>;
      try {
        const parsed = JSON.parse(payload.toString());
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          throw new Error('Payload must be a flat JSON object of field values');
        }
        fields = parsed;
      } catch (e) {
        const error = e instanceof Error ? e.message : 'Invalid JSON payload';
        pushLogEntry({ status: 'failed', error });
        client.publish(statusTopic, JSON.stringify({ status: 'failed', error }));
        return;
      }

      const result = await onMessageRef.current(fields);
      if (result.success) {
        pushLogEntry({ status: 'printed', fields });
        client.publish(statusTopic, JSON.stringify({ status: 'printed' }));
      } else {
        pushLogEntry({ status: 'failed', fields, error: result.error });
        client.publish(statusTopic, JSON.stringify({ status: 'failed', error: result.error }));
      }
    });
  }, [pushLogEntry]);

  // Close the connection if the app itself unmounts (page navigation/close).
  useEffect(() => {
    return () => {
      clientRef.current?.end(true);
    };
  }, []);

  return { connectionState, connectionError, activityLog, connect, disconnect };
};
