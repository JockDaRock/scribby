import React, { useState, useEffect, useContext } from 'react';
import { SettingsContext } from './SettingsContext';

const DebugPanel = () => {
  const { settings } = useContext(SettingsContext);
  const [debugInfo, setDebugInfo] = useState({
    localStorageModel: null,
    contextModel: null,
    envModel: null,
    cacheStorageKeys: [],
    transformersVersion: null,
  });

  useEffect(() => {
    const loadDebugInfo = async () => {
      // Get localStorage settings
      const savedSettings = localStorage.getItem('apiSettings');
      let localStorageModel = null;
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          localStorageModel = parsed.whisperModel;
        } catch (e) {
          localStorageModel = 'Error parsing localStorage';
        }
      }

      // Get Cache Storage keys
      let cacheStorageKeys = [];
      try {
        const cacheNames = await caches.keys();
        cacheStorageKeys = cacheNames;
      } catch (e) {
        cacheStorageKeys = ['Error accessing Cache Storage: ' + e.message];
      }

      // Get transformers.js version
      let transformersVersion = 'Unknown';
      try {
        const { env } = await import('@huggingface/transformers');
        transformersVersion = env.version || 'Version not available';
      } catch (e) {
        transformersVersion = 'Error loading transformers: ' + e.message;
      }

      setDebugInfo({
        localStorageModel,
        contextModel: settings.whisperModel,
        envModel: process.env.REACT_APP_DEFAULT_WHISPER_MODEL,
        cacheStorageKeys,
        transformersVersion,
      });
    };

    loadDebugInfo();
  }, [settings.whisperModel]);

  const clearAllCache = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('apiSettings');

      // Clear all Cache Storage
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));

      // Clear IndexedDB
      const dbs = await window.indexedDB.databases();
      dbs.forEach(db => {
        window.indexedDB.deleteDatabase(db.name);
      });

      alert('All caches cleared! Please refresh the page.');
      window.location.reload();
    } catch (e) {
      alert('Error clearing cache: ' + e.message);
    }
  };

  return (
    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 my-4">
      <h3 className="text-lg font-bold text-yellow-800 mb-3">🔍 Debug Information</h3>

      <div className="space-y-2 text-sm font-mono">
        <div>
          <span className="font-semibold">Transformers.js Version:</span>{' '}
          <span className="text-blue-700">{debugInfo.transformersVersion}</span>
        </div>

        <div>
          <span className="font-semibold">Environment Variable (REACT_APP_DEFAULT_WHISPER_MODEL):</span>{' '}
          <span className="text-blue-700">{debugInfo.envModel || 'Not set'}</span>
        </div>

        <div>
          <span className="font-semibold">Settings Context (settings.whisperModel):</span>{' '}
          <span className="text-green-700">{debugInfo.contextModel || 'Not set'}</span>
        </div>

        <div>
          <span className="font-semibold">localStorage (apiSettings.whisperModel):</span>{' '}
          <span className="text-purple-700">{debugInfo.localStorageModel || 'Not set'}</span>
        </div>

        <div>
          <span className="font-semibold">Cache Storage Keys:</span>
          {debugInfo.cacheStorageKeys.length > 0 ? (
            <ul className="ml-4 mt-1">
              {debugInfo.cacheStorageKeys.map((key, idx) => (
                <li key={idx} className="text-red-700">• {key}</li>
              ))}
            </ul>
          ) : (
            <span className="text-gray-500 ml-2">No caches found</span>
          )}
        </div>
      </div>

      <button
        onClick={clearAllCache}
        className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
      >
        🗑️ Clear All Caches & Reload
      </button>

      <div className="mt-3 text-xs text-yellow-700">
        <strong>Note:</strong> If these values don't match, there's a settings synchronization issue.
      </div>
    </div>
  );
};

export default DebugPanel;
