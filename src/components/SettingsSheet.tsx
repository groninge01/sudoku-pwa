import { useEffect } from 'react';
import type { Settings } from '../state/settings.ts';
import { X } from 'lucide-react';

export interface SettingsSheetProps {
  settings: Settings;
  onChange(next: Settings): void;
  onClose(): void;
}

export function SettingsSheet({ settings, onChange, onClose }: SettingsSheetProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggle = (key: 'soundEffects' | 'showTimer' | 'highlightConflicts' | 'autoRemoveNotes') => (
    <label key={key}>
      {{
        soundEffects: 'Sound effects',
        showTimer: 'Show timer',
        highlightConflicts: 'Highlight conflicts',
        autoRemoveNotes: 'Auto-remove notes',
      }[key]}
      <input
        type="checkbox"
        checked={settings[key]}
        onChange={(event) => onChange({ ...settings, [key]: event.target.checked })}
      />
    </label>
  );

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section
        className="settings-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2>Settings</h2>
          <button onClick={onClose} aria-label="Close settings">
            <X className="icon" />
          </button>
        </div>

        {toggle('soundEffects')}
        {toggle('showTimer')}
        {toggle('highlightConflicts')}
        {toggle('autoRemoveNotes')}
      </section>
    </div>
  );
}
