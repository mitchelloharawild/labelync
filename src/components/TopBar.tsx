import { IconGear, IconMoon, IconPower, IconSun } from './icons';
import type { Theme } from '../types';
import './TopBar.css';

interface TopBarProps {
  isConnected: boolean;
  deviceLabel?: string;
  theme: Theme;
  onDisconnect: () => void;
  onOpenSetup: () => void;
  onToggleTheme: () => void;
}

const THEME_ICON: Record<Theme, typeof IconSun> = {
  light: IconSun,
  dark: IconMoon,
};

const THEME_LABEL: Record<Theme, string> = {
  light: 'Light theme',
  dark: 'Dark theme',
};

const TopBar = ({ isConnected, deviceLabel, theme, onDisconnect, onOpenSetup, onToggleTheme }: TopBarProps) => {
  const ThemeIcon = THEME_ICON[theme];

  return (
    <header className="top-bar">
      <span className="app-title">Labelync</span>

      {isConnected && (
        <div className="device-status">
          <span className="device-pill" title="Printer connected">
            <span className="status-dot" />
            {deviceLabel}
          </span>
          <button className="disconnect-btn" onClick={onDisconnect} title="Disconnect printer" aria-label="Disconnect printer">
            <IconPower size={14} />
            <span className="disconnect-label">Disconnect</span>
          </button>
        </div>
      )}

      <div className="top-bar-spacer" />

      <div className={`top-bar-icons${isConnected ? ' has-rail-duplicate' : ''}`}>
        <button className="icon-btn" onClick={onToggleTheme} title={`${THEME_LABEL[theme]} — click to change`}>
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
