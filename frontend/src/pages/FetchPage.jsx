import React, { useState } from 'react';

const FetchPage = () => {
  const [targetId, setTargetId] = useState('');
  const [remotePath, setRemotePath] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleFetch = async () => {
    setError('');
    setStatus('');
    const formData = new FormData();
    formData.append('remote_path', remotePath);

    try {
      const response = await fetch(`http://localhost:8000/download-file/${targetId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);

      const data = await response.json();
      if (data.content) {
        setContent(data.content);
        setStatus(`File fetched from ${remotePath}`);
      } else {
        throw new Error('No content received from server.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Fetch File</h2>

      {error && (
        <div className="bg-red-500 text-white p-3 rounded mb-4 shadow animate-shake">
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-4 mb-6">
        <input
          className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Target ID (Server)"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
        />
        <input
          className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Remote Path (e.g., /tmp/test.txt)"
          value={remotePath}
          onChange={(e) => setRemotePath(e.target.value)}
        />
        <button
          onClick={handleFetch}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Fetch File
        </button>
      </div>

      {status && <p className="text-green-600 mb-4">{status}</p>}

      {content && (
        <div className="bg-gray-800 text-gray-100 p-4 rounded overflow-auto whitespace-pre-wrap font-mono">
          {content}
        </div>
      )}
    </div>
  );
};

export default FetchPage;
