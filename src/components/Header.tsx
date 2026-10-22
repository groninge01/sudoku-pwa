import { Monitor, Moon, Settings, Sun } from 'lucide-react';

export interface HeaderProps {difficulty:string;elapsedSeconds:number;mistakes:number;showTimer:boolean;theme:'light'|'dark'|'system';onCycleTheme():void;onOpenSettings():void}
export function formatTime(s:number){const h=Math.floor(s/3600),m=Math.floor(s%3600/60),sec=s%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`}
export function Header(p: HeaderProps) {
  const ThemeIcon = p.theme === 'light' ? Sun : p.theme === 'dark' ? Moon : Monitor;
  return (
    <header className="game-header">
      <div className="game-header__stats">
        <span className="game-header__level">{p.difficulty}</span>
        {p.showTimer && <span>{formatTime(p.elapsedSeconds)}</span>}
        <span className="mistakes">{p.mistakes} {p.mistakes === 1 ? 'mistake' : 'mistakes'}</span>
      </div>
      <button className="icon-button" aria-label={`Theme: ${p.theme}. Click to change.`} onClick={p.onCycleTheme}><ThemeIcon className="icon" /></button>
      <button className="icon-button" aria-label="Settings" onClick={p.onOpenSettings}><Settings className="icon" /></button>
    </header>
  );
}
