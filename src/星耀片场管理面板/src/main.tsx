// Safe polyfill for read-only window.fetch getter in container/sandbox environment
(function() {
  var originalFetch = window.fetch;
  try {
    Object.defineProperty(window, 'fetch', {
      value: originalFetch,
      writable: true,
      configurable: true,
      enumerable: true
    });
  } catch (e) {
    try {
      Object.defineProperty(window, 'fetch', {
        get: function() { return originalFetch; },
        set: function(v) { originalFetch = v; },
        configurable: true,
        enumerable: true
      });
    } catch (e2) {
      try {
        Object.defineProperty(globalThis, 'fetch', {
          get: function() { return originalFetch; },
          set: function(v) { originalFetch = v; },
          configurable: true,
          enumerable: true
        });
      } catch (e3) {
        try {
          Object.defineProperty(Window.prototype, 'fetch', {
            get: function() { return originalFetch; },
            set: function(v) { originalFetch = v; },
            configurable: true,
            enumerable: true
          });
        } catch (e4) {
          try {
            Object.defineProperty(self, 'fetch', {
              get: function() { return originalFetch; },
              set: function(v) { originalFetch = v; },
              configurable: true,
              enumerable: true
            });
          } catch (e5) {}
        }
      }
    }
  }
})();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
