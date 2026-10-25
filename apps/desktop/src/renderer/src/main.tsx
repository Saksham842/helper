import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('[Renderer] main.tsx entry point executing.');

window.addEventListener('error', (event) => {
  console.error('[Renderer uncaught error]:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Renderer unhandled rejection]:', event.reason);
});

const rootEl = document.getElementById('root');
if (rootEl) {
  try {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('[Renderer] React root mounted.');
  } catch (err) {
    console.error('[Renderer] FATAL: Failed rendering React root:', err);
  }
} else {
  console.error('[Renderer] FATAL: #root container element missing.');
}
