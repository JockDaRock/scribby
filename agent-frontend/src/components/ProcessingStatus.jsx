import React, { useState, useEffect, useCallback, useContext } from 'react';
import { SettingsContext } from './SettingsContext';
import toast from 'react-hot-toast';

const ProcessingStatus = ({ jobId, status }) => {
  // Access settings for API URLs
  const { settings } = useContext(SettingsContext);
  
  // States
  const [progress, setProgress] = useState(0);
  const [localStatus, setLocalStatus] = useState(status || { status: 'initializing', message: 'Preparing your request...' });
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [retryCount, setRetryCount] = useState(0);
  const [pollingActive, setPollingActive] = useState(true);

  // Progress tracking logic - simulates progress even without status updates
  useEffect(() => {
    let progressTimer;
    
    // Automatic progress simulation when status updates are slow or not coming
    const timeSinceLastUpdate = Date.now() - lastUpdated;
    
    // If no status update for more than 5 seconds, start simulating progress
    if (timeSinceLastUpdate > 5000 && progress < 95 && pollingActive) {
      progressTimer = setInterval(() => {
        setProgress(prev => {
          // Determine appropriate progress increment based on current progress
          if (prev < 25) return prev + 0.5; // Slower at start
          if (prev < 70) return prev + 0.3; // Medium in middle
          return prev + 0.1; // Very slow near end
        });
      }, 1000);
    }
    
    return () => {
      if (progressTimer) clearInterval(progressTimer);
    };
  }, [progress, lastUpdated, pollingActive]);

  // Handle status updates from props
  useEffect(() => {
    if (status) {
      setLocalStatus(status);
      setLastUpdated(Date.now());
      
      // Set progress based on status
      if (status.status === 'queued') {
        setProgress(10);
      } else if (status.status === 'processing') {
        // Parse message for substage
        const message = status.message?.toLowerCase() || '';
        if (message.includes('transcrib')) {
          if (message.includes('progress') || message.includes('attempt')) {
            setProgress(Math.max(progress, 50)); // Transcription progressing
          } else {
            setProgress(Math.max(progress, 30)); // Transcription started
          }
        } else if (message.includes('llm') || message.includes('generat')) {
          setProgress(Math.max(progress, 75)); // Content generation
        } else {
          setProgress(Math.max(progress, 20)); // Generic processing
        }
      } else if (status.status === 'completed') {
        setProgress(100);
        setPollingActive(false);
      } else if (status.status === 'error') {
        setPollingActive(false);
      }
    }
  }, [status, progress]);

  // Fallback status polling - if parent component's polling fails
  const pollStatus = useCallback(async () => {
    if (!jobId || !pollingActive) return;
    
    try {
      const apiUrl = settings.llmApiUrl || process.env.REACT_APP_AGENT_API_URL || 'http://localhost:8001';
      const response = await fetch(`${apiUrl}/status/${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache',
        },
        // Adding a cache-busting query parameter
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const statusData = await response.json();
      setLocalStatus(statusData);
      setLastUpdated(Date.now());
      setRetryCount(0);
      
      // Update progress based on status
      if (statusData.status === 'completed') {
        setProgress(100);
        setPollingActive(false);
      } else if (statusData.status === 'error') {
        setPollingActive(false);
      }
    } catch (error) {
      console.error("Error polling job status:", error);
      setRetryCount(prev => prev + 1);
      
      // After 3 retries, show an error toast but keep trying
      if (retryCount === 3) {
        toast.error("Having trouble connecting to the server. Will keep trying...");
      }
      
      // If many retries (15+), slow down polling to reduce load
      if (retryCount > 15) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s
      }
    }
  }, [jobId, pollingActive, settings.llmApiUrl, retryCount]);
  
  // Set up polling if parent component isn't providing status updates
  useEffect(() => {
    let pollTimer;
    const timeSinceLastUpdate = Date.now() - lastUpdated;
    
    // If we haven't received a status update in 10 seconds, start our own polling
    if (timeSinceLastUpdate > 10000 && pollingActive) {
      toast.info("Taking over status polling due to connection issues", { id: 'polling-takeover' });
      pollTimer = setInterval(pollStatus, 5000); // Poll every 5 seconds
    }
    
    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [lastUpdated, pollStatus, pollingActive]);

  // Progress bar color based on stage
  const getProgressBarColor = () => {
    if (localStatus && localStatus.status === 'error') return 'bg-red-600';
    if (progress < 30) return 'bg-blue-600 dark:bg-blue-500';
    if (progress < 70) return 'bg-indigo-600 dark:bg-indigo-500';
    return 'bg-indigo-600 dark:bg-purple-600';
  };

  // Status indicator text and color
  const getStatusIndicator = () => {
    if (retryCount > 3) {
      return {
        text: 'Connection issues - still working',
        color: 'text-yellow-600 dark:text-yellow-400'
      };
    }
    
    if (localStatus) {
      const text = localStatus.status.charAt(0).toUpperCase() + localStatus.status.slice(1);
      let color = 'text-gray-700 dark:text-gray-300';
      
      if (localStatus.status === 'completed') {
        color = 'text-green-600 dark:text-green-400';
      } else if (localStatus.status === 'error') {
        color = 'text-red-600 dark:text-red-400';
      } else if (progress > 0) {
        color = 'text-indigo-600 dark:text-indigo-400';
      }
      
      return { text, color };
    }
    
    return {
      text: 'Initializing...',
      color: 'text-gray-700 dark:text-gray-300'
    };
  };

  const statusIndicator = getStatusIndicator();

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">Processing Your Content</h2>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <span className={`text-sm font-medium ${statusIndicator.color}`}>
            Status: {statusIndicator.text}
            {retryCount > 3 && (
              <span className="inline-block ml-2 animate-pulse">
                <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            )}
          </span>
          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{Math.floor(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 transition-colors duration-300">
          <div 
            className={`h-2.5 rounded-full ${getProgressBarColor()} transition-all duration-700 ease-in-out`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Activity:</h3>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded border border-gray-200 dark:border-gray-600 transition-colors duration-300">
          <p className="text-gray-700 dark:text-gray-300">
            {localStatus && localStatus.message 
              ? localStatus.message 
              : retryCount > 3 
                ? "Still processing your request. Status updates may be delayed."
                : "Preparing your request..."}
          </p>
        </div>
      </div>
      
      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800 mb-6 transition-colors duration-300">
        <h3 className="font-semibold text-indigo-700 dark:text-indigo-400 mb-2">What's happening:</h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start">
            <span className={`mr-2 ${progress >= 10 ? 'text-green-500 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
              {progress >= 10 ? '✓' : '○'}
            </span>
            <span className={progress >= 10 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}>
              Job queued and processing started
            </span>
          </li>
          <li className="flex items-start">
            <span className={`mr-2 ${progress >= 30 ? 'text-green-500 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
              {progress >= 30 ? '✓' : '○'}
            </span>
            <span className={progress >= 30 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}>
              Audio transcription in progress
            </span>
          </li>
          <li className="flex items-start">
            <span className={`mr-2 ${progress >= 70 ? 'text-green-500 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
              {progress >= 70 ? '✓' : '○'}
            </span>
            <span className={progress >= 70 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}>
              {localStatus?.content_type === 'blog' ? 'Generating blog post' : 'Generating social media content'}
            </span>
          </li>
          <li className="flex items-start">
            <span className={`mr-2 ${progress >= 100 ? 'text-green-500 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
              {progress >= 100 ? '✓' : '○'}
            </span>
            <span className={progress >= 100 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}>
              Content generation completed
            </span>
          </li>
        </ul>
      </div>
      
      {localStatus && localStatus.status === 'error' && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800 transition-colors duration-300">
          <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">Error:</h3>
          <p className="text-red-700 dark:text-red-400">{localStatus.message}</p>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Please refresh the page and try again. If the problem persists, check your API keys and input.
          </p>
        </div>
      )}
      
      {retryCount > 3 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800 transition-colors duration-300 mt-6">
          <h3 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2">Connection Notice:</h3>
          <p className="text-yellow-700 dark:text-yellow-400">
            Experiencing some connection issues with the server. Don't worry - your job is still processing, and we'll keep trying to get updates.
          </p>
        </div>
      )}
      
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6 transition-colors duration-300">
        <p>Job ID: {jobId}</p>
        <p className="mt-1">This process may take a few minutes. Please don't close this window.</p>
      </div>
    </div>
  );
};

export default ProcessingStatus;