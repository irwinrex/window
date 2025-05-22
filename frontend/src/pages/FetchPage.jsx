import React, { useState } from "react";

const FetchPage = () => {
  const [targetId, setTargetId] = useState("");
  const [remotePath, setRemotePath] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState("");

  const getFilename = (path) => {
    return path.split("/").filter(Boolean).pop() || "";
  };

  const downloadFile = async (targetId, remotePath) => {
    const url = `http://localhost:8000/download-file/${targetId}`;
    const formData = new FormData();
    formData.append("remote_path", remotePath);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Download failed: ${response.status} ${text}`);
    }
  };

  const fetchFileContent = async (targetId, filename) => {
    const url = `http://localhost:8000/fetch-file/${targetId}?filename=${encodeURIComponent(filename)}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) throw new Error("FileNotFound");
      throw new Error(`Fetch failed with status ${response.status}`);
    }

    return await response.text();
  };

  const updateFileContent = async (targetId, filename, newContent) => {
    const url = `http://localhost:8000/update-file/${targetId}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, content: newContent }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Update failed: ${response.status} ${text}`);
    }
  };

  const handleFetch = async () => {
    setError("");
    setStatus("");
    setContent("");
    setEditMode(false);

    if (!targetId.trim() || !remotePath.trim()) {
      setError("Target ID and Remote Path are required");
      return;
    }

    const filename = getFilename(remotePath);
    if (!filename) {
      setError("Invalid remote path, cannot extract filename");
      return;
    }

    try {
      setStatus("Checking Vault for file...");
      const fileContent = await fetchFileContent(targetId, filename);
      setContent(fileContent);
      setStatus(`File loaded from Vault: ${filename}`);
    } catch {
      setStatus("File not found. Downloading...");
      try {
        await downloadFile(targetId, remotePath);
        const fileContent = await fetchFileContent(targetId, filename);
        setContent(fileContent);
        setStatus(`File loaded after download: ${filename}`);
      } catch (err) {
        setError(err.message || "Download failed");
        setStatus("");
      }
    }
  };

  const handleSave = async () => {
    const filename = getFilename(remotePath);
    try {
      await updateFileContent(targetId, filename, editedContent);
      setContent(editedContent);
      setEditMode(false);
      setStatus("File updated successfully");
    } catch (err) {
      setError(err.message || "Update failed");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Fetch & Edit File</h2>

      {error && <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>}

      <div className="flex flex-col gap-4 mb-6">
        <input
          placeholder="Target ID (Server)"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          placeholder="Remote Path (e.g., /opt/secrets/secrets.env)"
          value={remotePath}
          onChange={(e) => setRemotePath(e.target.value)}
          className="p-2 border rounded"
        />
        <button
          onClick={handleFetch}
          className="bg-blue-600 text-white py-2 rounded"
        >
          Fetch File
        </button>
      </div>

      {status && <p className="text-green-600 mb-4">{status}</p>}

      {content && !editMode && (
        <>
          <pre className="bg-gray-800 text-white p-4 rounded whitespace-pre-wrap overflow-auto">
            {content}
          </pre>
          <button
            onClick={() => {
              setEditedContent(content);
              setEditMode(true);
            }}
            className="mt-4 bg-yellow-500 text-white px-4 py-2 rounded"
          >
            Edit
          </button>
        </>
      )}

      {editMode && (
        <div className="flex flex-col gap-3">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-64 p-4 rounded bg-gray-800 text-white font-mono"
          />
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Save
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FetchPage;
