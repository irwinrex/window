// src/pages/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Upload, Edit3, Plus } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle.jsx';

const Tile = ({ title, onClick, Icon, iconColor }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
    className="cursor-pointer rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all shadow-md p-8 text-center text-gray-900 dark:text-gray-100 animate-fade group"
  >
    <Icon className={`mx-auto mb-4 h-8 w-8 ${iconColor} group-hover:scale-110 transition-transform`} />
    <span className="text-base font-semibold">{title}</span>
  </div>
);

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-900 transition-colors duration-500 text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center px-4 py-10 relative">
      <ThemeToggle />
      <h1 className="text-3xl md:text-4xl font-bold mb-12 animate-slide text-center tracking-tight">
        Secure Server Manager
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-8 w-full max-w-5xl">
        <Tile
          title="Fetch File"
          Icon={Download}
          iconColor="text-blue-500 dark:text-blue-400"
          onClick={() => navigate('/fetch')}
        />
        <Tile
          title="Update File"
          Icon={Upload}
          iconColor="text-green-500 dark:text-green-400"
          onClick={() => navigate('/update')}
        />
        <Tile
          title="Edit File"
          Icon={Edit3}
          iconColor="text-purple-500 dark:text-purple-400"
          onClick={() => navigate('/edit')}
        />
        <Tile
          title="Add Server"
          Icon={Plus}
          iconColor="text-orange-500 dark:text-orange-400"
          onClick={() => navigate('/add-server')}
        />
      </div>
    </div>
  );
}
