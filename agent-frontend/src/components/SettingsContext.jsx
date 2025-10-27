import React, { createContext, useState, useEffect } from 'react';

// Create a settings context
export const SettingsContext = createContext();

// Default settings values
const defaultSettings = {
  // API Keys
  transcriptionApiKey: '',
  llmApiKey: '',
  
  // API Service URLs
  transcriptionApiUrl: process.env.REACT_APP_TRANSCRIPTION_API_URL || 'http://localhost:8000',
  llmApiUrl: process.env.REACT_APP_AGENT_API_URL || 'http://localhost:8001',
  
  // Base URLs for external services
  transcriptionBaseUrl: 'https://api.openai.com/v1',
  llmBaseUrl: 'https://api.openai.com/v1',
  
  // Available models
  transcriptionModels: ['whisper-1', 'distil-whisper-large-v3-en'],
  llmModels: ['gpt-4.1-nano', 'gpt-4o-mini'],
  
  // Default selected models
  defaultTranscriptionModel: 'whisper-1',
  defaultLlmModel: 'gpt-4o-mini',
};

export const SettingsProvider = ({ children }) => {
  // Initialize settings from localStorage or use defaults
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('apiSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('apiSettings', JSON.stringify(settings));
  }, [settings]);

  // Function to update settings
  const updateSettings = (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    updateBackendConfig(updated);  // Automatically update backend with new settings
  };

  // Reset settings to default
  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('apiSettings');
  };
  
  // Update backend configuration
  const updateBackendConfig = async (currentSettings = settings) => {
    try {
      // Update transcription API configuration
      await fetch(`${currentSettings.transcriptionApiUrl}/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base_url: currentSettings.transcriptionBaseUrl,
          models: currentSettings.transcriptionModels,
          default_model: currentSettings.defaultTranscriptionModel
        }),
      });
      
      // Update LLM API configuration
      await fetch(`${currentSettings.llmApiUrl}/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base_url: currentSettings.llmBaseUrl,
          models: currentSettings.llmModels,
          default_model: currentSettings.defaultLlmModel
        }),
      });
      
      return true;
    } catch (error) {
      console.error("Error updating backend configuration:", error);
      return false;
    }
  };
  
  // Get backend configuration
  const fetchBackendConfig = async (currentSettings = settings) => {
    try {
      // Fetch transcription API configuration
      const transResponse = await fetch(`${currentSettings.transcriptionApiUrl}/config`);
      if (transResponse.ok) {
        const transConfig = await transResponse.json();
        
        // Update local settings with fetched configuration
        updateSettings({
          transcriptionBaseUrl: transConfig.base_url || currentSettings.transcriptionBaseUrl,
          transcriptionModels: transConfig.models || currentSettings.transcriptionModels,
          defaultTranscriptionModel: transConfig.default_model || currentSettings.defaultTranscriptionModel
        });
      }
      
      // Fetch LLM API configuration
      const llmResponse = await fetch(`${currentSettings.llmApiUrl}/config`);
      if (llmResponse.ok) {
        const llmConfig = await llmResponse.json();
        
        // Update local settings with fetched configuration
        updateSettings({
          llmBaseUrl: llmConfig.base_url || currentSettings.llmBaseUrl,
          llmModels: llmConfig.models || currentSettings.llmModels,
          defaultLlmModel: llmConfig.default_model || currentSettings.defaultLlmModel
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error fetching backend configuration:", error);
      return false;
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      resetSettings, 
      updateBackendConfig,
      fetchBackendConfig
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;