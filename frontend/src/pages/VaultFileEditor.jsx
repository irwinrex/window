// src/pages/VaultFileEditor.jsx
import React, { useState, useEffect, useCallback } from "react";
import ThemeToggle from "../components/ThemeToggle";
import { CodeiumEditor } from "@codeium/react-code-editor";
import {
  FiEdit2,
  FiSave,
  FiUpload,
  FiDownload,
  FiAlertTriangle,
  FiCheckCircle,
  FiCopy,
  FiFileText,
  FiGitMerge,
  FiLoader,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiArrowDown,
  FiEye, // For "Show Diff" alternative icon
} from "react-icons/fi";
import Tooltip from "../components/Tooltip"; // Ensure this is the updated Tooltip component with higher z-index

// Helper: map extension to language (remains the same)
const extensionToLanguage = (filename) => {
  if (!filename) return "plaintext";
  const ext = filename.split(".").pop().toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "py":
      return "python";
    case "json":
      return "json";
    case "env":
      return "dotenv";
    case "sh":
      return "shell";
    case "yml":
    case "yaml":
      return "yaml";
    case "md":
      return "markdown";
    case "html":
      return "html";
    case "css":
      return "css";
    case "scss":
      return "scss";
    case "xml":
      return "xml";
    case "go":
      return "go";
    case "java":
      return "java";
    case "c":
      return "c";
    case "cpp":
      return "cpp";
    case "rs":
      return "rust";
    case "php":
      return "php";
    case "rb":
      return "ruby";
    case "pl":
      return "perl";
    case "sql":
      return "sql";
    case "ini":
      return "ini";
    case "toml":
      return "toml";
    default:
      return "plaintext";
  }
};

// Styled Button Component for consistency
const ActionButton = ({
  onClick,
  children,
  Icon,
  tooltipText,
  className = "",
  isLoading = false,
  variant = "primary",
  size = "md",
  ...props
}) => {
  const baseStyle =
    "flex items-center justify-center gap-2 font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-150 ease-in-out";
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  const variantStyles = {
    primary:
      "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed",
    secondary:
      "bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 focus:ring-gray-500 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed",
    success:
      "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed",
    warning:
      "bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-400 disabled:bg-amber-300 disabled:cursor-not-allowed",
    danger:
      "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 disabled:bg-red-400 disabled:cursor-not-allowed",
    ghost:
      "bg-transparent hover:bg-gray-500/10 text-gray-600 dark:text-gray-300 dark:hover:text-white focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed",
  };
  const content = (
    <>
      {" "}
      {isLoading ? (
        <FiLoader className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
      ) : (
        Icon && <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      )}{" "}
      {children && (
        <span className={Icon || isLoading ? "hidden sm:inline" : ""}>
          {children}
        </span>
      )}{" "}
    </>
  );
  // Pass className to Tooltip for potential z-index adjustments on the wrapper if needed
  const button = (
    <button
      onClick={onClick}
      disabled={isLoading || props.disabled}
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {" "}
      {content}{" "}
    </button>
  );
  return tooltipText ? (
    <Tooltip text={tooltipText} wrapperClassName="inline-block">
      {button}
    </Tooltip>
  ) : (
    button
  );
};

const VaultFileEditor = () => {
  const [targetId, setTargetId] = useState("");
  const [remotePath, setRemotePath] = useState("");
  const [uploadContent, setUploadContent] = useState("");
  const [downloadContent, setDownloadContent] = useState("");
  const [status, setStatus] = useState({ message: "", type: "info" });
  const [isLoading, setIsLoading] = useState({});
  const [isDiffVisible, setIsDiffVisible] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("light");

  useEffect(() => {
    const updateTheme = () => {
      setCurrentTheme(
        document.documentElement.classList.contains("dark")
          ? "vs-dark"
          : "light"
      );
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const handleApiCall = async (actionKey, apiFn, successMessage) => {
    setIsLoading((prev) => ({ ...prev, [actionKey]: true }));
    setStatus({ message: "", type: "info" });
    try {
      await apiFn();
      setStatus({ message: successMessage, type: "success" });
    } catch (e) {
      console.error(`API Call Error (${actionKey}):`, e);
      setStatus({ message: e.message || "An error occurred", type: "error" });
    } finally {
      setIsLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const getFilename = (path) => path.split("/").filter(Boolean).pop() || "";

  const fetchDownload = async () => {
    if (!targetId || !remotePath) {
      setStatus({
        message: "Target ID and Remote Path required",
        type: "error",
      });
      return Promise.reject(new Error("Input missing"));
    }
    const filename = getFilename(remotePath);
    const res = await fetch(
      `http://localhost:8000/fetch-file/${targetId}?filename=${encodeURIComponent(
        filename
      )}`
    );
    if (!res.ok) {
      setDownloadContent("");
      throw new Error("File not found in downloads vault");
    }
    setDownloadContent(await res.text());
  };

  const fetchUpload = async () => {
    if (!targetId || !remotePath) {
      setStatus({
        message: "Target ID and Remote Path required",
        type: "error",
      });
      return Promise.reject(new Error("Input missing"));
    }
    const filename = getFilename(remotePath);
    const res = await fetch(
      `http://localhost:8000/fetch-uploaded-file/${targetId}?filename=${encodeURIComponent(
        filename
      )}`
    );
    if (!res.ok) {
      setUploadContent("");
      throw new Error("File not found in uploads vault");
    }
    setUploadContent(await res.text());
  };

  const downloadToVault = async () => {
    if (!targetId || !remotePath) {
      setStatus({
        message: "Target ID and Remote Path required",
        type: "error",
      });
      return Promise.reject(new Error("Input missing"));
    }
    const formData = new FormData();
    formData.append("remote_path", remotePath);
    const res = await fetch(`http://localhost:8000/download-file/${targetId}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Download from server to vault failed");
    await fetchDownload();
  };

  const saveToUploads = async () => {
    if (!targetId || !remotePath) {
      setStatus({
        message: "Target ID and Remote Path required",
        type: "error",
      });
      return Promise.reject(new Error("Input missing"));
    }
    const filename = getFilename(remotePath);
    const res = await fetch(`http://localhost:8000/update-file/${targetId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, content: uploadContent }),
    });
    if (!res.ok) throw new Error("Save to uploads vault failed");
  };

  const publishToServer = async () => {
    if (!targetId || !remotePath) {
      setStatus({
        message: "Target ID and Remote Path required",
        type: "error",
      });
      return Promise.reject(new Error("Input missing"));
    }
    const filename = `${targetId}_${getFilename(remotePath)}`;
    const formData = new FormData();
    formData.append("filename", filename);
    formData.append("remote_path", remotePath);
    const res = await fetch(
      `http://localhost:8000/upload-to-server/${targetId}`,
      { method: "POST", body: formData }
    );
    if (!res.ok) throw new Error("Publish to server failed");
  };

  const handleCopyToEditor = () => {
    setUploadContent(downloadContent);
    setStatus({
      message: "Copied Live Version to Editable Version.",
      type: "info",
    });
  };

  const copyToClipboard = (content, type) => {
    if (!content) {
      setStatus({ message: `No ${type} content to copy.`, type: "info" });
      return;
    }
    navigator.clipboard
      .writeText(content)
      .then(() =>
        setStatus({ message: `${type} content copied!`, type: "success" })
      )
      .catch(() =>
        setStatus({ message: `Failed to copy ${type} content.`, type: "error" })
      );
  };

  // const renderDiffLines = (linesA, linesB, type) => {
  //   const maxLen = Math.max(linesA.length, linesB.length);
  //   return Array.from({ length: maxLen }).map((_, i) => {
  //     const lineA = linesA[i] === undefined ? "" : linesA[i];
  //     const lineB = linesB[i] === undefined ? "" : linesB[i];
  //     const changed = lineA !== lineB;
  //     let className = "px-2 py-0.5 block";
  //     if (changed) {
  //       className +=
  //         type === "A"
  //           ? "bg-red-500/10 text-red-700 dark:text-red-400"
  //           : "bg-green-500/10 text-green-700 dark:text-green-400";
  //     } else {
  //       className += "text-gray-600 dark:text-gray-400";
  //     }
  //     return (
  //       <span key={i} className={className}>
  //         {type === "A" ? lineA || "\u00A0" : lineB || "\u00A0"}
  //       </span>
  //     );
  //   });
  // };

  const renderDiffLines = (linesA, linesB, type) => {
  const maxLen = Math.max(linesA.length, linesB.length);

  return Array.from({ length: maxLen }).map((_, i) => {
    const lineA = linesA[i] ?? ""; // Safe fallback
    const lineB = linesB[i] ?? "";
    const changed = lineA !== lineB;

    let className = "px-2 py-0.5 block whitespace-pre-wrap break-words"; // Ensure wrapping and block layout

    if (changed) {
      className +=
        type === "A"
          ? " bg-red-500/10 text-red-700 dark:text-red-400"
          : " bg-green-500/10 text-green-700 dark:text-green-400";
    } else {
      className += " text-gray-600 dark:text-gray-400";
    }

    // Show the appropriate line with preserved formatting
    const lineContent = type === "A" ? lineA : lineB;

    return (
      <span key={i} className={className}>
        {lineContent || "\u00A0"}
      </span>
    );
  });
};

  useEffect(() => {
    if (status.message) {
      const timer = setTimeout(
        () => setStatus({ message: "", type: "info" }),
        4000
      );
      return () => clearTimeout(timer);
    }
  }, [status]);

  const editorOptions = {
    minimap: { enabled: false },
    wordWrap: "on",
    scrollBeyondLastLine: false,
    automaticLayout: true,
  };
  const readOnlyEditorOptions = {
    ...editorOptions,
    readOnly: true,
    domReadOnly: true,
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      {/* Header Bar: z-30 is important for tooltips from this header to potentially show above editor pane headers (z-20) */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm">
        {/* Left side of header: Inputs and main fetch actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 flex-1">
          <input
            placeholder="Target ID"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[100px] sm:min-w-[150px] flex-grow sm:flex-grow-0"
          />
          <input
            placeholder="Remote Path"
            value={remotePath}
            onChange={(e) => setRemotePath(e.target.value)}
            className="p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[200px] sm:min-w-[300px] flex-grow sm:flex-grow-0"
          />
          <div className="flex gap-2">
            <ActionButton
              onClick={() =>
                handleApiCall(
                  "fetchDownload",
                  fetchDownload,
                  "Fetched Live Version"
                )
              }
              Icon={FiDownload}
              tooltipText="Fetch Live Version (from Downloads Vault)"
              isLoading={isLoading.fetchDownload}
              variant="secondary"
            >
              Fetch Live
            </ActionButton>
            <ActionButton
              onClick={() =>
                handleApiCall(
                  "fetchUpload",
                  fetchUpload,
                  "Fetched Editable Version"
                )
              }
              Icon={FiUpload}
              tooltipText="Fetch Editable Version (from Uploads Vault)"
              isLoading={isLoading.fetchUpload}
              variant="secondary"
            >
              Fetch Edit
            </ActionButton>
          </div>
        </div>
        {/* Right side of header: Pull, Diff Toggle, Theme Toggle */}
        <div className="flex items-center gap-2">
          <ActionButton
            onClick={() =>
              handleApiCall(
                "downloadToVault",
                downloadToVault,
                "Pulled Latest from Server to Vault"
              )
            }
            Icon={FiArrowDown}
            tooltipText="Pull Latest from Server (to Downloads Vault)"
            isLoading={isLoading.downloadToVault}
            variant="secondary"
          >
            Pull Latest
          </ActionButton>
          {/* Diff Toggle Button MOVED to header */}
          <ActionButton
            onClick={() => setIsDiffVisible(!isDiffVisible)}
            Icon={isDiffVisible ? FiX : FiGitMerge} // Changed icon for "Show Diff"
            variant="ghost"
            size="md" // Make it same size as other header buttons
            tooltipText={
              isDiffVisible ? "Hide Diff View" : "Show Difference View"
            }
            disabled={downloadContent === uploadContent && !isDiffVisible}
            className={isDiffVisible ? "bg-indigo-100 dark:bg-indigo-900" : ""} // Active state
          >
            <span className="hidden lg:inline">
              {isDiffVisible ? "Hide Diff" : "Show Diff"}
            </span>
          </ActionButton>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden p-2 sm:p-4">
        {/* Downloaded Section (Live Version) */}
        <section className="flex-1 flex flex-col min-w-0 lg:border-r lg:border-gray-200 dark:lg:border-gray-700/60 pb-4 lg:pb-0 lg:pr-2">
          {/* Pane Header: z-20 */}
          <div className="flex items-center justify-between px-2 py-2 sticky top-[calc(3.5rem+1px)] lg:top-0 z-20 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 mb-2 rounded-t-lg">
            <h3 className="font-semibold text-base flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <FiFileText /> Live Version (Read-only)
            </h3>
            <div className="flex items-center gap-2">
              <Tooltip text="Copy content">
                <ActionButton
                  onClick={() => copyToClipboard(downloadContent, "Live")}
                  Icon={FiCopy}
                  size="sm"
                  variant="ghost"
                  disabled={!downloadContent}
                />
              </Tooltip>
              <Tooltip text="Copy Live to Editable Version">
                <ActionButton
                  onClick={handleCopyToEditor}
                  Icon={FiEdit2}
                  size="sm"
                  variant="ghost"
                  disabled={!downloadContent}
                />
              </Tooltip>
            </div>
          </div>
          <div className="flex-1 min-h-0 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 shadow-inner overflow-hidden">
            <div className="w-full h-[93vh] overflow-auto">
              <CodeiumEditor
                value={downloadContent}
                language={extensionToLanguage(getFilename(remotePath))}
                theme={currentTheme}
                options={readOnlyEditorOptions}
                className="w-full h-[70vh] !font-mono !text-sm"
                disableFactoryWidget={true}
              />
            </div>
          </div>
        </section>

        {/* Uploaded Section (Editable Version) */}
        <section className="flex-1 flex flex-col min-w-0 pt-4 lg:pt-0 lg:pl-2">
          {/* Pane Header: z-20 */}
          <div className="flex items-center justify-between px-2 py-2 sticky top-[calc(3.5rem+1px)] lg:top-0 z-20 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 mb-2 rounded-t-lg">
            <h3 className="font-semibold text-base flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <FiEdit2 /> Editable Version
            </h3>
            <div className="flex items-center gap-2">
              <Tooltip text="Copy content">
                <ActionButton
                  onClick={() => copyToClipboard(uploadContent, "Editable")}
                  Icon={FiCopy}
                  size="sm"
                  variant="ghost"
                  disabled={!uploadContent}
                />
              </Tooltip>
              <ActionButton
                onClick={() =>
                  handleApiCall(
                    "saveToUploads",
                    saveToUploads,
                    "Saved to Uploads Vault"
                  )
                }
                Icon={FiSave}
                tooltipText="Save to Uploads Vault (Local Cache)"
                isLoading={isLoading.saveToUploads}
                variant="secondary"
                size="sm"
                disabled={!uploadContent}
              >
                Save
              </ActionButton>
              <ActionButton
                onClick={() =>
                  handleApiCall(
                    "publishToServer",
                    publishToServer,
                    "Published to Server"
                  )
                }
                Icon={FiUpload}
                tooltipText="Publish to Server"
                isLoading={isLoading.publishToServer}
                variant="success"
                size="sm"
                disabled={!uploadContent}
              >
                Publish
              </ActionButton>
            </div>
          </div>
          <div className="flex-1 min-h-0 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 shadow-inner overflow-hidden">
            <div className="w-full h-[93vh] overflow-auto">
              <CodeiumEditor
                value={uploadContent}
                language={extensionToLanguage(getFilename(remotePath))}
                theme={currentTheme}
                onChange={setUploadContent}
                options={editorOptions}
                className="w-full h-[70vh] !font-mono !text-sm"
                disableFactoryWidget={true}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer: Simplified, only shows comparison text */}
      <footer className="px-4 py-2 border-t border-gray-200 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md flex items-center justify-start text-xs">
        <div>
          {" "}
          <span className="font-medium">Comparison:</span>{" "}
          {downloadContent === uploadContent ? (
            <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
              <FiCheckCircle /> No difference
            </span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <FiAlertTriangle /> Files differ
            </span>
          )}{" "}
        </div>
      </footer>

      {/* Diff View Modal (z-40) */}
      {isDiffVisible && (
        <div className="fixed inset-0 z-40 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FiGitMerge /> Difference View
              </h3>
              <ActionButton
                onClick={() => setIsDiffVisible(false)}
                Icon={FiX}
                variant="ghost"
                size="sm"
                tooltipText="Close Diff"
              />
            </div>
            {downloadContent !== uploadContent ? (
              <div className="flex-1 flex flex-col md:flex-row gap-0 overflow-auto p-4">
                <div className="flex-1 md:border-r dark:md:border-gray-700 pr-0 md:pr-2">
                  <h4 className="font-medium text-sm mb-2 text-sky-600 dark:text-sky-400">
                    Live Version 1
                  </h4>
                  <pre className="text-xs font-mono whitespace-pre bg-gray-50 dark:bg-gray-800/50 p-2 rounded-md overflow-auto max-h-[65vh] h-[65vh] block">
                    {renderDiffLines(
                      downloadContent.split("\n"),
                      uploadContent.split("\n"),
                      "A"
                    )}
                  </pre>
                </div>
                <div className="flex-1 md:pl-0 md:pl-2 mt-4 md:mt-0">
                  <h4 className="font-medium text-sm mb-2 text-indigo-600 dark:text-indigo-400">
                    Editable Version
                  </h4>
                  <pre className="text-xs font-mono whitespace-pre bg-gray-50 dark:bg-gray-800/50 p-2 rounded-md overflow-auto max-h-[65vh] h-[65vh] block">
                    {renderDiffLines(
                      downloadContent.split("\n"),
                      uploadContent.split("\n"),
                      "B"
                    )}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-10 text-gray-500 dark:text-gray-400">
                No differences to show.
              </div>
            )}
            <div className="p-3 border-t dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              Lines highlighted in <span className="text-red-500">red</span> are
              from the Live Version,{" "}
              <span className="text-green-500">green</span> are from the
              Editable Version where they differ.
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications (z-[10000]) */}
      {status.message && (
        <div
          className={`fixed bottom-6 right-6 z-[10000] px-4 py-3 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2 animate-slide ${
            status.type === "success" ? "bg-green-600 text-white" : ""
          } ${status.type === "error" ? "bg-red-600 text-white" : ""} ${
            status.type === "info" ? "bg-sky-600 text-white" : ""
          } `}
        >
          {status.type === "success" && <FiCheckCircle className="h-5 w-5" />}{" "}
          {status.type === "error" && <FiAlertTriangle className="h-5 w-5" />}{" "}
          {status.type === "info" && <FiAlertTriangle className="h-5 w-5" />}
          {status.message}
          <button
            onClick={() => setStatus({ message: "", type: "info" })}
            className="ml-2 p-1 rounded-full hover:bg-black/20"
          >
            <FiX size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default VaultFileEditor;
