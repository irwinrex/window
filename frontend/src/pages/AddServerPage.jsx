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
    if (keyType === 'bastion') {
      setBastionKey(file);
    } else if (keyType === 'target') {
      setTargetKey(file);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setStatus('');
    const payload = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      payload.append(key, value);
    });

    if (bastionKey) payload.append('bastion_key_file', bastionKey);
    if (targetKey) payload.append('target_key_file', targetKey);

    try {
      const res = await fetch('http://localhost:8000/add-server', {
        method: 'POST',
        body: payload,
      });

      if (!res.ok) throw new Error(`Add Server failed: ${res.statusText}`);
      const result = await res.json();
      setStatus(result.status || 'Server added successfully');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">Add Server</h2>

      <div className="flex flex-col gap-4">
        <input
          type="text"
          name="target_id"
          placeholder="Target ID"
          value={formData.target_id}
          onChange={handleChange}
          className="p-2 border rounded"
        />
        <input
          type="text"
          name="bastion_host"
          placeholder="Bastion Host"
          value={formData.bastion_host}
          onChange={handleChange}
          className="p-2 border rounded"
        />
        <input
          type="text"
          name="target_host"
          placeholder="Target Host"
          value={formData.target_host}
          onChange={handleChange}
          className="p-2 border rounded"
        />
        <input
          type="text"
          name="username_bastion"
          placeholder="Bastion Username"
          value={formData.username_bastion}
          onChange={handleChange}
          className="p-2 border rounded"
        />
        <input
          type="text"
          name="username_target"
          placeholder="Target Username"
          value={formData.username_target}
          onChange={handleChange}
          className="p-2 border rounded"
        />
        <label className="text-sm text-gray-600">Bastion PEM File</label>
        <input
          type="file"
          accept=".pem"
          onChange={(e) => handleFileChange(e, 'bastion')}
          className="p-2 border rounded"
        />
        <label className="text-sm text-gray-600">Target PEM File</label>
        <input
          type="file"
          accept=".pem"
          onChange={(e) => handleFileChange(e, 'target')}
          className="p-2 border rounded"
        />

        <button
          onClick={handleSubmit}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
        >
          Add Server
        </button>

        {error && <p className="text-red-500 mt-2">{error}</p>}
        {status && <p className="text-green-600 mt-2">{status}</p>}
      </div>
    </div>
  );
};

export default AddServerPage;
