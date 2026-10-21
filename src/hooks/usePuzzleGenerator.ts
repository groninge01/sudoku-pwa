import { useCallback, useEffect, useRef } from 'react';
import type { Difficulty } from '../lib/sudoku/types.ts';
export function usePuzzleGenerator(onProgress?: (text: string) => void) {
 const worker = useRef<Worker | null>(null); const serial = useRef(0); const pending = useRef(new Map<number,{resolve:(v:{puzzle:number[];solution:number[]})=>void;reject:(e:Error)=>void}>());
 useEffect(()=>{const w=new Worker(new URL('../worker/generator.worker.ts',import.meta.url),{type:'module'}); worker.current=w; w.onmessage=(e:MessageEvent)=>{const m=e.data; if(m.type==='progress'){onProgress?.(`Generating… attempt ${m.attempt} (best tier ${m.bestTier})`);return} const p=pending.current.get(m.id);if(!p)return;pending.current.delete(m.id);if(m.type==='error')p.reject(new Error(m.message));else p.resolve({puzzle:m.puzzle,solution:m.solution});};return()=>{w.terminate();worker.current=null;pending.current.forEach(p=>p.reject(new Error('Generator closed')));pending.current.clear();}},[onProgress]);
 const generate=useCallback((difficulty:Difficulty)=>new Promise<{puzzle:number[];solution:number[]}>((resolve,reject)=>{const id=++serial.current;pending.current.set(id,{resolve,reject});worker.current?.postMessage({id,difficulty,seed:crypto.getRandomValues(new Uint32Array(1))[0]});}),[]);
 return {generate};
}
