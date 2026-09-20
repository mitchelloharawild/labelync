import { IconGear, IconGrid, IconPaper, IconSun, IconUpload } from './icons';
import './Toolbar.css';

interface ToolbarProps {
  onOpenPaperSettings: () => void;
  onOpenTemplateModal: () => void;
  onOpenSetup: () => void;
}

const Toolbar = ({ onOpenPaperSettings, onOpenTemplateModal, onOpenSetup }: ToolbarProps) => {
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
        <button className="rail-btn rail-btn-inert" disabled title="CSV batch printing — coming soon">
          <IconUpload />
          <span>Batch CSV</span>
          <em className="soon-badge">Soon</em>
        </button>
      </div>

      <div className="rail-group rail-group-bottom">
        <button className="rail-btn rail-btn-inert" disabled title="Light theme — coming soon">
          <IconSun />
          <span>Theme</span>
        </button>
        <button className="rail-btn" onClick={onOpenSetup} title="Printer settings">
          <IconGear />
          <span>Settings</span>
        </button>
      </div>
    </nav>
  );
};

export default Toolbar;
