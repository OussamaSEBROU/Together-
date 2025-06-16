// client/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Import the CSS file
import App from './App'; // Import your main App component
// Removed: import reportWebVitals from './reportWebVitals'; // THIS LINE IS DELETED

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Removed: If you want to start measuring performance in your app, pass a function
// Removed: to log results (for example: reportWebVitals(console.log))
// Removed: or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// Removed: reportWebVitals(); // THIS LINE IS DELETED
