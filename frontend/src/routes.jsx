// src/routes.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home.jsx';           // create this component (can be your Tile grid)
import FetchPage from './pages/FetchPage.jsx';
import UpdatePage from './pages/UpdatePage.jsx';
import EditPage from './pages/EditPage.jsx';
import AddServerPage from './pages/AddServerPage.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/fetch" element={<FetchPage />} />
      <Route path="/update" element={<UpdatePage />} />
      <Route path="/edit" element={<EditPage />} />
      <Route path="/add-server" element={<AddServerPage />} />
    </Routes>
  );
}
