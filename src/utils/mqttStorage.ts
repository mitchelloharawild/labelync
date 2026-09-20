import type { MqttConfig } from '../types';

const STORAGE_KEY = 'mqtt_config';

export const saveMqttConfig = (config: MqttConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save MQTT config:', error);
  }
};

export const loadMqttConfig = (): MqttConfig | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as MqttConfig;
    }
  } catch (error) {
    console.error('Failed to load MQTT config:', error);
  }
  return null;
};
