import { IconMinus, IconPlus, IconPrinter } from './icons';
import './ActionBar.css';

interface ActionBarProps {
  onPrint: () => void;
}

const ActionBar = ({ onPrint }: ActionBarProps) => {
  return (
    <div className="action-bar">
      <div className="copies-stepper" title="Multiple copies — coming soon">
        <button disabled>
          <IconMinus />
        </button>
        <span>1</span>
        <button disabled>
          <IconPlus />
        </button>
      </div>

      <button className="action-bar-print" onClick={onPrint}>
        <IconPrinter size={17} />
        Print Sticker
      </button>
    </div>
  );
};

export default ActionBar;
