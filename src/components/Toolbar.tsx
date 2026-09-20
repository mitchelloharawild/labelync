import { IconGear, IconGrid, IconMonitor, IconMoon, IconPaper, IconSun, IconUpload } from './icons';
import type { Theme } from '../types';
import './Toolbar.css';

interface ToolbarProps {
  theme: Theme;
  onOpenPaperSettings: () => void;
  onOpenTemplateModal: () => void;
  onOpenBatchPrint: () => void;
  onOpenSetup: () => void;
  onCycleTheme: () => void;
}

const THEME_ICON: Record<Theme, typeof IconSun> = {
  system: IconMonitor,
  light: IconSun,
  dark: IconMoon,
};

const THEME_LABEL: Record<Theme, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

const Toolbar = ({ theme, onOpenPaperSettings, onOpenTemplateModal, onOpenBatchPrint, onOpenSetup, onCycleTheme }: ToolbarProps) => {
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
        <button className="rail-btn" onClick={onOpenBatchPrint} title="Batch print from CSV">
          <IconUpload />
          <span>Batch CSV</span>
        </button>
      </div>

      <div className="rail-group rail-group-bottom">
        <button className="rail-btn" onClick={onCycleTheme} title={`Theme: ${THEME_LABEL[theme]} — click to change`}>
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
