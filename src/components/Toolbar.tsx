import { IconGear, IconGrid, IconMoon, IconPaper, IconSun, IconUpload } from './icons';
import type { Theme } from '../types';
import './Toolbar.css';

interface ToolbarProps {
  theme: Theme;
  onOpenPaperSettings: () => void;
  onOpenTemplateModal: () => void;
  onOpenDataInput: () => void;
  onOpenSetup: () => void;
  onToggleTheme: () => void;
}

const THEME_ICON: Record<Theme, typeof IconSun> = {
  light: IconSun,
  dark: IconMoon,
};

const THEME_LABEL: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
};

const Toolbar = ({ theme, onOpenPaperSettings, onOpenTemplateModal, onOpenDataInput, onOpenSetup, onToggleTheme }: ToolbarProps) => {
  const ThemeIcon = THEME_ICON[theme];

  return (
    <nav className="icon-rail">
      <div className="rail-group">
        <button className="rail-btn" onClick={onOpenPaperSettings} title="Paper settings">
          <IconPaper />
          <span>Paper</span>
        </button>
        <button className="rail-btn" onClick={onOpenTemplateModal} title="Template manager">
          <IconGrid />
          <span>Templates</span>
        </button>
        <button className="rail-btn" onClick={onOpenDataInput} title="Import data or connect a live MQTT feed">
          <IconUpload />
          <span>Data Input</span>
        </button>
      </div>

      <div className="rail-group rail-group-bottom">
        <button className="rail-btn" onClick={onToggleTheme} title={`Theme: ${THEME_LABEL[theme]} — click to change`}>
          <ThemeIcon />
          <span>{THEME_LABEL[theme]}</span>
        </button>
        <button className="rail-btn" onClick={onOpenSetup} title="Printer settings">
          <IconGear />
        </button>
      </div>
    </nav>
  );
};

export default Toolbar;
