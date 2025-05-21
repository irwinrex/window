// src/pages/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Tile = ({ title, onClick, color, icon }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
    className={`cursor-pointer rounded-2xl shadow-xl p-6 text-white text-center font-semibold text-lg hover:scale-105 transition-transform duration-300 ease-in-out ${color} animate-fade`}
  >
    <div className="text-4xl mb-3">{icon}</div>
    <span>{title}</span>
  </div>
);

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-blue-700 mb-10 animate-slide">
        Secure Server Manager
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
        <Tile
          title="Fetch File"
          icon="📥"
          color="bg-blue-500 hover:bg-blue-600"
          onClick={() => navigate('/fetch')}
        />
        <Tile
          title="Update File"
          icon="📤"
          color="bg-green-500 hover:bg-green-600"
          onClick={() => navigate('/update')}
        />
        <Tile
          title="Edit File"
          icon="📝"
          color="bg-purple-500 hover:bg-purple-600"
          onClick={() => navigate('/edit')}
        />
        <Tile
          title="Add Server"
          icon="➕"
          color="bg-orange-500 hover:bg-orange-600"
          onClick={() => navigate('/add-server')}
        />
      </div>
    </div>
  );
}
