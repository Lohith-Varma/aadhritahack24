import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import './index.css';

const updateSW = registerSW({
  onNeedRefresh() {
    const confirmed = window.confirm(
      '🧵 Loom has an update ready. Reload to get the latest version?'
    );
    if (confirmed) updateSW(true);
  },
  onOfflineReady() {
    console.log('✅ Loom is ready to work offline');
  },
  onRegisteredSW(swUrl, registration) {
    console.log(`✅ Service Worker registered: ${swUrl}`);
    setInterval(() => {
      registration?.update();
    }, 60 * 60 * 1000);
  },
  onRegisterError(error) {
    console.error('❌ Service Worker registration failed:', error);
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
