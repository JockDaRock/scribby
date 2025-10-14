/**
 * Enhanced Whisper Web Worker for browser-based transcription
 * Uses @huggingface/transformers@3.7.5 with latest Whisper ONNX models
 * Features:
 * - Word-level timestamps
 * - WebGPU acceleration when available
 * - Improved progress tracking
 * - Model caching
 * - Support for latest Whisper v3 models
 */

import { pipeline, env } from '@huggingface/transformers';

// Available Whisper models (from fastest to most accurate)
const WHISPER_MODELS = {
  'tiny': 'onnx-community/whisper-tiny',
  'tiny.en': 'onnx-community/whisper-tiny.en', 
  'base': 'onnx-community/whisper-base',
  'base.en': 'onnx-community/whisper-base.en',
  'small': 'onnx-community/whisper-small',
  'small.en': 'onnx-community/whisper-small.en',
  'medium': 'onnx-community/whisper-medium',
  'medium.en': 'onnx-community/whisper-medium.en',
  'large-v3': 'onnx-community/whisper-large-v3',
  'large-v3-turbo': 'onnx-community/whisper-large-v3-turbo', // Latest and fastest large model
};

// Configure transformers.js environment
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true; // Enable caching for better performance

// Check for WebGPU support
async function hasWebGPU() {
  if (!navigator.gpu) {
    return false;
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return !!adapter;
  } catch (e) {
    return false;
  }
}

let transcriber = null;
let isLoading = false;
let currentDevice = 'wasm'; // Default to WASM

// Detect best available device on worker startup
hasWebGPU().then((supported) => {
  currentDevice = supported ? 'webgpu' : 'wasm';
  console.log(`Whisper Worker initialized - Device: ${currentDevice}`);
  
  // eslint-disable-next-line no-restricted-globals
  self.postMessage({
    type: 'info',
    message: `Using ${currentDevice.toUpperCase()} for processing`
  });
});

/**
 * Device-specific configuration for model loading
 */
const getDeviceConfig = (device) => {
  if (device === 'webgpu') {
    return {
      dtype: {
        encoder_model: 'fp32',
        decoder_model_merged: 'q4',
      },
      device: 'webgpu',
    };
  }
  return {
    dtype: 'q8',
    device: 'wasm',
  };
};

/**
 * Load the Whisper model with device-specific optimizations
 * Default: whisper-base (good balance of speed and accuracy)
 */
async function loadModel(modelName = 'onnx-community/whisper-base', device = null) {
  const targetDevice = device || currentDevice;
  
  if (isLoading) {
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({
      type: 'info',
      message: 'Model is already loading...'
    });
    return transcriber;
  }

  if (transcriber) {
    console.log('Using cached transcriber');
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({
      type: 'ready',
      message: 'Model already loaded'
    });
    return transcriber;
  }

  try {
    isLoading = true;
    
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({
      type: 'loading',
      message: `Loading ${modelName} for ${targetDevice.toUpperCase()}...`
    });

    const config = getDeviceConfig(targetDevice);

    transcriber = await pipeline('automatic-speech-recognition', modelName, {
      ...config,
      progress_callback: (progress) => {
        // Enhanced progress tracking
        const percentage = Math.round(progress.progress || 0);
        
        // eslint-disable-next-line no-restricted-globals
        self.postMessage({
          type: progress.status === 'progress' ? 'progress' : 'initiate',
          stage: 'model_loading',
          progress: percentage,
          file: progress.file || '',
          loaded: progress.loaded || 0,
          total: progress.total || 0,
          status: progress.status
        });
      }
    });

    isLoading = false;
    
    // Warm up the model for WebGPU
    if (targetDevice === 'webgpu') {
      // eslint-disable-next-line no-restricted-globals
      self.postMessage({
        type: 'loading',
        message: 'Warming up model (WebGPU)...'
      });
      
      // Run a small inference to compile shaders
      await transcriber(new Float32Array(16_000), {
        language: 'en',
        return_timestamps: false,
      });
    }
    
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({
      type: 'ready',
      message: 'Model loaded and ready'
    });

    return transcriber;
  } catch (error) {
    console.error('Model loading error:', error);
    isLoading = false;
    
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({
      type: 'error',
      error: `Failed to load model: ${error.message}`
    });
    throw error;
  }
}

/**
 * Transcribe audio data with word-level timestamps
 */
async function transcribe(audioData, options = {}) {
  try {
    const model = await loadModel(options.model || 'onnx-community/whisper-base', options.device);
    
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({
      type: 'progress',
      stage: 'transcribing',
      progress: 0,
      message: 'Starting transcription...'
    });

    const transcribeOptions = {
      // Language handling
      language: options.language === 'auto' ? undefined : options.language?.toLowerCase(),
      task: options.translate ? 'translate' : 'transcribe',
      
      // Timestamp configuration - word-level timestamps
      return_timestamps: options.timestamp !== false ? 'word' : false,
      
      // Chunking configuration for better handling of long audio
      chunk_length_s: 30,
      stride_length_s: 5,
    };

    const output = await model(audioData, transcribeOptions);

    // eslint-disable-next-line no-restricted-globals
    self.postMessage({
      type: 'progress',
      stage: 'transcribing',
      progress: 100,
      message: 'Transcription complete!'
    });

    // Format the result with word-level chunks
    const result = {
      text: output.text || '',
      chunks: output.chunks || [],
      language: output.language || options.language || 'auto'
    };

    // eslint-disable-next-line no-restricted-globals
    self.postMessage({
      type: 'complete',
      result: result
    });
  } catch (error) {
    console.error('Transcription error:', error);
    
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({
      type: 'error',
      error: `Transcription failed: ${error.message}`
    });
  }
}

/**
 * Handle messages from main thread
 */
// eslint-disable-next-line no-restricted-globals
self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'load':
      await loadModel(data?.model, data?.device);
      break;

    case 'transcribe':
      await transcribe(data.audio, data.options);
      break;

    case 'unload':
      transcriber = null;
      isLoading = false;
      // eslint-disable-next-line no-restricted-globals
      self.postMessage({ 
        type: 'unloaded', 
        message: 'Model unloaded from memory' 
      });
      break;

    case 'check_device':
      // eslint-disable-next-line no-restricted-globals
      self.postMessage({
        type: 'device_info',
        device: currentDevice
      });
      break;

    default:
      // eslint-disable-next-line no-restricted-globals
      self.postMessage({
        type: 'error',
        error: `Unknown message type: ${type}`
      });
  }
});

// Log worker initialization
console.log('Enhanced Whisper Worker initialized');
console.log('Transformers.js version:', env.version || 'Latest');
