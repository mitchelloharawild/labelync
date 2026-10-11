import { useState } from 'react';
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
  // Text being typed into the copies field; null when not editing. Kept
  // separate so the field can be briefly empty without resetting copies.
  const [draft, setDraft] = useState<string | null>(null);

  const decrement = () => {
    onCopiesChange(Math.max(MIN_COPIES, copies - 1));
  };

  const increment = () => {
    onCopiesChange(Math.min(MAX_COPIES, copies + 1));
  };

  const handleInputChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, String(MAX_COPIES).length);
    setDraft(digits);
    const parsed = parseInt(digits, 10);
    if (!Number.isNaN(parsed)) {
      onCopiesChange(Math.min(MAX_COPIES, Math.max(MIN_COPIES, parsed)));
    }
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
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label="Number of copies"
          value={draft ?? String(copies)}
          onFocus={(e) => {
            setDraft(String(copies));
            e.target.select();
          }}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={() => setDraft(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur();
          }}
        />
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
