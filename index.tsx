import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import './src/index.css';
import '@fontsource/assistant';
import '@fontsource/frank-ruhl-libre';


import { ToastProvider } from './src/shared/context';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);
