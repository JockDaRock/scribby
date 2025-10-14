/**
 * React hook for managing transcription state and operations
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import transcriptionService from '../services/transcription.service';
import storageService from '../services/storage.service';

export function useTranscription() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [progress, setProgress] = useState({
    stage: '',
    progress: 0,
    message: ''
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const abortControllerRef = useRef(null);

  /**
   * Load transcription history
   */
  const loadHistory = useCallback(async () => {
    try {
      const transcriptions = await storageService.listTranscriptions();
      setHistory(transcriptions);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }, []);

  /**
   * Preload model for faster transcription
   */
  const preloadModel = useCallback(async (modelName) => {
    try {
      setIsModelLoading(true);
      setError(null);
      await transcriptionService.preloadModel(modelName);
      setIsModelLoading(false);
    } catch (err) {
      setIsModelLoading(false);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Transcribe audio file
   */
  const transcribeFile = useCallback(async (file, options = {}) => {
    try {
      setIsTranscribing(true);
      setError(null);
      setResult(null);
      setProgress({ stage: 'starting', progress: 0, message: 'Preparing...' });

      const transcriptionResult = await transcriptionService.transcribeFile(file, {
        ...options,
        onProgress: (progressData) => {
          setProgress(progressData);
        }
      });

      setResult(transcriptionResult);
      setIsTranscribing(false);

      // Save to history
      try {
        await storageService.saveTranscription({
          title: file.name,
          text: transcriptionResult.text,
          chunks: transcriptionResult.chunks,
          language: transcriptionResult.language || options.language,
          model: options.model,
          duration: options.duration
        });
        await loadHistory();
      } catch (storageErr) {
        console.warn('Failed to save transcription to history:', storageErr);
      }

      return transcriptionResult;
    } catch (err) {
      setIsTranscribing(false);
      setError(err.message);
      throw err;
    }
  }, [loadHistory]);

  /**
   * Transcribe from URL
   */
  const transcribeUrl = useCallback(async (url, options = {}) => {
    try {
      setIsTranscribing(true);
      setError(null);
      setResult(null);
      setProgress({ stage: 'starting', progress: 0, message: 'Fetching audio...' });

      const transcriptionResult = await transcriptionService.transcribeFromUrl(url, {
        ...options,
        onProgress: (progressData) => {
          setProgress(progressData);
        }
      });

      setResult(transcriptionResult);
      setIsTranscribing(false);

      // Save to history
      try {
        await storageService.saveTranscription({
          title: url,
          text: transcriptionResult.text,
          chunks: transcriptionResult.chunks,
          language: transcriptionResult.language || options.language,
          model: options.model,
          sourceUrl: url
        });
        await loadHistory();
      } catch (storageErr) {
        console.warn('Failed to save transcription to history:', storageErr);
      }

      return transcriptionResult;
    } catch (err) {
      setIsTranscribing(false);
      setError(err.message);
      throw err;
    }
  }, [loadHistory]);

  /**
   * Transcribe from microphone
   */
  const transcribeFromMicrophone = useCallback(async (durationSeconds = 60, options = {}) => {
    try {
      setIsTranscribing(true);
      setError(null);
      setResult(null);
      setProgress({ stage: 'recording', progress: 0, message: 'Recording...' });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const transcriptionResult = await transcriptionService.transcribeFromStream(stream, durationSeconds, {
        ...options,
        onProgress: (progressData) => {
          setProgress(progressData);
        }
      });

      setResult(transcriptionResult);
      setIsTranscribing(false);

      // Save to history
      try {
        await storageService.saveTranscription({
          title: `Microphone Recording ${new Date().toLocaleString()}`,
          text: transcriptionResult.text,
          chunks: transcriptionResult.chunks,
          language: transcriptionResult.language || options.language,
          model: options.model,
          source: 'microphone'
        });
        await loadHistory();
      } catch (storageErr) {
        console.warn('Failed to save transcription to history:', storageErr);
      }

      return transcriptionResult;
    } catch (err) {
      setIsTranscribing(false);
      setError(err.message);
      throw err;
    }
  }, [loadHistory]);

  /**
   * Clear current result
   */
  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress({ stage: '', progress: 0, message: '' });
  }, []);

  /**
   * Delete from history
   */
  const deleteFromHistory = useCallback(async (id) => {
    try {
      await storageService.deleteTranscription(id);
      await loadHistory();
    } catch (err) {
      console.error('Failed to delete from history:', err);
      throw err;
    }
  }, [loadHistory]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(async () => {
    try {
      await storageService.clearAllTranscriptions();
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
      throw err;
    }
  }, []);

  /**
   * Check if model is ready
   */
  const isModelReady = useCallback(() => {
    return transcriptionService.isReady();
  }, []);

  /**
   * Load history on mount
   */
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    isTranscribing,
    isModelLoading,
    progress,
    result,
    error,
    history,

    // Actions
    transcribeFile,
    transcribeUrl,
    transcribeFromMicrophone,
    preloadModel,
    clearResult,
    deleteFromHistory,
    clearHistory,
    loadHistory,
    isModelReady
  };
}

export default useTranscription;
