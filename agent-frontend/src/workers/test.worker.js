/**
 * Simple test worker to verify Web Worker support
 */

// eslint-disable-next-line no-restricted-globals
self.addEventListener('message', (event) => {
  console.log('Worker received:', event.data);

  // eslint-disable-next-line no-restricted-globals
  self.postMessage({
    type: 'response',
    message: `Echo: ${event.data.message}`
  });
});
