import { useEffect } from 'react';
import type { Settings, ThemePreference } from '../state/settings.ts';
import { CloseIcon, MoonIcon, MonitorIcon, SunIcon } from './icons.tsx';

export interface SettingsSheetProps {
  settings: Settings;
  onChange(next: Settings): void;
  onClose(): void;
}

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

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
            <CloseIcon className="icon" />
          </button>
        </div>

        <div>
          <div style={{ fontSize: '0.9rem', marginBottom: '6px' }}>Theme</div>
          <div className="theme-choice">
            {THEMES.map((theme) => (
              <button
                key={theme.value}
                className={settings.theme === theme.value ? 'is-active' : ''}
                aria-pressed={settings.theme === theme.value}
                onClick={() => onChange({ ...settings, theme: theme.value })}
              >
                {{ light: <SunIcon className="icon" />, dark: <MoonIcon className="icon" />, system: <MonitorIcon className="icon" /> }[theme.value]}{theme.label}
              </button>
            ))}
          </div>
        </div>

        {toggle('soundEffects')}
        {toggle('showTimer')}
        {toggle('highlightConflicts')}
        {toggle('autoRemoveNotes')}
      </section>
    </div>
  );
}
