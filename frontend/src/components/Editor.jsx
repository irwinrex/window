import Editor from "@monaco-editor/react";

export default function FileEditor({ value, onChange }) {
  return (
    <Editor
      height="70vh"
      language="javascript"
      theme="vs-dark"
      value={value}
      onChange={onChange}
    />
  );
}