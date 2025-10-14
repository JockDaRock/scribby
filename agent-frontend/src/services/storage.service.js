/**
 * Storage Service
 * Manages local storage of transcriptions using IndexedDB
 */

class StorageService {
  constructor() {
    this.dbName = 'scribby-transcriptions';
    this.version = 1;
    this.db = null;
  }

  /**
   * Initialize IndexedDB
   */
  async initialize() {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store for transcriptions
        if (!db.objectStoreNames.contains('transcriptions')) {
          const store = db.createObjectStore('transcriptions', {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('title', 'title', { unique: false });
          store.createIndex('language', 'language', { unique: false });
        }

        // Create object store for settings
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Save a transcription
   */
  async saveTranscription(data) {
    await this.initialize();

    const transcription = {
      ...data,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['transcriptions'], 'readwrite');
      const store = transaction.objectStore('transcriptions');
      const request = store.add(transcription);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a transcription by ID
   */
  async getTranscription(id) {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['transcriptions'], 'readonly');
      const store = transaction.objectStore('transcriptions');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all transcriptions
   */
  async listTranscriptions(limit = 50) {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['transcriptions'], 'readonly');
      const store = transaction.objectStore('transcriptions');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev'); // Newest first

      const results = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && count < limit) {
          results.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update a transcription
   */
  async updateTranscription(id, updates) {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['transcriptions'], 'readwrite');
      const store = transaction.objectStore('transcriptions');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (!data) {
          reject(new Error('Transcription not found'));
          return;
        }

        const updated = { ...data, ...updates };
        const putRequest = store.put(updated);

        putRequest.onsuccess = () => resolve(putRequest.result);
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Delete a transcription
   */
  async deleteTranscription(id) {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['transcriptions'], 'readwrite');
      const store = transaction.objectStore('transcriptions');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all transcriptions
   */
  async clearAllTranscriptions() {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['transcriptions'], 'readwrite');
      const store = transaction.objectStore('transcriptions');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['transcriptions'], 'readonly');
      const store = transaction.objectStore('transcriptions');
      const countRequest = store.count();

      countRequest.onsuccess = () => {
        resolve({
          count: countRequest.result,
          dbName: this.dbName,
          version: this.version
        });
      };

      countRequest.onerror = () => reject(countRequest.error);
    });
  }

  /**
   * Save a setting
   */
  async saveSetting(key, value) {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a setting
   */
  async getSetting(key, defaultValue = null) {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : defaultValue);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
export default new StorageService();
