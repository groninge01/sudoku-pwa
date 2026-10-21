import type { Settings } from '../state/settings.ts';
import { Sheet } from './Sheet.tsx';
import { X } from 'lucide-react';

export interface SettingsSheetProps {
  settings: Settings;
  onChange(next: Settings): void;
  onClose(): void;
}

export function SettingsSheet({ settings, onChange, onClose }: SettingsSheetProps) {
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
    <Sheet label="Settings" onClose={onClose} className="settings-sheet">
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
    </Sheet>
  );
}
