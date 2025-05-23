import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes.jsx';
// import ThemeToggle from './components/ThemeToggle';  // import here
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      {/* <ThemeToggle />      place it here so it’s always visible */}
      <AppRoutes />
    </BrowserRouter>
  );
}
