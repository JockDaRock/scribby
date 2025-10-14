import React, { useContext, useState, useEffect } from 'react';
import { SettingsContext } from './SettingsContext';
import { ThemeContext } from './ThemeContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { settings, updateSettings, resetSettings, updateBackendConfig, fetchBackendConfig } = useContext(SettingsContext);
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  
  // Local state for form values
  const [formValues, setFormValues] = useState({
    // API Keys
    transcriptionApiKey: settings.transcriptionApiKey || '',
    llmApiKey: settings.llmApiKey || '',

    // API Service URLs
    transcriptionApiUrl: settings.transcriptionApiUrl || 'http://localhost:8000',
    llmApiUrl: settings.llmApiUrl || 'http://localhost:8001',

    // Base URLs
    transcriptionBaseUrl: settings.transcriptionBaseUrl || 'https://api.openai.com/v1',
    llmBaseUrl: settings.llmBaseUrl || 'https://api.openai.com/v1',

    // Models (as comma-separated strings for the form)
    transcriptionModels: (settings.transcriptionModels || ['whisper-1']).join(', '),
    llmModels: (settings.llmModels || ['gpt-4o-mini']).join(', '),

    // Default models
    defaultTranscriptionModel: settings.defaultTranscriptionModel || 'whisper-1',
    defaultLlmModel: settings.defaultLlmModel || 'gpt-4o-mini',

    // Browser-based Whisper model (NEW)
    whisperModel: settings.whisperModel || 'Xenova/whisper-tiny.en',
  });
  
  // State for tracking if we're syncing with backend
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate URLs
    try {
      new URL(formValues.transcriptionApiUrl);
      new URL(formValues.llmApiUrl);
      new URL(formValues.transcriptionBaseUrl);
      new URL(formValues.llmBaseUrl);
    } catch (error) {
      toast.error('Please enter valid URLs');
      return;
    }
    
    // Process model arrays
    const processedValues = {
      ...formValues,
      transcriptionModels: formValues.transcriptionModels.split(',').map(item => item.trim()).filter(Boolean),
      llmModels: formValues.llmModels.split(',').map(item => item.trim()).filter(Boolean),
    };
    
    // Validate default models are in the list
    if (!processedValues.transcriptionModels.includes(processedValues.defaultTranscriptionModel)) {
      toast.error('Default transcription model must be in the list of available models');
      return;
    }
    
    if (!processedValues.llmModels.includes(processedValues.defaultLlmModel)) {
      toast.error('Default LLM model must be in the list of available models');
      return;
    }
    
    // Update settings
    updateSettings(processedValues);
    toast.success('Settings saved successfully');
    
    // Update backend configuration
    setIsSyncing(true);
    const syncResult = await updateBackendConfig();
    setIsSyncing(false);
    
    if (syncResult) {
      toast.success('Backend configuration updated successfully');
    } else {
      toast.warning('Settings saved locally, but backend sync failed. Changes will apply on next restart.');
    }
    
    // Navigate back to home after a short delay
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };
  
  // Fetch configuration from backend
  const handleFetchConfig = async () => {
    setIsSyncing(true);
    const result = await fetchBackendConfig();
    setIsSyncing(false);
    
    if (result) {
      // Update form values from updated settings
      setFormValues({
        transcriptionApiKey: settings.transcriptionApiKey || '',
        llmApiKey: settings.llmApiKey || '',
        transcriptionApiUrl: settings.transcriptionApiUrl || 'http://localhost:8000',
        llmApiUrl: settings.llmApiUrl || 'http://localhost:8001',
        transcriptionBaseUrl: settings.transcriptionBaseUrl || 'https://api.openai.com/v1',
        llmBaseUrl: settings.llmBaseUrl || 'https://api.openai.com/v1',
        transcriptionModels: (settings.transcriptionModels || []).join(', '),
        llmModels: (settings.llmModels || []).join(', '),
        defaultTranscriptionModel: settings.defaultTranscriptionModel || '',
        defaultLlmModel: settings.defaultLlmModel || '',
      });
      
      toast.success('Configuration fetched from backend servers');
    } else {
      toast.error('Failed to fetch configuration from backend servers');
    }
  };
  
  // Handle reset to defaults
  const handleReset = () => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      resetSettings();
      setFormValues({
        transcriptionApiKey: '',
        llmApiKey: '',
        transcriptionApiUrl: 'http://localhost:8000',
        llmApiUrl: 'http://localhost:8001',
        transcriptionBaseUrl: 'https://api.openai.com/v1',
        llmBaseUrl: 'https://api.openai.com/v1',
        transcriptionModels: 'whisper-1, distil-whisper-large-v3-en',
        llmModels: 'gpt-4.1-nano, gpt-4o-mini',
        defaultTranscriptionModel: 'whisper-1',
        defaultLlmModel: 'gpt-4o-mini',
        whisperModel: 'Xenova/whisper-base',
      });
      toast.success('Settings reset to defaults');
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    navigate('/');
  };
  
  // Effect to sync with backend on initial load
  useEffect(() => {
    handleFetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">Application Settings</h2>
      
      <form onSubmit={handleSubmit}>
        {/* API Keys Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
            API Keys
          </h3>
          
          <div className="space-y-4">
            {/* Transcription API Key */}
            <div>
              <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="transcriptionApiKey">
                Transcription API Key
              </label>
              <input
                id="transcriptionApiKey"
                name="transcriptionApiKey"
                type="password"
                className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-600 transition-colors duration-300"
                value={formValues.transcriptionApiKey}
                onChange={handleChange}
                placeholder="Enter your Transcription API Key"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This key will be used for all transcription requests.
              </p>
            </div>
            
            {/* LLM API Key */}
            <div>
              <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="llmApiKey">
                LLM API Key
              </label>
              <input
                id="llmApiKey"
                name="llmApiKey"
                type="password"
                className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-600 transition-colors duration-300"
                value={formValues.llmApiKey}
                onChange={handleChange}
                placeholder="Enter your LLM API Key"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This key will be used for content generation.
              </p>
            </div>
          </div>
        </div>
        
        {/* Server URLs Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
            Server APIs
          </h3>
          
          <div className="space-y-4">
            {/* Transcription API URL */}
            <div>
              <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="transcriptionApiUrl">
                Transcription API URL
              </label>
              <input
                id="transcriptionApiUrl"
                name="transcriptionApiUrl"
                type="url"
                className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-600 transition-colors duration-300"
                value={formValues.transcriptionApiUrl}
                onChange={handleChange}
                placeholder="http://localhost:8000"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Base URL for the Transcription API service.
              </p>
            </div>
            
            {/* LLM API URL */}
            <div>
              <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="llmApiUrl">
                LLM API URL
              </label>
              <input
                id="llmApiUrl"
                name="llmApiUrl"
                type="url"
                className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-600 transition-colors duration-300"
                value={formValues.llmApiUrl}
                onChange={handleChange}
                placeholder="http://localhost:8001"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Base URL for the LLM API service.
              </p>
            </div>
          </div>
        </div>
        
        {/* External APIs Configuration */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
            External APIs Configuration
          </h3>
          
          <div className="space-y-4">
            {/* Transcription Service */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Transcription Service</h4>
              
              {/* Base URL */}
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="transcriptionBaseUrl">
                  Base URL
                </label>
                <input
                  id="transcriptionBaseUrl"
                  name="transcriptionBaseUrl"
                  type="url"
                  className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-600 transition-colors duration-300"
                  value={formValues.transcriptionBaseUrl}
                  onChange={handleChange}
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              
              {/* Models */}
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="transcriptionModels">
                  Available Models (comma-separated)
                </label>
                <input
                  id="transcriptionModels"
                  name="transcriptionModels"
                  type="text"
                  className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-600 transition-colors duration-300"
                  value={formValues.transcriptionModels}
                  onChange={handleChange}
                  placeholder="whisper-1, distil-whisper-large-v3-en"
                />
              </div>
              
              {/* Default Model */}
              <div>
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="defaultTranscriptionModel">
                  Default Model
                </label>
                <input
                  id="defaultTranscriptionModel"
                  name="defaultTranscriptionModel"
                  type="text"
                  className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-600 transition-colors duration-300"
                  value={formValues.defaultTranscriptionModel}
                  onChange={handleChange}
                  placeholder="whisper-1"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Must be one of the models listed above.
                </p>
              </div>
            </div>
            
            {/* LLM Service */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">LLM Service</h4>
              
              {/* Base URL */}
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="llmBaseUrl">
                  Base URL
                </label>
                <input
                  id="llmBaseUrl"
                  name="llmBaseUrl"
                  type="url"
                  className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-600 transition-colors duration-300"
                  value={formValues.llmBaseUrl}
                  onChange={handleChange}
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              
              {/* Models */}
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="llmModels">
                  Available Models (comma-separated)
                </label>
                <input
                  id="llmModels"
                  name="llmModels"
                  type="text"
                  className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-600 transition-colors duration-300"
                  value={formValues.llmModels}
                  onChange={handleChange}
                  placeholder="gpt-4.1-nano, gpt-4o-mini"
                />
              </div>
              
              {/* Default Model */}
              <div>
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="defaultLlmModel">
                  Default Model
                </label>
                <input
                  id="defaultLlmModel"
                  name="defaultLlmModel"
                  type="text"
                  className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-600 transition-colors duration-300"
                  value={formValues.defaultLlmModel}
                  onChange={handleChange}
                  placeholder="gpt-4o-mini"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Must be one of the models listed above.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sync with Backend Section */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-1">Backend Synchronization</h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                These settings will be synced with backend servers when you save changes.
              </p>
            </div>
            <button
              type="button"
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded transition-colors"
              onClick={handleFetchConfig}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing...
                </span>
              ) : (
                "Refresh from Servers"
              )}
            </button>
          </div>
        </div>
        
        {/* Browser Transcription Settings NEW! */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
            Browser Transcription (NEW!)
          </h3>

          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-800 dark:text-green-200">
              <span className="font-bold">🎉 Privacy First:</span> Transcription now happens entirely in your browser! Your audio never leaves your device.
            </p>
          </div>

          <div className="space-y-4">
            {/* Whisper Model Selection */}
            <div>
              <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="whisperModel">
                Whisper Model
              </label>
              <select
                id="whisperModel"
                name="whisperModel"
                className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-600 transition-colors duration-300"
                value={formValues.whisperModel || 'Xenova/whisper-base'}
                onChange={handleChange}
              >
                <option value="Xenova/whisper-tiny.en">Tiny (English only) - 75 MB • Very Fast</option>
                <option value="Xenova/whisper-tiny">Tiny (Multilingual) - 75 MB • Very Fast</option>
                <option value="Xenova/whisper-base.en">Base (English only) - 145 MB • Fast</option>
                <option value="Xenova/whisper-base">Base (Multilingual) - 145 MB • Fast ⭐ Recommended</option>
                <option value="Xenova/whisper-small.en">Small (English only) - 485 MB • Medium</option>
                <option value="Xenova/whisper-small">Small (Multilingual) - 485 MB • Medium</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Larger models are more accurate but slower. Models are downloaded and cached on first use.
              </p>
            </div>

            {/* Model Preload Button */}
            <div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    toast.info('Downloading model... This may take a few minutes.');
                    const { default: transcriptionService } = await import('../services/transcription.service');
                    await transcriptionService.preloadModel(formValues.whisperModel || 'Xenova/whisper-base');
                    toast.success('Model downloaded and cached successfully!');
                  } catch (error) {
                    toast.error(`Failed to preload model: ${error.message}`);
                  }
                }}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors duration-300"
              >
                📦 Preload Model (Recommended for First Use)
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Download and cache the model now to avoid waiting during transcription.
              </p>
            </div>

            {/* Info about deprecated transcription API */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Note:</strong> The Transcription API Key and URL settings below are deprecated and no longer used. Transcription now happens entirely in your browser using Whisper ONNX models.
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <span className="font-bold">Security Note:</span> Your API keys are stored locally in your browser and are not sent to any server except when making API requests.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-4 py-2 text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 rounded-md transition-colors duration-300"
          >
            Reset to Defaults
          </button>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-md transition-colors duration-300"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="flex-1 sm:flex-none px-6 py-2 bg-indigo-600 dark:bg-purple-700 hover:bg-indigo-700 dark:hover:bg-purple-800 text-white font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-300"
              disabled={isSyncing}
            >
              {isSyncing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Settings"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Settings;