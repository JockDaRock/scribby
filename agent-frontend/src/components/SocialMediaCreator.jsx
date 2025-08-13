import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SettingsContext } from './SettingsContext';

// Platform-specific icons
const PlatformIcon = ({ platform }) => {
  const iconClasses = "h-5 w-5";
  
  switch (platform) {
    case 'LinkedIn':
      return (
        <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case 'Twitter':
      return (
        <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'BlueSky':
      return (
        <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12,22 C17.5228475,22 22,17.5228475 22,12 C22,6.4771525 17.5228475,2 12,2 C6.4771525,2 2,6.4771525 2,12 C2,17.5228475 6.4771525,22 12,22 Z M7.5,10.5 C8.32842712,10.5 9,11.1715729 9,12 C9,12.8284271 8.32842712,13.5 7.5,13.5 C6.67157288,13.5 6,12.8284271 6,12 C6,11.1715729 6.67157288,10.5 7.5,10.5 Z M16.5,10.5 C17.3284271,10.5 18,11.1715729 18,12 C18,12.8284271 17.3284271,13.5 16.5,13.5 C15.6715729,13.5 15,12.8284271 15,12 C15,11.1715729 15.6715729,10.5 16.5,10.5 Z M12,17 C9.75,17 8,15.75 8,15.75 C8,15.75 9.75,17.5 12,17.5 C14.25,17.5 16,15.75 16,15.75 C16,15.75 14.25,17 12,17 Z" />
        </svg>
      );
    case 'Instagram':
      return (
        <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      );
    case 'Facebook':
      return (
        <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case 'TikTok':
      return (
        <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      );
  }
};

// Platform Card Component
const PlatformCard = ({ platform, content, settings }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(content.text);
  const [isCopied, setIsCopied] = useState(false);
  const [isRevisioning, setIsRevisioning] = useState(false);
  const [revisionInstructions, setRevisionInstructions] = useState('');
  const [isRevisionLoading, setIsRevisionLoading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? editedText : content.text);
    setIsCopied(true);
    toast.success(`${platform} content copied to clipboard!`);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    content.text = editedText;
    content.character_count = editedText.length;
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedText(content.text);
  };

  const handleRevisionSubmit = async () => {
    if (!revisionInstructions.trim()) {
      toast.error('Please provide revision instructions');
      return;
    }
    
    if (!settings.llmApiKey) {
      toast.error('LLM API key is required for revision. Please check your settings.');
      return;
    }
    
    setIsRevisionLoading(true);
    
    try {
      const agentApiUrl = settings.llmApiUrl || process.env.REACT_APP_AGENT_API_URL || 'http://localhost:8001';
      const response = await fetch(`${agentApiUrl}/revise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editedText,
          platform: platform,
          content_type: 'social_media',
          instructions: revisionInstructions,
          llm_api_key: settings.llmApiKey,
          llm_model: settings.defaultLlmModel,
          llm_base_url: settings.llmBaseUrl
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Revision request failed: ${errorText}`);
      }
      
      const data = await response.json();
      setEditedText(data.revised_content);
      content.text = data.revised_content;
      content.character_count = data.revised_content.length;
      
      setIsRevisioning(false);
      setRevisionInstructions('');
      toast.success('Content revised successfully!');
      
    } catch (error) {
      console.error('Revision error:', error);
      toast.error('Failed to revise content. Please try again.');
    } finally {
      setIsRevisionLoading(false);
    }
  };

  // Platform-specific styles
  const platformStyles = {
    LinkedIn: 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200',
    Twitter: 'bg-sky-100 border-sky-300 text-sky-800 dark:bg-sky-900/30 dark:border-sky-800 dark:text-sky-200',
    BlueSky: 'bg-cyan-100 border-cyan-300 text-cyan-800 dark:bg-cyan-900/30 dark:border-cyan-800 dark:text-cyan-200',
    Instagram: 'bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900/30 dark:border-pink-800 dark:text-pink-200',
    Facebook: 'bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-200',
    TikTok: 'bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200',
  };

  const style = platformStyles[platform] || 'bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200';
  
  const charLimit = {
    LinkedIn: 3000,
    Twitter: 280,
    BlueSky: 300,
    Instagram: 2200,
    Facebook: 63206,
    TikTok: 2200,
  }[platform] || 1000;
  
  const charCount = isEditing ? editedText.length : content.character_count;
  const isOverLimit = charCount > charLimit;

  return (
    <div className={`border-2 rounded-lg p-4 ${style} transition-colors duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <PlatformIcon platform={platform} />
          <h3 className="ml-2 text-lg font-semibold">{platform}</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsRevisioning(!isRevisioning)}
            className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-800/30 text-sm font-medium transition-colors duration-300"
          >
            Revise
          </button>
          <button
            onClick={handleEdit}
            className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800/30 text-sm font-medium transition-colors duration-300"
          >
            Edit
          </button>
          <button
            onClick={handleCopy}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-300 ${
              isCopied
                ? 'bg-green-200 dark:bg-green-800/30 text-green-800 dark:text-green-200'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      
      {isEditing ? (
        <div className="mb-3">
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white transition-colors duration-300"
            rows="6"
          />
          <div className="flex space-x-2 mt-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-800 text-sm font-medium transition-colors duration-300"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-500 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-700 text-sm font-medium transition-colors duration-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-3">
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600 transition-colors duration-300">
            <pre className="whitespace-pre-wrap text-sm font-sans text-gray-800 dark:text-gray-200">
              {content.text}
            </pre>
          </div>
        </div>
      )}
      
      {isRevisioning && (
        <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800 transition-colors duration-300">
          <textarea
            value={revisionInstructions}
            onChange={(e) => setRevisionInstructions(e.target.value)}
            className="w-full p-2 border border-purple-300 dark:border-purple-600 rounded dark:bg-gray-700 dark:text-white transition-colors duration-300"
            rows="2"
            placeholder="e.g., Make it more casual, Add emojis, Make it shorter, Focus on benefits..."
          />
          <div className="flex space-x-2 mt-2">
            <button
              onClick={handleRevisionSubmit}
              disabled={isRevisionLoading}
              className="px-3 py-1 bg-purple-600 dark:bg-purple-700 text-white rounded hover:bg-purple-700 dark:hover:bg-purple-800 text-sm font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRevisionLoading ? 'Revising...' : 'Revise'}
            </button>
            <button
              onClick={() => setIsRevisioning(false)}
              className="px-3 py-1 bg-gray-500 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-700 text-sm font-medium transition-colors duration-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <div className={`text-xs flex justify-between transition-colors duration-300 ${isOverLimit ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
        <span>Character count: {charCount}</span>
        <span>Limit: {charLimit}</span>
      </div>
    </div>
  );
};

// Blog Card Component
const BlogCard = ({ blogContent }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(blogContent.text);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? editedText : blogContent.text);
    setIsCopied(true);
    toast.success('Blog content copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    blogContent.text = editedText;
    blogContent.character_count = editedText.length;
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedText(blogContent.text);
  };

  return (
    <div className="bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-800 text-green-800 dark:text-green-200 rounded-lg p-4 transition-colors duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <h3 className="text-lg font-semibold">Blog Post</h3>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800/30 text-sm font-medium transition-colors duration-300"
          >
            Edit
          </button>
          <button
            onClick={handleCopy}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-300 ${
              isCopied
                ? 'bg-green-200 dark:bg-green-800/30 text-green-800 dark:text-green-200'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      
      {isEditing ? (
        <div className="mb-3">
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white transition-colors duration-300"
            rows="12"
          />
          <div className="flex space-x-2 mt-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-800 text-sm font-medium transition-colors duration-300"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-500 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-700 text-sm font-medium transition-colors duration-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-3">
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600 transition-colors duration-300 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm font-sans text-gray-800 dark:text-gray-200">
              {blogContent.text}
            </pre>
          </div>
        </div>
      )}
      
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Character count: {isEditing ? editedText.length : blogContent.character_count}
      </div>
    </div>
  );
};

const SocialMediaCreator = ({ apiConfig }) => {
  // Access settings context
  const { settings } = useContext(SettingsContext);
  
  // State to manage the current step in the workflow
  const [currentStep, setCurrentStep] = useState('input'); // 'input', 'processing', 'results'
  
  // State to store job details
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  
  // State to store results
  const [results, setResults] = useState(null);
  
  // Form data state
  const [formData, setFormData] = useState({
    userDescription: '',
    platforms: [],
    contentType: 'social_media',
    context: '',
    audience: '',
    tags: ''
  });

  // API keys state - initialize from settings or empty
  const [llmApiKey, setLlmApiKey] = useState(settings.llmApiKey || '');
  const [llmModel, setLlmModel] = useState(settings.defaultLlmModel || '');
  
  // Settings status (to show a message if no settings configured)
  const hasConfiguredSettings = settings.llmApiKey;
  
  // Available platforms and models
  const [availablePlatforms, setAvailablePlatforms] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available platforms and models
  useEffect(() => {
    const fetchPlatformsAndModels = async () => {
      try {
        // Fetch platforms
        const platformsResponse = await fetch(`${apiConfig.agentApiUrl}/platforms`);
        if (platformsResponse.ok) {
          const platformsData = await platformsResponse.json();
          setAvailablePlatforms(platformsData.platforms);
        }
        
        // Fetch models
        const modelsResponse = await fetch(`${apiConfig.agentApiUrl}/models`);
        if (modelsResponse.ok) {
          const modelsData = await modelsResponse.json();
          setAvailableModels(modelsData.models);
          
          // Set default model if not already set
          if (!llmModel && modelsData.models && modelsData.models.length > 0) {
            // Try to use the configured default model if it exists in the available models
            if (settings.defaultLlmModel && modelsData.models.some(model => model.id === settings.defaultLlmModel)) {
              setLlmModel(settings.defaultLlmModel);
            } else {
              setLlmModel(modelsData.models[0].id);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching platforms and models:", error);
        toast.error("Error loading available options. Please check API URLs in settings.");
      }
    };
    
    fetchPlatformsAndModels();
  }, [apiConfig.agentApiUrl, llmModel, settings.defaultLlmModel]);

  // Define checkJobStatus with useCallback to prevent recreation on every render
  const checkJobStatus = useCallback(async () => {
    if (!jobId) return;
    
    try {
      const response = await fetch(`${apiConfig.agentApiUrl}/status/${jobId}`, {
        headers: {
          "Cache-Control": "no-cache, no-store",
          "Pragma": "no-cache"
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const statusData = await response.json();
      setJobStatus(statusData);
      
      // Update step if job is completed or has error
      if (statusData.status === 'completed') {
        setCurrentStep('results');
        setResults(statusData.result);
        toast.success("Content generation completed successfully!");
      } else if (statusData.status === 'error') {
        // Stay in processing step but show error
        console.error("Job error:", statusData.message);
        toast.error(`Generation failed: ${statusData.message}`);
      }
    } catch (error) {
      console.error("Error checking job status:", error);
      toast.error(`Error checking status: ${error.message}`);
    }
  }, [jobId, apiConfig.agentApiUrl]);
  
  // Function to poll job status
  useEffect(() => {
    let statusInterval;
    
    if (jobId && currentStep === 'processing') {
      // Check status immediately
      checkJobStatus();
      
      // Then poll every 5 seconds
      statusInterval = setInterval(() => {
        checkJobStatus();
      }, 5000); // Poll every 5 seconds
    }
    
    return () => {
      if (statusInterval) clearInterval(statusInterval);
    };
  }, [jobId, currentStep, checkJobStatus]);

  // Handle platform selection
  const handlePlatformChange = (platformId) => {
    const updatedPlatforms = formData.platforms.includes(platformId)
      ? formData.platforms.filter(id => id !== platformId)
      : [...formData.platforms, platformId];
    
    updateFormData('platforms', updatedPlatforms);
  };

  // Handle select all platforms
  const handleSelectAllPlatforms = () => {
    if (formData.platforms.length === availablePlatforms.length) {
      updateFormData('platforms', []);
    } else {
      updateFormData('platforms', availablePlatforms.map(platform => platform.id));
    }
  };

  // Handle content type change
  const handleContentTypeChange = (type) => {
    updateFormData('contentType', type);
    
    // If switching to blog type, ensure at least one platform is selected
    // This is needed because the backend still requires platforms even for blog content
    if (type === 'blog' && formData.platforms.length === 0 && availablePlatforms.length > 0) {
      // Select all platforms by default for blog posts
      updateFormData('platforms', availablePlatforms.map(platform => platform.id));
    }
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.userDescription.trim()) {
      toast.error("Please describe what you want to communicate");
      return;
    }
    
    if (formData.contentType === 'social_media' && formData.platforms.length === 0) {
      toast.error("Please select at least one social media platform");
      return;
    }
    
    if (!llmApiKey) {
      toast.error("LLM API key is required");
      return;
    }
    
    if (!llmModel) {
      toast.error("Please select an LLM model");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create API request payload
      const requestData = {
        user_description: formData.userDescription.trim(), // Use the new field
        llm_api_key: llmApiKey,
        llm_model: llmModel,
        // Pass base URLs from settings
        llm_base_url: settings.llmBaseUrl,
        content_type: formData.contentType,
        platforms: formData.platforms,
        context: formData.context || '',
        audience: formData.audience || '',
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      };

      // Make API request
      const generateResponse = await fetch(`${apiConfig.agentApiUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        throw new Error(`Content generation failed: ${errorText}`);
      }
      
      const generateData = await generateResponse.json();
      
      // Store job ID and transition to processing
      setJobId(generateData.job_id);
      setCurrentStep('processing');
      setIsLoading(false);
      
      toast.success("Content generation started! Processing your request...");
      
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(`Error: ${error.message}`);
      setIsLoading(false);
    }
  };

  // Function for resetting the workflow
  const handleReset = () => {
    setJobId(null);
    setJobStatus(null);
    setResults(null);
    setCurrentStep('input');
    setFormData({
      userDescription: '',
      platforms: [],
      contentType: 'social_media',
      context: '',
      audience: '',
      tags: ''
    });
    setIsLoading(false);
  };

  // Function for updating form data
  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Social Media Creator
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Create engaging social media content from your text descriptions
        </p>

        {/* Input Form Section */}
        {currentStep === 'input' && (
          <div className="space-y-6">
            {/* Settings notification banner */}
            {!hasConfiguredSettings && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    You can save your API keys in the <Link to="/settings" className="font-medium underline">settings page</Link> to avoid entering them each time.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* User Description - Main Input */}
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="userDescription">
                  What do you want to communicate? *
                </label>
                <textarea
                  id="userDescription"
                  className="shadow appearance-none border dark:border-gray-600 rounded w-full py-3 px-4 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-600 transition-colors duration-300"
                  rows="6"
                  placeholder="Describe what you want to communicate on social media... For example: 'I want to announce our new product launch, highlighting the key features and benefits for small business owners.'"
                  value={formData.userDescription}
                  onChange={(e) => updateFormData('userDescription', e.target.value)}
                  required
                />
              </div>

              {/* Content Type Selection */}
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
                  Content Type
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-md ${
                      formData.contentType === 'social_media' 
                        ? 'bg-indigo-600 dark:bg-purple-700 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    } transition-colors duration-300`}
                    onClick={() => handleContentTypeChange('social_media')}
                  >
                    Social Media Posts
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-md ${
                      formData.contentType === 'blog' 
                        ? 'bg-indigo-600 dark:bg-purple-700 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    } transition-colors duration-300`}
                    onClick={() => handleContentTypeChange('blog')}
                  >
                    Blog Post
                  </button>
                </div>
              </div>

              {/* Platform Selection - Only show for social media content type */}
              <div className={`mb-6 ${formData.contentType === 'social_media' ? 'block' : 'hidden'}`}>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold">
                    Social Media Platforms *
                  </label>
                  <button
                    type="button"
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors duration-300"
                    onClick={handleSelectAllPlatforms}
                  >
                    {formData.platforms.length === availablePlatforms.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availablePlatforms.map((platform) => (
                    <div key={platform.id} className="flex items-center">
                      <input
                        id={`platform-${platform.id}`}
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 dark:text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:focus:ring-purple-600 transition-colors duration-300"
                        checked={formData.platforms.includes(platform.id)}
                        onChange={() => handlePlatformChange(platform.id)}
                      />
                      <label
                        htmlFor={`platform-${platform.id}`}
                        className="ml-2 block text-sm text-gray-700 dark:text-gray-200"
                      >
                        {platform.name} ({platform.max_length} chars)
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* API Keys */}
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="llmApiKey">
                  LLM API Key * {settings.llmApiKey && <span className="text-green-600 dark:text-green-400 text-xs">(Saved)</span>}
                </label>
                <input
                  id="llmApiKey"
                  type="password"
                  className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-600 transition-colors duration-300"
                  value={llmApiKey}
                  onChange={(e) => setLlmApiKey(e.target.value)}
                  placeholder={settings.llmApiKey ? "••••••••••••••••••••••••" : "Enter LLM API Key"}
                  required={!settings.llmApiKey}
                />
              </div>

              {/* LLM Model Selection */}
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="llmModel">
                  LLM Model *
                </label>
                <div className="relative">
                  <select
                    id="llmModel"
                    className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-600 transition-colors duration-300"
                    value={llmModel}
                    onChange={(e) => setLlmModel(e.target.value)}
                    required
                  >
                    <option value="">Select a model</option>
                    {availableModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} {model.provider !== "Default" ? `(${model.provider})` : ""}
                        {model.id === settings.defaultLlmModel && " (Default)"}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  You can configure available models in the <Link to="/settings" className="underline">settings page</Link>.
                </p>
              </div>

              {/* Additional Context */}
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="context">
                  Additional Context (optional)
                </label>
                <textarea
                  id="context"
                  className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-600 transition-colors duration-300"
                  rows="3"
                  placeholder="Provide any additional context for content generation..."
                  value={formData.context}
                  onChange={(e) => updateFormData('context', e.target.value)}
                />
              </div>

              {/* Target Audience */}
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="audience">
                  Target Audience (optional)
                </label>
                <input
                  id="audience"
                  type="text"
                  className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-600 transition-colors duration-300"
                  placeholder="e.g., Tech professionals, Marketing teams, Small business owners..."
                  value={formData.audience}
                  onChange={(e) => updateFormData('audience', e.target.value)}
                />
              </div>

              {/* Tags / People to Mention */}
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="tags">
                  People/Accounts to Tag (optional)
                </label>
                <input
                  id="tags"
                  type="text"
                  className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-600 transition-colors duration-300"
                  placeholder="Enter handles separated by commas: @user1, @user2, #hashtag"
                  value={formData.tags}
                  onChange={(e) => updateFormData('tags', e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-center">
                <button
                  type="submit"
                  className="bg-indigo-600 dark:bg-purple-700 hover:bg-indigo-700 dark:hover:bg-purple-800 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-600 transition-all duration-300 w-full md:w-auto"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Content...
                    </span>
                  ) : (
                    'Generate Content'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Processing Status Section */}
        {currentStep === 'processing' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">
              Processing Your Content
            </h2>
            
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-600">
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-medium ${
                    jobStatus?.status === 'processing' ? 'text-indigo-600 dark:text-indigo-400' :
                    jobStatus?.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                    jobStatus?.status === 'error' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    Status: {jobStatus?.status ? jobStatus.status.charAt(0).toUpperCase() + jobStatus.status.slice(1) : 'Initializing'}
                  </span>
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    {jobStatus?.status === 'completed' ? '100%' : 
                     jobStatus?.status === 'processing' ? '75%' : 
                     jobStatus?.status === 'queued' ? '25%' : '10%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-700 ease-in-out ${
                      jobStatus?.status === 'error' ? 'bg-red-600' :
                      jobStatus?.status === 'completed' ? 'bg-green-600' :
                      'bg-indigo-600 dark:bg-purple-600'
                    }`}
                    style={{ 
                      width: jobStatus?.status === 'completed' ? '100%' : 
                             jobStatus?.status === 'processing' ? '75%' : 
                             jobStatus?.status === 'queued' ? '25%' : '10%'
                    }}
                  ></div>
                </div>
              </div>

              {/* Current Activity */}
              <div className="mb-8">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Activity:</h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-700 dark:text-gray-300">
                      {jobStatus?.message || 'Processing your text description and generating content...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Process Steps */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800 mb-6">
                <h3 className="font-semibold text-indigo-700 dark:text-indigo-400 mb-2">What's happening:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className={`mr-2 ${
                      jobStatus?.status ? 'text-green-500 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {jobStatus?.status ? '✓' : '○'}
                    </span>
                    <span className={jobStatus?.status ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}>
                      Job queued and processing started
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className={`mr-2 ${
                      jobStatus?.status === 'processing' || jobStatus?.status === 'completed' ? 'text-green-500 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {jobStatus?.status === 'processing' || jobStatus?.status === 'completed' ? '✓' : '○'}
                    </span>
                    <span className={jobStatus?.status === 'processing' || jobStatus?.status === 'completed' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}>
                      Analyzing your text description
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className={`mr-2 ${
                      jobStatus?.status === 'processing' || jobStatus?.status === 'completed' ? 'text-green-500 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {jobStatus?.status === 'processing' || jobStatus?.status === 'completed' ? '✓' : '○'}
                    </span>
                    <span className={jobStatus?.status === 'processing' || jobStatus?.status === 'completed' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}>
                      {formData.contentType === 'blog' ? 'Generating blog post' : 'Generating social media content'}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className={`mr-2 ${
                      jobStatus?.status === 'completed' ? 'text-green-500 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {jobStatus?.status === 'completed' ? '✓' : '○'}
                    </span>
                    <span className={jobStatus?.status === 'completed' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}>
                      Content generation completed
                    </span>
                  </li>
                </ul>
              </div>

              {/* Error Display */}
              {jobStatus?.status === 'error' && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800 mb-6">
                  <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">Error:</h3>
                  <p className="text-red-700 dark:text-red-400 mb-3">{jobStatus.message}</p>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-300"
                    >
                      Start Over
                    </button>
                    <button
                      onClick={() => {
                        // Reset just the job state to retry with same form data
                        setJobId(null);
                        setJobStatus(null);
                        setCurrentStep('input');
                      }}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-300"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {/* Job Info */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                {jobId && <p>Job ID: {jobId}</p>}
                <p className="mt-1">This process may take a few minutes. Please don't close this window.</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Display Section */}
        {currentStep === 'results' && results && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Generated Content
              </h2>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-indigo-600 dark:bg-purple-700 hover:bg-indigo-700 dark:hover:bg-purple-800 text-white rounded-lg transition-colors duration-300"
              >
                Create New Content
              </button>
            </div>
            
            {/* Blog Content */}
            {results.content_type === 'blog' && results.blog_content && (
              <BlogCard blogContent={results.blog_content} />
            )}
            
            {/* Social Media Content */}
            {results.content_type === 'social_media' && results.content && (
              <div className="space-y-4">
                {Object.entries(results.content).map(([platform, content]) => (
                  <PlatformCard 
                    key={platform} 
                    platform={platform} 
                    content={content} 
                    settings={settings}
                  />
                ))}
              </div>
            )}
            
            {/* Source Information */}
            {results.transcript && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Source Description:</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                  "{results.transcript.length > 200 ? results.transcript.substring(0, 200) + '...' : results.transcript}"
                </p>
              </div>
            )}

            {/* Tabs for transcript view */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-600">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button className="py-2 px-4 font-medium text-indigo-600 dark:text-purple-400 border-b-2 border-indigo-600 dark:border-purple-400">
                  Generated Content
                </button>
                <button className="py-2 px-4 font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  Source Text
                </button>
              </div>
              <div className="p-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Your Original Description:</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                    "{formData.userDescription}"
                  </p>
                  {formData.context && (
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Additional Context:</h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formData.context}
                      </p>
                    </div>
                  )}
                  {formData.audience && (
                    <div className="mt-2">
                      <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Audience:</h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formData.audience}
                      </p>
                    </div>
                  )}
                  {formData.tags && (
                    <div className="mt-2">
                      <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tags:</h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formData.tags}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SocialMediaCreator;