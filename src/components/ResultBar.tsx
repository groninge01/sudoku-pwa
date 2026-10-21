import {formatTime} from './Header';
import { GridIcon, RestartIcon } from './icons.tsx';
export interface ResultBarProps {elapsedSeconds:number;mistakes:number;onNewPuzzle():void;onSameDifficulty():void}
export function ResultBar(p:ResultBarProps){return <div className="result-bar"><span>{formatTime(p.elapsedSeconds)} · {p.mistakes} mistakes</span><button onClick={p.onNewPuzzle}><RestartIcon className="icon"/>New puzzle</button><button onClick={p.onSameDifficulty}><GridIcon className="icon"/>Same difficulty</button></div>}
