import { useState } from 'react';
import Editor from './components/Editor';

function App() {
  const [content, setContent] = useState("// edit here\n");
  const [remotePath, setRemotePath] = useState("/tmp/output.txt");

  const handlePublish = async () => {
    const formData = new FormData();
    formData.append("content", content);
    formData.append("remote_path", remotePath);

    const res = await fetch("http://backend:8000/publish", {
      method: "POST",
      body: formData,
    });
    const result = await res.json();
    alert(result.status);
  };

  return (
    <div>
      <input value={remotePath} onChange={e => setRemotePath(e.target.value)} />
      <Editor value={content} onChange={setContent} />
      <button onClick={handlePublish}>Publish</button>
    </div>
  );
}

export default App;