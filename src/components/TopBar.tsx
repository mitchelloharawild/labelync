import { IconGear, IconSun } from './icons';
import './TopBar.css';

interface TopBarProps {
  isConnected: boolean;
  deviceLabel?: string;
  onDisconnect: () => void;
  onOpenSetup: () => void;
}

const TopBar = ({ isConnected, deviceLabel, onDisconnect, onOpenSetup }: TopBarProps) => {
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
        <button className="icon-btn" disabled title="Light theme — coming soon">
          <IconSun />
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
