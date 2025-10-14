/**
 * Test utility to verify transformers.js installation
 */

export async function testTransformersInstallation() {
  try {
    console.log('Testing @xenova/transformers installation...');

    // Dynamic import to avoid blocking
    const { env } = await import('@xenova/transformers');

    console.log('✅ Transformers.js loaded successfully');
    console.log('Environment:', {
      backends: env.backends,
      allowLocalModels: env.allowLocalModels,
      allowRemoteModels: env.allowRemoteModels
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Transformers.js test failed:', error);
    return { success: false, error: error.message };
  }
}
