// src/pages/AddServerPage.jsx
import React, { useState, useEffect } from 'react';
import ThemeToggle from '../components/ThemeToggle'; // Assuming global or consistently placed
import { useNavigate } from 'react-router-dom';
import Tooltip from '../components/Tooltip';
import { FiSave, FiUpload, FiCheckCircle, FiAlertTriangle, FiX, FiServer, FiFilePlus } from 'react-icons/fi'; // Added FiServer

// Reusable ActionButton (if not already in a shared components file)
// For brevity, I'll assume ActionButton is imported or defined as in VaultFileEditor
// If not, copy the ActionButton component definition here.
// For this example, I'll re-define a simplified version for clarity if it's not shared.
const ActionButton = ({ onClick, children, Icon, tooltipText, className = '', isLoading = false, variant = 'primary', size = 'md', ...props }) => {
  const baseStyle = "flex items-center justify-center gap-2 font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-150 ease-in-out";
  const sizeStyles = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  const variantStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 focus:ring-gray-500 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed',
  };
  const content = (<> {isLoading ? <FiUpload className="animate-spin h-4 w-4 sm:h-5 sm:w-5" /> : Icon && <Icon className="h-4 w-4 sm:h-5 sm:w-5" />} {children && <span>{children}</span>} </>);
  const button = (<button onClick={onClick} disabled={isLoading || props.disabled} className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`} {...props}> {content} </button>);
  return tooltipText ? <Tooltip text={tooltipText} wrapperClassName="inline-block">{button}</Tooltip> : button;
};


const AddServerPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    target_id: '',
    bastion_host: '',
    target_host: '',
    username_bastion: '',
    username_target: '',
  });

  const [bastionKey, setBastionKey] = useState(null);
  const [targetKey, setTargetKey] = useState(null);
  const [status, setStatus] = useState({ message: '', type: 'info' });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, keyType) => {
    const file = e.target.files[0];
    if (keyType === 'bastion') setBastionKey(file);
    if (keyType === 'target') setTargetKey(file);
    // Optionally, provide feedback about the selected file
    const fileNameDisplay = e.target.parentElement.querySelector('.file-name-display');
    if (fileNameDisplay) {
        fileNameDisplay.textContent = file ? file.name : 'No file chosen';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Ensure form submission is handled by JS
    setStatus({ message: '', type: 'info' });
    setIsLoading(true);
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
      if (!res.ok) throw new Error(result.detail || 'Failed to add server');
      setStatus({ message: result.status || 'Server added successfully!', type: 'success' });
      // Optionally reset form on success
      // setFormData({ target_id: '', bastion_host: '', target_host: '', username_bastion: '', username_target: '' });
      // setBastionKey(null); setTargetKey(null);
      // const fileInputs = document.querySelectorAll('input[type="file"]');
      // fileInputs.forEach(input => {
      //   input.value = ''; // Reset file input
      //   const fileNameDisplay = input.parentElement.querySelector('.file-name-display');
      //   if (fileNameDisplay) fileNameDisplay.textContent = 'No file chosen';
      // });
    } catch (err) {
      setStatus({ message: err.message || 'An unexpected error occurred', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status.message) {
      const timer = setTimeout(() => setStatus({ message: '', type: 'info' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const inputFields = [
    { name: 'target_id', placeholder: 'Target ID (Unique Identifier)' },
    { name: 'bastion_host', placeholder: 'Bastion Host (e.g., 1.2.3.4 or FQDN)' },
    { name: 'target_host', placeholder: 'Target Host (e.g., 10.0.0.5 or FQDN)' },
    { name: 'username_bastion', placeholder: 'Username for Bastion' },
    { name: 'username_target', placeholder: 'Username for Target Host' },
  ];

  return (
      <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 relative">
      {/* Home Menu Key - always visible, not covered by banners */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="fixed top-20 left-4 sm:top-24 sm:left-6 z-[100] p-3 rounded-full bg-white/70 dark:bg-gray-800/70 border border-white/30 dark:border-gray-700/50 shadow-lg hover:bg-white/90 dark:hover:bg-gray-700/90 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 transition-all duration-200"
        aria-label="Go to Home"
      >
        <span className="font-bold text-indigo-500 dark:text-indigo-300">Home</span>
      </button>
      {/* Header Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <FiServer className="text-indigo-500" />
          Add New Server Configuration
        </h1>
        <ThemeToggle />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 overflow-y-auto"> {/* Changed to justify-start and overflow-y-auto */}
        <section className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700/60 my-8">
          <form className="space-y-6" onSubmit={handleSubmit}> {/* Increased spacing */}
            {inputFields.map((field) => (
              <div key={field.name}>
                <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {field.placeholder}
                </label>
                <input
                  id={field.name}
                  type="text"
                  name={field.name}
                  placeholder={`Enter ${field.placeholder.toLowerCase()}`}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                             bg-gray-50 dark:bg-gray-700 
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                             transition-colors duration-150"
                />
              </div>
            ))}
            
            {/* Styled File Inputs */}
            {[ { type: 'bastion', label: 'Bastion Key File (.pem)'}, { type: 'target', label: 'Target Key File (.pem)'} ].map(fileField => (
              <div key={fileField.type}>
                <label htmlFor={`${fileField.type}KeyFile`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {fileField.label}
                </label>
                <div className="mt-1 flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 hover:border-indigo-500 transition-colors duration-150">
                    <label htmlFor={`${fileField.type}KeyFile`} 
                           className="cursor-pointer rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-700">
                        <FiFilePlus className="inline mr-1"/> Choose File
                    </label>
                    <input
                        id={`${fileField.type}KeyFile`}
                        type="file"
                        accept=".pem"
                        onChange={(e) => handleFileChange(e, fileField.type)}
                        className="sr-only" // Hide default input
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400 file-name-display">
                        { (fileField.type === 'bastion' ? bastionKey?.name : targetKey?.name) || 'No file chosen' }
                    </span>
                </div>
              </div>
            ))}

            <div className="flex pt-4 justify-end">
              <ActionButton
                type="submit"
                isLoading={isLoading}
                Icon={FiSave}
                variant="success"
                size="lg" // Larger submit button
                tooltipText="Add this server configuration"
              >
                Add Server
              </ActionButton>
            </div>
          </form>
        </section>
        
        {/* Moved Toast Notification outside the form section for better global feel on page */}
      </main>
        {status.message && (
            <div className={`fixed bottom-6 right-6 z-[10000] px-4 py-3 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2 animate-slide
            ${status.type === 'success' ? 'bg-green-600 text-white' : ''}
            ${status.type === 'error' ? 'bg-red-600 text-white' : ''}
            ${status.type === 'info' ? 'bg-sky-600 text-white' : ''} 
            `}>
            {status.type === 'success' && <FiCheckCircle className="h-5 w-5"/>}
            {status.type === 'error' && <FiAlertTriangle className="h-5 w-5"/>}
            {/* Info toasts can use a different icon or none */}
            {status.type === 'info' && <FiAlertTriangle className="h-5 w-5"/>} 
            {status.message}
            <button onClick={() => setStatus({ message: '', type: 'info' })} className="ml-2 p-1 rounded-full hover:bg-black/20"><FiX size={16}/></button>
            </div>
        )}
    </div>
  );
};

export default AddServerPage;