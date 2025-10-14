/**
 * Test utility to verify Web Worker functionality
 */

export function testWorker() {
  try {
    const worker = new Worker(
      new URL('../workers/test.worker.js', import.meta.url),
      { type: 'module' }
    );

    worker.postMessage({ message: 'Hello Worker!' });

    worker.addEventListener('message', (event) => {
      console.log('✅ Web Workers are working:', event.data);
      worker.terminate();
    });

    return true;
  } catch (error) {
    console.error('❌ Web Workers failed:', error);
    return false;
  }
}
