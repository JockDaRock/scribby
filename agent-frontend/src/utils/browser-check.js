/**
 * Browser compatibility checking utilities
 * Checks for Web Workers, WASM, IndexedDB, and WebGPU support
 */

export function checkBrowserCompatibility() {
  const checks = {
    webWorkers: typeof Worker !== 'undefined',
    wasm: typeof WebAssembly !== 'undefined',
    indexedDB: typeof indexedDB !== 'undefined',
    arrayBuffer: typeof ArrayBuffer !== 'undefined',
    webGPU: typeof navigator.gpu !== 'undefined',
  };

  const isCompatible = checks.webWorkers &&
                       checks.wasm &&
                       checks.indexedDB &&
                       checks.arrayBuffer;

  return {
    compatible: isCompatible,
    checks,
    recommendations: getRecommendations(checks)
  };
}

function getRecommendations(checks) {
  const recs = [];

  if (!checks.webWorkers) {
    recs.push('Your browser does not support Web Workers. Please update your browser.');
  }

  if (!checks.wasm) {
    recs.push('Your browser does not support WebAssembly. Please update your browser.');
  }

  if (!checks.indexedDB) {
    recs.push('Your browser does not support IndexedDB. Transcription history will not be saved.');
  }

  if (!checks.webGPU) {
    recs.push('WebGPU is not available. Transcription will use CPU (slower but still works).');
  }

  return recs;
}

export function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';

  if (ua.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
    browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    browserName = 'Safari';
    browserVersion = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Edge') > -1) {
    browserName = 'Edge';
    browserVersion = ua.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
  }

  return { browserName, browserVersion };
}

export function getRecommendedBrowsers() {
  return [
    { name: 'Chrome', minVersion: 90 },
    { name: 'Edge', minVersion: 90 },
    { name: 'Firefox', minVersion: 89 },
    { name: 'Safari', minVersion: 15 }
  ];
}
