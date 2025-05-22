import React, { useState } from "react";
import ThemeToggle from '../components/ThemeToggle.jsx';

const VaultFileEditor = () => {
  const [targetId, setTargetId] = useState("");
  const [remotePath, setRemotePath] = useState("");
  const [uploadContent, setUploadContent] = useState("");
  const [downloadContent, setDownloadContent] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);

  const getFilename = (path) => path.split("/").filter(Boolean).pop() || "";

  // Fetch file from downloads vault
  const fetchDownload = async () => {
    setError(""); setStatus("");
    if (!targetId || !remotePath) return setError("Target ID and Remote Path required");
    const filename = getFilename(remotePath);
    try {
      const res = await fetch(`http://localhost:8000/fetch-file/${targetId}?filename=${encodeURIComponent(filename)}`);
      if (!res.ok) throw new Error("Not found in downloads vault");
      setDownloadContent(await res.text());
      setStatus("Loaded from downloads vault");
    } catch (e) {
      setDownloadContent("");
      setError(e.message);
    }
  };

  // Fetch file from uploads vault
  const fetchUpload = async () => {
    setError(""); setStatus("");
    if (!targetId || !remotePath) return setError("Target ID and Remote Path required");
    const filename = getFilename(remotePath);
    try {
      const res = await fetch(`http://localhost:8000/fetch-uploaded-file/${targetId}?filename=${encodeURIComponent(filename)}`);
      if (!res.ok) throw new Error("Not found in uploads vault");
      setUploadContent(await res.text());
      setStatus("Loaded from uploads vault");
    } catch (e) {
      setUploadContent("");
      setError(e.message);
    }
  };

  // Download file from server and save to downloads vault
  const downloadToVault = async () => {
    setError(""); setStatus("");
    if (!targetId || !remotePath) return setError("Target ID and Remote Path required");
    const formData = new FormData();
    formData.append("remote_path", remotePath);
    try {
      const res = await fetch(`http://localhost:8000/download-file/${targetId}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Download to vault failed");
      setStatus("Downloaded from server and saved to downloads vault");
      await fetchDownload();
    } catch (e) {
      setError(e.message);
    }
  };

  // Save edited content to uploads vault
  const saveToUploads = async () => {
    setError(""); setStatus("");
    if (!targetId || !remotePath) return setError("Target ID and Remote Path required");
    const filename = getFilename(remotePath);
    try {
      const res = await fetch(`http://localhost:8000/update-file/${targetId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, content: uploadContent }),
      });
      if (!res.ok) throw new Error("Save to uploads vault failed");
      setStatus("Saved to uploads vault");
    } catch (e) {
      setError(e.message);
    }
  };

  // Publish (upload) file from uploads vault to server
  const publishToServer = async () => {
    setError(""); setStatus("");
    if (!targetId || !remotePath) return setError("Target ID and Remote Path required");
    const filename = `${targetId}_${getFilename(remotePath)}`;
    const formData = new FormData();
    formData.append("filename", filename);
    formData.append("remote_path", remotePath);
    try {
      const res = await fetch(`http://localhost:8000/upload-to-server/${targetId}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Publish to server failed");
      setStatus("Published to server");
    } catch (e) {
      setError(e.message);
    }
  };

  // Compare function
  const compareFiles = () => {
    if (downloadContent === uploadContent) return "No difference";
    // Simple diff: show both
    return (
      <div className="flex gap-4">
        <div className="w-1/2">
          <h4 className="font-bold">Downloaded</h4>
          <pre className="bg-gray-800 text-white p-2 rounded">{downloadContent}</pre>
        </div>
        <div className="w-1/2">
          <h4 className="font-bold">Uploaded</h4>
          <pre className="bg-gray-800 text-white p-2 rounded">{uploadContent}</pre>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-stretch justify-stretch bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500 relative">
      <ThemeToggle />
      {/* Alerts: show only when error or status, and as VSCode-style toast at bottom right */}
      {error && (
        <div className="fixed bottom-8 right-8 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg font-semibold animate-fade">
          {error}
        </div>
      )}
      {status && (
        <div className="fixed bottom-8 right-8 z-40 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg font-semibold animate-fade">
          {status}
        </div>
      )}
      <div className="flex-1 flex flex-col w-full h-[calc(100vh-0px)]">
        <div className="flex-1 flex flex-col w-full h-full max-h-full">
          <div className="w-full h-full flex flex-col gap-0 bg-gray-100 dark:bg-gray-800 rounded-none shadow-none border-0">
            <div className="flex flex-col md:flex-row gap-4 p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <input
                placeholder="Target ID"
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
                className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                placeholder="Remote Path (e.g. /opt/secrets/secrets.env)"
                value={remotePath}
                onChange={e => setRemotePath(e.target.value)}
                className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex gap-2 items-center">
                <button onClick={fetchDownload} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition">View Download</button>
                <button onClick={fetchUpload} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow transition">View Upload</button>
                <button onClick={downloadToVault} className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg shadow transition">Download to Vault</button>
              </div>
            </div>
            <div className="flex-1 flex flex-row w-full h-full overflow-hidden">
              {/* Downloaded Section */}
              <div className="flex-1 flex flex-col h-full border-r border-gray-200 dark:border-gray-700 min-w-0">
                <div className="flex items-center justify-between px-6 pt-4 pb-2">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Downloaded</h3>
                  <span className="text-xs text-gray-400 dark:text-gray-500">Read-only</span>
                </div>
                <pre className="flex-1 overflow-auto bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-4 m-4 rounded-xl border border-gray-300 dark:border-gray-600 font-mono text-sm shadow-inner h-full min-h-[200px] max-h-[calc(100vh-250px)]">{downloadContent}</pre>
              </div>
              {/* Uploaded Section */}
              <div className="flex-1 flex flex-col h-full min-w-0">
                <div className="flex items-center justify-between px-6 pt-4 pb-2 sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Uploaded (Editable)</h3>
                  <div className="flex gap-2">
                    <button onClick={saveToUploads} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded shadow transition text-sm">Save</button>
                    <button onClick={publishToServer} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-1.5 rounded shadow transition text-sm">Publish</button>
                  </div>
                </div>
                <textarea
                  value={uploadContent}
                  onChange={e => setUploadContent(e.target.value)}
                  className="flex-1 w-full h-full min-h-[200px] max-h-[calc(100vh-250px)] p-4 m-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 shadow resize-none"
                  style={{fontFamily: 'Fira Mono, Menlo, Monaco, Consolas, monospace'}}
                />
              </div>
            </div>
            {/* Compare Section Modern Minimal */}
            <div className="flex flex-row w-full border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6 py-2">
              <div className="flex-1 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Compare:</span> {downloadContent === uploadContent ? <span className="text-green-500">No difference</span> : <span className="text-red-500">Changed</span>}
              </div>
              <div className="flex-1 text-right text-xs text-gray-400 dark:text-gray-500">
                {downloadContent && uploadContent && downloadContent !== uploadContent && (
                  <span>Files differ. Review before publishing.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaultFileEditor;