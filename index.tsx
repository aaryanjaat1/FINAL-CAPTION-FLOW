
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Critical Application Start Failure:", error);
  rootElement.innerHTML = `
    <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: #000; color: #fff; font-family: sans-serif; text-align: center; padding: 20px;">
      <div>
        <h1 style="color: #ef4444;">SYSTEM BOOT ERROR</h1>
        <p style="opacity: 0.6;">Check browser console for trace.</p>
        <button onclick="window.location.reload()" style="background: #fff; color: #000; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; margin-top: 20px;">RETRY UPLINK</button>
      </div>
    </div>
  `;
}
