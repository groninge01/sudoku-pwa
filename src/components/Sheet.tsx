import { useEffect, useRef, type ReactNode } from 'react';

export interface SheetProps {
  /** Accessible name of the dialog. */
  label: string;
  /** Extra class for the panel element ('settings-sheet', 'menu-sheet', …). */
  className?: string;
  /** Extra class for the backdrop ('sheet-backdrop--top' centres the dialog). */
  backdropClass?: string;
  onClose(): void;
  children: ReactNode;
}

const FOCUSABLE =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/**
 * Modal surface shared by every overlay: a bottom sheet on mobile and a
 * centred dialog on desktop (the CSS flips the layout at 560px). Handles
 * focus trapping, Escape and backdrop dismissal, and restores focus to
 * whatever opened it.
 */
export function Sheet({ label, className, backdropClass, onClose, children }: SheetProps) {
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    const restore = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const el = panel.current;
    const first = el?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? el)?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !el) return;
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!items.length) {
        event.preventDefault();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      restore?.focus();
    };
  }, [onClose]);

  return (
    <div className={`sheet-backdrop${backdropClass ? ` ${backdropClass}` : ''}`} onClick={onClose}>
      <section
        ref={panel}
        className={`sheet${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </section>
    </div>
  );
}
