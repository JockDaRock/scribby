/**
 * ContentTranscriber Component
 * Main component for the enhanced transcription feature
 * Combines MediaInput, transcription processing, and InteractiveTranscript
 * Based on Xenova whisper-speaker-diarization but without speaker diarization
 */

import React, { useState, useCallback } from 'react';
import MediaInput from './MediaInput';
import InteractiveTranscript from './InteractiveTranscript';
import TranscriptionProgress from './TranscriptionProgress';
import { useTranscription } from '../hooks/useTranscription';

const ContentTranscriber = () => {
  const [file, setFile] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [language, setLanguage] = useState('english');
  
  const {
    transcribeFile,
    result,
    isTranscribing,
    progress,
    error,
    clearResult
  } = useTranscription();

  const handleFileChange = useCallback((newFile) => {
    setFile(newFile);
    clearResult(); // Clear previous transcription
  }, [clearResult]);

  const handleTranscribe = async () => {
    if (!file) return;

    try {
      await transcribeFile(file, {
        language: language === 'auto' ? null : language,
        task: 'transcribe',
        model: 'onnx-community/whisper-base',
        return_timestamps: true
      });
    } catch (err) {
      console.error('Transcription error:', err);
    }
  };

  const handleTimestampClick = useCallback((time) => {
    setCurrentTime(time);
  }, []);

  const handleSeek = useCallback((time) => {
    setCurrentTime(time);
  }, []);

  const handleClearAndStartOver = () => {
    setFile(null);
    setCurrentTime(0);
    clearResult();
  };

  // Format segments from word-level timestamps to sentence-level segments
  const formatSegments = useCallback(() => {
    if (!result?.chunks || result.chunks.length === 0) {
      return [];
    }

    const segments = [];
    let currentSegment = null;

    result.chunks.forEach((chunk) => {
      if (!currentSegment) {
        currentSegment = {
          start: chunk.timestamp[0],
          end: chunk.timestamp[1],
          text: chunk.text
        };
      } else {
        // If there's a significant pause (> 1 second), start a new segment
        const timeSinceLastWord = chunk.timestamp[0] - currentSegment.end;
        
        if (timeSinceLastWord > 1.0) {
          segments.push(currentSegment);
          currentSegment = {
            start: chunk.timestamp[0],
            end: chunk.timestamp[1],
            text: chunk.text
          };
        } else {
          // Continue the current segment
          currentSegment.end = chunk.timestamp[1];
          currentSegment.text += chunk.text;
        }
      }
    });

    // Push the last segment
    if (currentSegment) {
      segments.push(currentSegment);
    }

    return segments;
  }, [result]);

  const segments = formatSegments();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Whisper Transcription
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            In-browser automatic speech recognition with word-level timestamps
          </p>
        </div>

        {/* Content Source Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Input audio/video
          </h2>

          <MediaInput
            file={file}
            onFileChange={handleFileChange}
            onSeek={handleSeek}
            currentTime={currentTime}
          />
        </div>

        {/* Controls Section */}
        {file && !result && (
          <div className="flex items-center justify-center gap-4 my-8">
            <div className="flex items-center gap-3">
              <label className="text-gray-700 dark:text-gray-300 font-medium">
                Language:
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isTranscribing}
              >
                <option value="english">English</option>
                <option value="auto">Auto-detect</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
                <option value="italian">Italian</option>
                <option value="portuguese">Portuguese</option>
                <option value="dutch">Dutch</option>
                <option value="russian">Russian</option>
                <option value="chinese">Chinese</option>
                <option value="japanese">Japanese</option>
                <option value="korean">Korean</option>
                <option value="arabic">Arabic</option>
                <option value="hindi">Hindi</option>
              </select>
            </div>

            <button
              onClick={handleTranscribe}
              disabled={isTranscribing || !file}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-lg"
            >
              {isTranscribing ? 'Processing...' : 'Run model'}
            </button>
          </div>
        )}

        {/* Progress Display */}
        {isTranscribing && (
          <div className="my-8">
            <TranscriptionProgress
              stage={progress.stage}
              progress={progress.progress}
              message={progress.message || (progress.stage === 'transcribing' ? 'Transcribing your audio...' : 'Loading model...')}
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="my-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800 dark:text-red-300">
                  Transcription Error
                </h3>
                <p className="mt-2 text-sm text-red-700 dark:text-red-400">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transcription Result */}
        {result && segments.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Transcription Result
              </h2>
              <button
                onClick={handleClearAndStartOver}
                className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
              >
                Clear & Start Over
              </button>
            </div>

            <InteractiveTranscript
              segments={segments}
              currentTime={currentTime}
              onTimestampClick={handleTimestampClick}
            />

            {/* Generation Time */}
            {result.processingTime && (
              <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Generation time: {result.processingTime.toFixed(2)}ms
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!file && (
          <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
              How to use
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-400">
              <li>Upload an audio or video file</li>
              <li>Select your language (or use auto-detect)</li>
              <li>Click "Run model" to start transcription</li>
              <li>View your transcript with clickable timestamps</li>
              <li>Click any timestamp to jump to that point in the media</li>
              <li>Download your transcript as a text file</li>
            </ol>
            <p className="mt-4 text-sm text-blue-700 dark:text-blue-400">
              💡 <strong>Privacy first:</strong> All processing happens in your browser. Your media files never leave your device!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentTranscriber;