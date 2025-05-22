import React, { useState } from 'react';

const AddServerPage = () => {
  const [formData, setFormData] = useState({
    target_id: '',
    bastion_host: '',
    target_host: '',
    username_bastion: '',
    username_target: '',
  });

  const [bastionKey, setBastionKey] = useState(null);
  const [targetKey, setTargetKey] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, keyType) => {
    const file = e.target.files[0];
    if (keyType === 'bastion') setBastionKey(file);
    if (keyType === 'target') setTargetKey(file);
  };

  const handleSubmit = async () => {
    setStatus('');
    setError('');

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => payload.append(key, value));

    if (bastionKey) payload.append('bastion_key_file', bastionKey);
    if (targetKey) payload.append('target_key_file', targetKey);

    try {
      const res = await fetch('http://localhost:8000/add-server', {
        method: 'POST',
        body: payload,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.detail || 'Failed to add server');
      }

      setStatus(result.status || 'Server added successfully');
    } catch (err) {
      console.error('Add server error:', err);
      setError(err.message || 'An unexpected error occurred');
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-gray-900 text-white rounded-lg shadow">
      <h2 className="text-2xl font-bold text-center text-green-400 mb-6">Add Server</h2>

      <div className="flex flex-col gap-4">
        {['target_id', 'bastion_host', 'target_host', 'username_bastion', 'username_target'].map((field) => (
          <input
            key={field}
            type="text"
            name={field}
            placeholder={field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            value={formData[field]}
            onChange={handleChange}
            className="p-2 border rounded bg-gray-800 border-gray-600"
          />
        ))}

        <div>
          <label className="text-sm text-gray-400">Bastion PEM File</label>
          <input
            type="file"
            accept=".pem"
            onChange={(e) => handleFileChange(e, 'bastion')}
            className="mt-1 block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">Target PEM File</label>
          <input
            type="file"
            accept=".pem"
            onChange={(e) => handleFileChange(e, 'target')}
            className="mt-1 block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition"
        >
          Add Server
        </button>

        {error && <p className="text-red-400 mt-2">{error}</p>}
        {status && <p className="text-green-400 mt-2">{status}</p>}
      </div>
    </div>
  );
};

export default AddServerPage;
