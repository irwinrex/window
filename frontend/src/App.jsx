import React from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

const Tile = ({ title, onClick, color, icon }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer rounded-2xl shadow-lg p-6 text-white text-center font-semibold text-lg hover:scale-105 transition-all duration-300 ${color} animate-fade`}
  >
    <div className="text-4xl mb-3">{icon}</div>
    {title}
  </div>
);

export default function App() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-blue-700 mb-8 animate-slide">Secure Server Manager</h1>
      <div className="grid grid-cols-2 gap-6 w-full max-w-3xl">
        <Tile title="Fetch File" color="bg-blue-500 hover:bg-blue-600" icon="📥" onClick={() => navigate('/fetch')} />
        <Tile title="Update File" color="bg-green-500 hover:bg-green-600" icon="📤" onClick={() => navigate('/update')} />
        <Tile title="Edit File" color="bg-purple-500 hover:bg-purple-600" icon="📝" onClick={() => navigate('/edit')} />
        <Tile title="Add Server" color="bg-orange-500 hover:bg-orange-600" icon="➕" onClick={() => navigate('/add-server')} />
      </div>
    </div>
  );
}
