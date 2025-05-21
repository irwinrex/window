import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// function App() {
//   return <h1 style={{color:'green'}}>Hello from React + Vite!</h1>;
// }

console.log("React app starting...");

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);