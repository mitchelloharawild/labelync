import { IconGear, IconMonitor, IconMoon, IconSun } from './icons';
import type { Theme } from '../types';
import './TopBar.css';

interface TopBarProps {
  isConnected: boolean;
  deviceLabel?: string;
  theme: Theme;
  onDisconnect: () => void;
  onOpenSetup: () => void;
  onCycleTheme: () => void;
}

const THEME_ICON: Record<Theme, typeof IconSun> = {
  system: IconMonitor,
  light: IconSun,
  dark: IconMoon,
};

const THEME_LABEL: Record<Theme, string> = {
  system: 'System theme',
  light: 'Light theme',
  dark: 'Dark theme',
};

const TopBar = ({ isConnected, deviceLabel, theme, onDisconnect, onOpenSetup, onCycleTheme }: TopBarProps) => {
  const ThemeIcon = THEME_ICON[theme];

  return (
    <header className="top-bar">
      <span className="app-title">Labelync</span>

      {isConnected && (
        <button className="device-pill" onClick={onDisconnect} title="Disconnect printer">
          <span className="status-dot" />
          {deviceLabel}
        </button>
      )}

      <div className="top-bar-spacer" />

      <div className={`top-bar-icons${isConnected ? ' has-rail-duplicate' : ''}`}>
        <button className="icon-btn" onClick={onCycleTheme} title={`${THEME_LABEL[theme]} — click to change`}>
          <ThemeIcon />
        </button>
        {isConnected && (
          <button className="icon-btn" onClick={onOpenSetup} title="Printer settings">
            <IconGear />
          </button>
        )}
      </div>
    </header>
  );
};

export default TopBar;
