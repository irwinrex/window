import React, { useState } from 'react';
import FileEditor from './components/Editor';
import './App.css';

function App() {
  const [targetId, setTargetId] = useState('');
  const [remotePath, setRemotePath] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');  // <-- error state

  const handleFetch = async () => {
    setError('');  // reset error on new try
    const formData = new FormData();
    formData.append("remote_path", remotePath);

    try {
      const res = await fetch(`http://localhost:8000/download-file/${targetId}`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error(`Failed to fetch file: ${res.statusText}`);
      const data = await res.json();
      if (data.content) setContent(data.content);
      setStatus(`Downloaded from ${remotePath}`);
    } catch (e) {
      setError(e.message);
    }
  };

  const handlePublish = async () => {
    setError('');
    const formData = new FormData();
    formData.append("content", content);
    formData.append("remote_path", remotePath);

    try {
      const res = await fetch(`http://localhost:8000/upload-file/${targetId}`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error(`Failed to publish file: ${res.statusText}`);
      const result = await res.json();
      setStatus(result.status);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto animate-fade">
      <h1 className="text-3xl font-bold mb-4 text-center text-blue-700 animate-slide">
        Secure File Window
      </h1>

      {/* Error popup */}
      {error && (
        <div className="bg-red-500 text-white p-3 rounded mb-4 shadow relative animate-fade">
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="absolute top-1 right-2 text-white font-bold"
            aria-label="Close error"
          >
            &times;
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2 mb-4 animate-fade">
        <input
          className="p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring focus:ring-blue-200"
          placeholder="Target ID"
          value={targetId}
          onChange={e => setTargetId(e.target.value)}
        />
        <input
          className="p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring focus:ring-blue-200"
          placeholder="Remote Path (e.g. /tmp/myfile.txt)"
          value={remotePath}
          onChange={e => setRemotePath(e.target.value)}
        />
        <div className="flex gap-4 mt-2">
          <button
            onClick={handleFetch}
            className="bg-blue-500 hover:bg-blue-600 transition duration-200 text-white px-4 py-2 rounded shadow"
          >
            Fetch
          </button>
          <button
            onClick={handlePublish}
            className="bg-green-500 hover:bg-green-600 transition duration-200 text-white px-4 py-2 rounded shadow"
          >
            Publish
          </button>
        </div>
      </div>
      <FileEditor value={content} onChange={setContent} />
      <p className="mt-4 text-sm text-gray-600 animate-fade">{status}</p>
    </div>
  );
}

export default App;
