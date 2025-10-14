/**
 * Transcription Progress Component
 * Displays progress for browser-based transcription
 */

import React from 'react';

const TranscriptionProgress = ({ stage, progress, message, file, loaded, total }) => {
  const stages = {
    starting: { label: 'Starting', icon: '🚀', color: 'blue' },
    model_loading: { label: 'Loading Model', icon: '📦', color: 'indigo' },
    ready: { label: 'Model Ready', icon: '✓', color: 'green' },
    transcribing: { label: 'Transcribing', icon: '🎤', color: 'purple' },
    recording: { label: 'Recording', icon: '🔴', color: 'red' },
    complete: { label: 'Complete', icon: '✅', color: 'green' }
  };

  const currentStage = stages[stage] || stages.starting;
  const progressPercentage = Math.min(Math.max(progress || 0, 0), 100);

  const formatBytes = (bytes) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2) + ' MB';
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Stage Icon and Label */}
      <div className="flex items-center justify-center mb-4">
        <span className="text-4xl mr-3">{currentStage.icon}</span>
        <h3 className={`text-xl font-semibold text-${currentStage.color}-600 dark:text-${currentStage.color}-400`}>
          {currentStage.label}
        </h3>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4 overflow-hidden">
        <div
          className={`h-full bg-${currentStage.color}-500 transition-all duration-300 ease-out rounded-full`}
          style={{
            width: `${progressPercentage}%`,
            backgroundColor: currentStage.color === 'blue' ? '#3B82F6' :
                           currentStage.color === 'indigo' ? '#6366F1' :
                           currentStage.color === 'green' ? '#10B981' :
                           currentStage.color === 'purple' ? '#8B5CF6' :
                           currentStage.color === 'red' ? '#EF4444' : '#6B7280'
          }}
        >
          <div className="h-full w-full flex items-center justify-center text-xs text-white font-semibold">
            {progressPercentage > 10 && `${progressPercentage}%`}
          </div>
        </div>
      </div>

      {/* Progress Percentage */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-2">
        {progressPercentage}% Complete
      </div>

      {/* Message */}
      {message && (
        <div className="text-center text-sm text-gray-700 dark:text-gray-300 mb-3">
          {message}
        </div>
      )}

      {/* File Download Info (for model loading) */}
      {file && (loaded || total) && (
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div>
            {file && <span className="font-mono">{file}</span>}
          </div>
          {(loaded && total) && (
            <div>
              {formatBytes(loaded)} / {formatBytes(total)}
            </div>
          )}
        </div>
      )}

      {/* Tips based on stage */}
      {stage === 'model_loading' && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 <strong>Tip:</strong> The model is being downloaded and cached. This only happens once!
            Subsequent transcriptions will be much faster.
          </p>
        </div>
      )}

      {stage === 'transcribing' && progressPercentage < 100 && (
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-xs text-purple-700 dark:text-purple-300">
            💡 <strong>Tip:</strong> Transcription is running entirely in your browser.
            Your audio never leaves your device!
          </p>
        </div>
      )}

      {/* Animated dots for active processing */}
      {stage !== 'complete' && stage !== 'ready' && (
        <div className="flex justify-center mt-4">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptionProgress;
