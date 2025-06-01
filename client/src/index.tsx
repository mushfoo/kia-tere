import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Defensive check to avoid errors from injected/incomplete ethereum providers
if (
  typeof window !== 'undefined' &&
  window.ethereum &&
  typeof window.ethereum.selectedAddress === 'undefined'
) {
  // Optionally, you can set it to null or just ignore
  // window.ethereum.selectedAddress = null;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  throw new Error('Root element not found');
}
