// src/routes.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home.jsx';
import AddServerPage from './pages/AddServerPage.jsx';
import VaultFileEditor from './pages/VaultFileEditor.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/fetch" element={<VaultFileEditor />} />
      <Route path="/add-server" element={<AddServerPage />} />
    </Routes>
  );
}
