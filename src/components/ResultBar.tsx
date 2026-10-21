import {formatTime} from './Header';
import { LayoutGrid, RotateCcw } from 'lucide-react';
export interface ResultBarProps {elapsedSeconds:number;mistakes:number;onNewPuzzle():void;onSameDifficulty():void}
export function ResultBar(p:ResultBarProps){return <div className="result-bar"><span>{formatTime(p.elapsedSeconds)} · {p.mistakes} mistakes</span><button onClick={p.onNewPuzzle}><RotateCcw className="icon"/>New puzzle</button><button onClick={p.onSameDifficulty}><LayoutGrid className="icon"/>Same difficulty</button></div>}
