import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SettingsContext } from './SettingsContext';
import useTranscription from '../hooks/useTranscription';
import TranscriptionProgress from './TranscriptionProgress';
import DebugPanel from './DebugPanel';
import { isSupportedAudioFormat, formatFileSize, getAudioDuration, formatDuration } from '../utils/audio-utils';

const InputForm = ({ apiConfig, onSubmit }) => {
  // Access settings context
  const { settings } = useContext(SettingsContext);

  // Transcription hook
  const {
    isTranscribing,
    progress,
    result: transcriptionResult,
    error: transcriptionError,
    transcribeFile,
    clearResult
  } = useTranscription();

  // Input state
  const [sourceType, setSourceType] = useState('file');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [audioFileInfo, setAudioFileInfo] = useState(null);
  const [contentType, setContentType] = useState('social_media');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [context, setContext] = useState('');
  const [audience, setAudience] = useState('');
  const [tags, setTags] = useState('');

  // API keys state - LLM only now (no transcription API key needed)
  const [llmApiKey, setLlmApiKey] = useState(settings.llmApiKey || '');
  const [llmModel, setLlmModel] = useState(settings.defaultLlmModel || '');

  // Settings status
  const hasConfiguredSettings = settings.llmApiKey;

  // Available platforms and models
  const [availablePlatforms, setAvailablePlatforms] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);

  // Loading state for content generation
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Handle platform selection
  const handlePlatformChange = (platformId) => {
    if (selectedPlatforms.includes(platformId)) {
      setSelectedPlatforms(selectedPlatforms.filter(id => id !== platformId));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platformId]);
    }
  };

  // Handle select all platforms
  const handleSelectAllPlatforms = () => {
    if (selectedPlatforms.length === availablePlatforms.length) {
      setSelectedPlatforms([]);
    } else {
      setSelectedPlatforms(availablePlatforms.map(platform => platform.id));
    }
  };

  // Handle content type change
  const handleContentTypeChange = (type) => {
    setContentType(type);

    if (type === 'blog' && selectedPlatforms.length === 0 && availablePlatforms.length > 0) {
      setSelectedPlatforms(availablePlatforms.map(platform => platform.id));
    }
  };

  // Handle file upload and get info
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file type is supported
      if (!isSupportedAudioFormat(file)) {
        toast.error("Unsupported file type. Please upload an audio file (MP3, WAV, WebM, etc.)");
        e.target.value = null;
        return;
      }

      setAudioFile(file);

      // Get file info
      try {
        const duration = await getAudioDuration(file);
        setAudioFileInfo({
          name: file.name,
          size: formatFileSize(file.size),
          duration: formatDuration(duration),
          durationSeconds: duration
        });
      } catch (error) {
        console.error('Error getting audio info:', error);
        setAudioFileInfo({
          name: file.name,
          size: formatFileSize(file.size),
          duration: 'Unknown',
          durationSeconds: 0
        });
      }

      // Clear previous transcription
      clearResult();
    }
  };

  // Handle transcription
  const handleTranscribe = async () => {
    if (!audioFile) {
      toast.error("Please upload an audio file first");
      return;
    }

    try {
      await transcribeFile(audioFile, {
        model: settings.whisperModel || process.env.REACT_APP_DEFAULT_WHISPER_MODEL || 'Xenova/whisper-base',
        language: 'auto',
        timestamp: true,
        duration: audioFileInfo?.durationSeconds
      });

      toast.success("Transcription completed!");
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error(`Transcription failed: ${error.message}`);
    }
  };

  // Handle form submission (content generation)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (sourceType === 'youtube' && !youtubeUrl) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    if (sourceType === 'file' && !transcriptionResult) {
      toast.error("Please transcribe the audio file first");
      return;
    }

    if (contentType === 'social_media' && selectedPlatforms.length === 0) {
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

    setIsGenerating(true);

    try {
      // Build request with transcription text
      const requestData = {
        transcription_text: transcriptionResult.text, // NEW: Send transcribed text directly
        llm_api_key: llmApiKey,
        llm_model: llmModel,
        llm_base_url: settings.llmBaseUrl,
        content_type: contentType,
        platforms: selectedPlatforms,
        context: context,
        audience: audience,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      };

      // For YouTube (fallback - requires server-side processing)
      if (sourceType === 'youtube') {
        // Note: YouTube still requires backend processing for audio extraction
        requestData.youtube_url = youtubeUrl;
        // Would need transcription API key for legacy YouTube processing
        toast.error("YouTube transcription requires manual integration. Please use file upload.");
        setIsGenerating(false);
        return;
      }

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

      // Call onSubmit with the job ID and content type
      onSubmit(generateData.job_id, contentType);

    } catch (error) {
      console.error("Submission error:", error);
      toast.error(`Error: ${error.message}`);
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-4xl mx-auto transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        {contentType === 'social_media' ? 'Create Social Media Content' : 'Create Blog Post'}
      </h2>

      {/* Settings notification banner */}
      {!hasConfiguredSettings && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              You can save your LLM API key in the <Link to="/settings" className="font-medium underline">settings page</Link> to avoid entering it each time.
            </p>
          </div>
        </div>
      )}

      {/* Browser transcription info banner */}
      <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentFlow">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>Privacy First:</strong> Transcription happens entirely in your browser. Your audio never leaves your device!
          </p>
        </div>
      </div>

      {/* Debug Panel - TEMPORARY for troubleshooting */}
      <DebugPanel />

      <form onSubmit={handleSubmit}>
        {/* Source Selection */}
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
            Content Source
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              className={`px-4 py-2 rounded-md ${
                sourceType === 'file'
                  ? 'bg-indigo-600 dark:bg-purple-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              } transition-colors duration-300`}
              onClick={() => setSourceType('file')}
            >
              Upload File
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-md ${
                sourceType === 'youtube'
                  ? 'bg-indigo-600 dark:bg-purple-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              } transition-colors duration-300 opacity-50 cursor-not-allowed`}
              onClick={() => toast.info("YouTube transcription coming soon!")}
              disabled
            >
              YouTube Link (Coming Soon)
            </button>
          </div>
        </div>

        {/* File Upload */}
        {sourceType === 'file' && (
          <>
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="audioFile">
                Upload Audio or Video File
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Audio: MP3, WAV, M4A, FLAC, OGG | Video: MP4, MOV, AVI, MPEG
                    </p>
                    {audioFileInfo && (
                      <div className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 text-center">
                        <p className="font-semibold">{audioFileInfo.name}</p>
                        <p className="text-xs">{audioFileInfo.size} • {audioFileInfo.duration}</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="audioFile"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="audio/*,video/*"
                  />
                </label>
              </div>
            </div>

            {/* Transcribe Button */}
            {audioFile && !transcriptionResult && !isTranscribing && (
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleTranscribe}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
                >
                  🎤 Transcribe Audio in Browser
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Model: {settings.whisperModel || 'Xenova/whisper-base'} •
                  <Link to="/settings" className="underline ml-1">Change model</Link>
                </p>
              </div>
            )}

            {/* Transcription Progress */}
            {isTranscribing && (
              <div className="mb-6">
                <TranscriptionProgress
                  stage={progress.stage}
                  progress={progress.progress}
                  message={progress.message}
                  file={progress.file}
                  loaded={progress.loaded}
                  total={progress.total}
                />
              </div>
            )}

            {/* Transcription Result */}
            {transcriptionResult && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Transcription Result:</h3>
                  <button
                    type="button"
                    onClick={() => {
                      clearResult();
                      setAudioFile(null);
                      setAudioFileInfo(null);
                    }}
                    className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Clear & Start Over
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {transcriptionResult.text}
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {transcriptionResult.text.length} characters • Ready to generate content
                </div>
              </div>
            )}

            {/* Transcription Error */}
            {transcriptionError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>Transcription Error:</strong> {transcriptionError}
                </p>
                <button
                  type="button"
                  onClick={handleTranscribe}
                  className="mt-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 underline"
                >
                  Try Again
                </button>
              </div>
            )}
          </>
        )}

        {/* LLM API Key - Only one now! */}
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="llmApiKey">
            LLM API Key {settings.llmApiKey && <span className="text-green-600 dark:text-green-400 text-xs">(Saved)</span>}
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
            LLM Model
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
                contentType === 'social_media'
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
                contentType === 'blog'
                  ? 'bg-indigo-600 dark:bg-purple-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              } transition-colors duration-300`}
              onClick={() => handleContentTypeChange('blog')}
            >
              Blog Post
            </button>
          </div>
        </div>

        {/* Platform Selection */}
        <div className={`mb-6 ${contentType === 'social_media' ? 'block' : 'hidden'}`}>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold">
              Social Media Platforms
            </label>
            <button
              type="button"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors duration-300"
              onClick={handleSelectAllPlatforms}
            >
              {selectedPlatforms.length === availablePlatforms.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availablePlatforms.map((platform) => (
              <div key={platform.id} className="flex items-center">
                <input
                  id={`platform-${platform.id}`}
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 dark:text-purple-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:focus:ring-purple-600 transition-colors duration-300"
                  checked={selectedPlatforms.includes(platform.id)}
                  onChange={() => handlePlatformChange(platform.id)}
                />
                <label
                  htmlFor={`platform-${platform.id}`}
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-200"
                >
                  {platform.name}
                </label>
              </div>
            ))}
          </div>
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
            value={context}
            onChange={(e) => setContext(e.target.value)}
          ></textarea>
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
            placeholder="e.g., Tech professionals, Marketing teams..."
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          />
        </div>

        {/* Tags */}
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor="tags">
            People/Accounts to Tag (optional)
          </label>
          <input
            id="tags"
            type="text"
            className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-600 transition-colors duration-300"
            placeholder="Enter handles: @user1, @user2, #hashtag"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-center">
          <button
            type="submit"
            className="bg-indigo-600 dark:bg-purple-700 hover:bg-indigo-700 dark:hover:bg-purple-800 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-600 transition-all duration-300 w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isGenerating || isTranscribing || !transcriptionResult}
          >
            {isGenerating ? (
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

        {!transcriptionResult && !isTranscribing && audioFile && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
            Please transcribe the audio file before generating content
          </p>
        )}
      </form>
    </div>
  );
};

export default InputForm;
