/**
 * Transcription Service
 * High-level API for browser-based audio transcription
 */

import { decodeAudioData } from '../utils/audio-utils.js';

class TranscriptionService {
  constructor() {
    this.worker = null;
    this.currentJob = null;
    this.isModelLoaded = false;
  }

  /**
   * Initialize the Web Worker
   */
  initialize() {
    if (!this.worker) {
      this.worker = new Worker(
        new URL('../workers/whisper.worker.js', import.meta.url),
        { type: 'module' }
      );
    }
    return this.worker;
  }

  /**
   * Pre-load the model for faster transcription
   */
  async preloadModel(modelName = 'Xenova/whisper-tiny.en') {
    const worker = this.initialize();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Model loading timeout'));
      }, 300000); // 5 minute timeout

      const messageHandler = (event) => {
        const { type, message, error } = event.data;

        switch (type) {
          case 'ready':
            clearTimeout(timeout);
            worker.removeEventListener('message', messageHandler);
            this.isModelLoaded = true;
            resolve({ success: true, message });
            break;

          case 'error':
            clearTimeout(timeout);
            worker.removeEventListener('message', messageHandler);
            reject(new Error(error));
            break;

          default:
            // Continue listening for progress updates
            break;
        }
      };

      worker.addEventListener('message', messageHandler);
      worker.postMessage({ type: 'load', data: { model: modelName } });
    });
  }

  /**
   * Transcribe audio data
   */
  async transcribeAudio(audioData, options = {}) {
    const worker = this.initialize();

    return new Promise((resolve, reject) => {
      const jobId = crypto.randomUUID();
      this.currentJob = jobId;

      const timeout = setTimeout(() => {
        reject(new Error('Transcription timeout'));
      }, 600000); // 10 minute timeout

      const messageHandler = (event) => {
        const { type, result, error, progress, message, stage, file, loaded, total } = event.data;

        switch (type) {
          case 'loading':
          case 'info':
            if (options.onProgress) {
              options.onProgress({
                stage: 'loading',
                progress: 0,
                message: message || 'Loading model...'
              });
            }
            break;

          case 'progress':
            if (options.onProgress) {
              options.onProgress({
                stage: stage || 'transcribing',
                progress: progress || 0,
                message: message || '',
                file: file || '',
                loaded: loaded || 0,
                total: total || 0
              });
            }
            break;

          case 'ready':
            if (options.onProgress) {
              options.onProgress({
                stage: 'ready',
                progress: 100,
                message: 'Model ready'
              });
            }
            break;

          case 'complete':
            clearTimeout(timeout);
            worker.removeEventListener('message', messageHandler);
            this.currentJob = null;
            resolve(result);
            break;

          case 'error':
            clearTimeout(timeout);
            worker.removeEventListener('message', messageHandler);
            this.currentJob = null;
            reject(new Error(error));
            break;

          default:
            console.warn('Unknown message type from worker:', type);
        }
      };

      worker.addEventListener('message', messageHandler);

      worker.postMessage({
        type: 'transcribe',
        data: {
          audio: audioData,
          options: {
            model: options.model || process.env.REACT_APP_DEFAULT_WHISPER_MODEL || 'Xenova/whisper-tiny.en',
            language: options.language || 'auto',
            translate: options.translate || false,
            timestamp: options.timestamp !== false
          }
        }
      });
    });
  }

  /**
   * Transcribe a File object
   */
  async transcribeFile(file, options = {}) {
    try {
      // Decode audio file to Float32Array (16kHz mono PCM)
      console.log('Decoding audio file:', file.name, file.type, file.size);
      const audioData = await decodeAudioData(file);
      console.log('Audio decoded successfully:', audioData.length, 'samples');
      return await this.transcribeAudio(audioData, options);
    } catch (error) {
      throw new Error(`Failed to transcribe file: ${error.message}`);
    }
  }

  /**
   * Transcribe from a URL
   */
  async transcribeFromUrl(url, options = {}) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return await this.transcribeAudio(arrayBuffer, options);
    } catch (error) {
      throw new Error(`Failed to transcribe from URL: ${error.message}`);
    }
  }

  /**
   * Transcribe from MediaStream (microphone)
   */
  async transcribeFromStream(stream, durationSeconds = 60, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          try {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            const arrayBuffer = await blob.arrayBuffer();
            const result = await this.transcribeAudio(arrayBuffer, options);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        };

        mediaRecorder.onerror = (event) => {
          reject(new Error(`MediaRecorder error: ${event.error}`));
        };

        mediaRecorder.start();

        // Stop recording after specified duration
        setTimeout(() => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            stream.getTracks().forEach(track => track.stop());
          }
        }, durationSeconds * 1000);
      } catch (error) {
        reject(new Error(`Failed to start recording: ${error.message}`));
      }
    });
  }

  /**
   * Check if model is loaded
   */
  isReady() {
    return this.isModelLoaded;
  }

  /**
   * Unload the model to free memory
   */
  unloadModel() {
    if (this.worker) {
      this.worker.postMessage({ type: 'unload' });
      this.isModelLoaded = false;
    }
  }

  /**
   * Terminate the worker
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.currentJob = null;
      this.isModelLoaded = false;
    }
  }
}

// Export singleton instance
export default new TranscriptionService();
