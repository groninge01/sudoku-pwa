import { Sheet } from './Sheet.tsx';

export interface ConfirmSheetProps {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm(): void;
  onClose(): void;
}

/** A small modal that asks before discarding entries or notes. */
export function ConfirmSheet(p: ConfirmSheetProps) {
  return (
    <Sheet label={p.title} onClose={p.onClose} className="confirm-sheet">
      <h2>{p.title}</h2>
      <p>{p.body}</p>
      <div className="sheet-actions">
        <button type="button" className="button button--secondary" onClick={p.onClose}>
          {p.cancelLabel ?? 'Keep playing'}
        </button>
        <button type="button" className="button button--primary" autoFocus onClick={p.onConfirm}>
          {p.confirmLabel}
        </button>
      </div>
    </Sheet>
  );
}
