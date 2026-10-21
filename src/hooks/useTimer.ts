import { useEffect, useState } from 'react';
export function useTimer({ running, onTick }: { running: boolean; onTick?: () => void }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const start = Date.now() - elapsedSeconds * 1000;
    const id = window.setInterval(() => { setElapsedSeconds(Math.floor((Date.now() - start) / 1000)); onTick?.(); }, 1000);
    return () => window.clearInterval(id);
  }, [running, onTick]);
  return elapsedSeconds;
}
