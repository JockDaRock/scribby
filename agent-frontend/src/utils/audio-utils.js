/**
 * Audio utilities for processing and converting audio files
 */

/**
 * Supported audio and video formats
 * Audio can be extracted from video files automatically
 */
export const SUPPORTED_FORMATS = [
  // Audio formats
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/flac',
  'audio/aac',
  'audio/x-m4a',
  // Video formats (audio will be extracted)
  'video/mp4',
  'video/webm',
  'video/quicktime', // MOV
  'video/x-msvideo', // AVI
  'video/mpeg',
  'video/x-matroska' // MKV
];

/**
 * Check if a file is a supported audio/video format
 */
export function isSupportedAudioFormat(file) {
  if (!file) return false;

  const mimeType = file.type.toLowerCase();
  const extension = file.name.split('.').pop().toLowerCase();

  // Check MIME type
  if (SUPPORTED_FORMATS.includes(mimeType)) {
    return true;
  }

  // Check file extension as fallback (including video formats)
  const supportedExtensions = [
    // Audio
    'mp3', 'mp4', 'wav', 'webm', 'ogg', 'flac', 'm4a', 'aac',
    // Video
    'mp4', 'mov', 'avi', 'mkv', 'mpeg', 'mpg', 'webm'
  ];
  return supportedExtensions.includes(extension);
}

/**
 * Check if file is a video format
 */
export function isVideoFile(file) {
  if (!file) return false;

  const mimeType = file.type.toLowerCase();
  const extension = file.name.split('.').pop().toLowerCase();

  // Check MIME type
  if (mimeType.startsWith('video/')) {
    return true;
  }

  // Check file extension
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'mpeg', 'mpg', 'webm'];
  return videoExtensions.includes(extension);
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format duration in seconds to human-readable format
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get audio duration from a file
 */
export async function getAudioDuration(file) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);

    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(objectUrl);
      resolve(audio.duration);
    });

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load audio file'));
    });

    audio.src = objectUrl;
  });
}

/**
 * Decode audio file to Float32Array for Whisper model
 * transformers.js expects audio as Float32Array of PCM samples at 16kHz
 * Supports both audio and video files (extracts audio from video automatically)
 */
export async function decodeAudioData(file) {
  try {
    console.log('=== DECODE AUDIO START ===');
    console.log('File:', file.name);
    console.log('Type:', file.type);
    console.log('Size:', formatFileSize(file.size));
    console.log('Is video:', isVideoFile(file));

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer size:', arrayBuffer.byteLength, 'bytes');

    // Create AudioContext (Web Audio API handles audio extraction from video automatically)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 16000 // Whisper expects 16kHz
    });

    console.log('Decoding audio data...');
    // Decode audio data (this works for both audio and video files)
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    console.log('Audio decoded:');
    console.log('  - Duration:', audioBuffer.duration.toFixed(2), 'seconds');
    console.log('  - Sample rate:', audioBuffer.sampleRate, 'Hz');
    console.log('  - Channels:', audioBuffer.numberOfChannels);
    console.log('  - Length:', audioBuffer.length, 'samples');

    // Get audio data as Float32Array
    let audio;
    if (audioBuffer.numberOfChannels === 2) {
      // Convert stereo to mono by averaging channels
      console.log('Converting stereo to mono...');
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      audio = new Float32Array(left.length);
      for (let i = 0; i < left.length; i++) {
        audio[i] = (left[i] + right[i]) / 2;
      }
    } else if (audioBuffer.numberOfChannels === 1) {
      // Already mono
      console.log('Audio is already mono');
      audio = audioBuffer.getChannelData(0);
    } else {
      // Handle multi-channel audio (> 2 channels)
      console.log('Downmixing', audioBuffer.numberOfChannels, 'channels to mono...');
      audio = new Float32Array(audioBuffer.length);
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let i = 0; i < audioBuffer.length; i++) {
          audio[i] += channelData[i] / audioBuffer.numberOfChannels;
        }
      }
    }

    // Resample to 16kHz if needed
    if (audioBuffer.sampleRate !== 16000) {
      console.log('Resampling from', audioBuffer.sampleRate, 'Hz to 16000 Hz...');
      audio = await resampleAudio(audio, audioBuffer.sampleRate, 16000);
      console.log('Resampled audio length:', audio.length, 'samples');
    }

    console.log('=== DECODE AUDIO COMPLETE ===');
    console.log('Final audio:', audio.length, 'samples @16kHz');
    console.log('Duration:', (audio.length / 16000).toFixed(2), 'seconds');
    console.log('==============================');

    return audio;
  } catch (error) {
    console.error('=== DECODE AUDIO ERROR ===');
    console.error('Error:', error);
    console.error('Message:', error.message);
    console.error('==========================');
    throw new Error(`Failed to decode audio: ${error.message}`);
  }
}

/**
 * Resample audio to target sample rate
 */
async function resampleAudio(audioData, sourceSampleRate, targetSampleRate) {
  // If sample rates match, no resampling needed
  if (sourceSampleRate === targetSampleRate) {
    return audioData;
  }

  // Create offline audio context for resampling
  const offlineContext = new OfflineAudioContext(
    1, // mono
    Math.ceil(audioData.length * targetSampleRate / sourceSampleRate),
    targetSampleRate
  );

  // Create buffer with source data
  const sourceBuffer = offlineContext.createBuffer(1, audioData.length, sourceSampleRate);
  sourceBuffer.copyToChannel(audioData, 0);

  // Create and connect source
  const source = offlineContext.createBufferSource();
  source.buffer = sourceBuffer;
  source.connect(offlineContext.destination);
  source.start();

  // Render and return resampled audio
  const renderedBuffer = await offlineContext.startRendering();
  return renderedBuffer.getChannelData(0);
}

/**
 * Convert audio file to a specific format (if needed)
 */
export async function convertAudioFormat(file, targetFormat = 'audio/wav') {
  // For now, we'll return the file as-is since transformers.js handles various formats
  // This function can be extended to use Web Audio API for actual conversion if needed
  return file;
}

/**
 * Extract audio from video file
 */
export async function extractAudioFromVideo(videoFile) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    video.addEventListener('loadedmetadata', async () => {
      try {
        const source = audioContext.createMediaElementSource(video);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);

        const mediaRecorder = new MediaRecorder(destination.stream);
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], 'extracted-audio.webm', { type: 'audio/webm' });
          resolve(audioFile);
        };

        mediaRecorder.start();
        video.play();

        video.addEventListener('ended', () => {
          mediaRecorder.stop();
        });
      } catch (error) {
        reject(error);
      }
    });

    video.addEventListener('error', () => {
      reject(new Error('Failed to load video file'));
    });

    video.src = URL.createObjectURL(videoFile);
  });
}

/**
 * Validate audio file size
 */
export function validateFileSize(file, maxSizeMB = 500) {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Get estimated transcription time
 */
export function estimateTranscriptionTime(durationSeconds, model = 'tiny') {
  // Rough estimates based on model size
  const multipliers = {
    'tiny': 0.5,
    'base': 0.8,
    'small': 1.2,
    'medium': 2.0,
    'large': 3.0
  };

  const multiplier = multipliers[model] || 1.0;
  return Math.ceil(durationSeconds * multiplier);
}

/**
 * Record audio from microphone
 */
export async function recordAudio(durationSeconds = 60) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    return new Promise((resolve, reject) => {
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        resolve(file);
      };

      mediaRecorder.onerror = (event) => {
        stream.getTracks().forEach(track => track.stop());
        reject(new Error(`Recording error: ${event.error}`));
      };

      mediaRecorder.start();

      // Auto-stop after duration
      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      }, durationSeconds * 1000);
    });
  } catch (error) {
    throw new Error(`Failed to access microphone: ${error.message}`);
  }
}

/**
 * Check if browser supports audio recording
 */
export function supportsAudioRecording() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Parse language code to full name
 */
export function getLanguageName(code) {
  const languages = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'auto': 'Auto-detect'
  };

  return languages[code.toLowerCase()] || code;
}

/**
 * Available Whisper models with metadata
 */
export const WHISPER_MODELS = [
  {
    id: 'Xenova/whisper-tiny.en',
    name: 'Tiny (English only)',
    size: '150 MB',
    speed: 'Very Fast',
    languages: ['en'],
    recommended: true
  },
  {
    id: 'Xenova/whisper-tiny',
    name: 'Tiny (Multilingual)',
    size: '150 MB',
    speed: 'Very Fast',
    languages: 'all'
  },
  {
    id: 'Xenova/whisper-base.en',
    name: 'Base (English only)',
    size: '290 MB',
    speed: 'Fast',
    languages: ['en']
  },
  {
    id: 'Xenova/whisper-base',
    name: 'Base (Multilingual)',
    size: '290 MB',
    speed: 'Fast',
    languages: 'all'
  },
  {
    id: 'Xenova/whisper-small.en',
    name: 'Small (English only)',
    size: '970 MB',
    speed: 'Medium',
    languages: ['en']
  },
  {
    id: 'Xenova/whisper-small',
    name: 'Small (Multilingual)',
    size: '970 MB',
    speed: 'Medium',
    languages: 'all'
  },
  {
    id: 'onnx-community/whisper-large-v3-turbo_timestamped',
    name: 'Large V3 Turbo',
    size: '1.6 GB',
    speed: 'Slow',
    languages: 'all',
    bestQuality: true
  }
];
