import { useEffect, useState } from 'react';
import { resolveTheme, type ThemePreference } from '../state/settings';
export function useTheme(preference: ThemePreference) {
  const [mode, setMode] = useState<ThemePreference>(preference);
  useEffect(() => setMode(preference), [preference]);
  useEffect(() => {
    const apply = () => { document.documentElement.dataset.theme = preference; };
    apply();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => { if (preference === 'system') { resolveTheme(preference); apply(); } };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [preference]);
  return { mode, setPreference: (next: ThemePreference) => setMode(next) };
}
