import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/app.css';
try { const { registerSW } = await import('virtual:pwa-register'); registerSW({ immediate: true }); } catch {}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
