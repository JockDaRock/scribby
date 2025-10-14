/**
 * MediaInput Component
 * Handles video/audio file input and playback with seek functionality
 * Based on Xenova whisper-speaker-diarization but without speaker diarization
 */

import React, { useRef, useState, useEffect } from 'react';

const MediaInput = ({ file, onFileChange, onSeek, currentTime }) => {
  const mediaRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);

  useEffect(() => {
    if (file) {
      // Create object URL for the file
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
      
      // Determine if it's audio or video
      const type = file.type.startsWith('video/') ? 'video' : 'audio';
      setMediaType(type);

      // Cleanup
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  // Sync media element time with currentTime prop (for clicking timestamps)
  useEffect(() => {
    if (mediaRef.current && currentTime !== undefined && currentTime !== null) {
      mediaRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current && onSeek) {
      onSeek(mediaRef.current.currentTime);
    }
  };

  const handlePlayPause = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && onFileChange) {
      onFileChange(selectedFile);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {!file ? (
        // File Upload Section
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center hover:border-purple-500 dark:hover:border-purple-400 transition-colors">
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center space-y-4">
              <div className="text-6xl">☁️</div>
              <div className="text-lg text-gray-700 dark:text-gray-300">
                <span className="font-semibold text-purple-600 dark:text-purple-400">Click to upload</span>
                {' '}or drag and drop
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Audio: MP3, WAV, M4A, FLAC, OGG | Video: MP4, MOV, AVI, MPEG
              </div>
            </div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept="audio/*,video/*"
              onChange={handleFileSelect}
            />
          </label>
        </div>
      ) : (
        // Media Player Section
        <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
          {mediaType === 'video' ? (
            <video
              ref={mediaRef}
              src={mediaUrl}
              className="w-full"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              controls
            />
          ) : (
            <div className="relative w-full h-48 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <audio
                ref={mediaRef}
                src={mediaUrl}
                className="hidden"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              <div className="text-white text-center">
                <div className="text-6xl mb-4">🎵</div>
                <div className="text-xl font-semibold">{file.name}</div>
                <div className="text-sm opacity-75 mt-2">
                  {formatTime(currentTime || 0)} / {formatTime(duration)}
                </div>
              </div>
            </div>
          )}

          {/* Custom Controls for Audio */}
          {mediaType === 'audio' && (
            <div className="p-4 bg-gray-800 border-t border-gray-700">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePlayPause}
                  className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center transition-colors"
                >
                  {isPlaying ? (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime || 0}
                    onChange={(e) => {
                      if (mediaRef.current) {
                        mediaRef.current.currentTime = parseFloat(e.target.value);
                      }
                    }}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #9333ea 0%, #9333ea ${((currentTime || 0) / (duration || 1)) * 100}%, #374151 ${((currentTime || 0) / (duration || 1)) * 100}%, #374151 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{formatTime(currentTime || 0)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* File Info and Change Button */}
          <div className="p-4 bg-gray-800 border-t border-gray-700 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium truncate">{file.name}</div>
              <div className="text-gray-400 text-sm">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • {formatTime(duration)}
              </div>
            </div>
            <label htmlFor="file-change" className="cursor-pointer">
              <div className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium">
                Change File
              </div>
              <input
                id="file-change"
                type="file"
                className="hidden"
                accept="audio/*,video/*"
                onChange={handleFileSelect}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaInput;