import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import App from './App';
import './index.css';

console.log('=== React App Starting ===');
console.log('Root element:', document.getElementById('root'));

if (window.location.pathname !== '/' && window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', `${window.location.origin}/${window.location.hash}`);
}

const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('Root element found, creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  console.log('React root created, rendering App...');
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
  console.log('App rendered successfully');
} else {
  console.error('ERROR: Root element not found! Check your public/index.html');
}
