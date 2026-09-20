import { IconMinus, IconPlus, IconPrinter } from './icons';
import './ActionBar.css';

const MIN_COPIES = 1;
const MAX_COPIES = 99;

interface ActionBarProps {
  copies: number;
  onCopiesChange: (copies: number) => void;
  onPrint: () => void;
  isPrinting?: boolean;
}

const ActionBar = ({ copies, onCopiesChange, onPrint, isPrinting }: ActionBarProps) => {
  const decrement = () => {
    onCopiesChange(Math.max(MIN_COPIES, copies - 1));
  };

  const increment = () => {
    onCopiesChange(Math.min(MAX_COPIES, copies + 1));
  };

  return (
    <div className="action-bar">
      <div className="copies-stepper" title="Number of copies to print">
        <button
          type="button"
          onClick={decrement}
          disabled={copies <= MIN_COPIES}
          aria-label="Decrease copies"
        >
          <IconMinus />
        </button>
        <span>{copies}</span>
        <button
          type="button"
          onClick={increment}
          disabled={copies >= MAX_COPIES}
          aria-label="Increase copies"
        >
          <IconPlus />
        </button>
      </div>

      <button className="action-bar-print" onClick={onPrint} disabled={isPrinting}>
        <IconPrinter size={17} />
        {isPrinting ? 'Printing...' : copies > 1 ? `Print ${copies} Stickers` : 'Print Sticker'}
      </button>
    </div>
  );
};

export default ActionBar;
