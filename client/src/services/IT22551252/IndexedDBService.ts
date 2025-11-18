export interface Lesson {
  id: string;
  title: string;
  timestamp: number;
  nodes: any[];
  links: any[];
  script: string;
}
class IndexedDBServiceClass {
  private dbName = 'educationalSceneGenerator';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  async connect(): Promise<void> {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onerror = () => reject(new Error('Failed to open database'));
      request.onsuccess = event => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('lessons')) {
          db.createObjectStore('lessons', {
            keyPath: 'id'
          });
        }
      };
    });
  }
  async saveLesson(lesson: Lesson): Promise<string> {
    await this.connect();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      const transaction = this.db.transaction('lessons', 'readwrite');
      const store = transaction.objectStore('lessons');
      const request = store.put(lesson);
      request.onerror = () => reject(new Error('Failed to save lesson'));
      request.onsuccess = () => resolve(lesson.id);
    });
  }
  async getLessons(): Promise<Lesson[]> {
    await this.connect();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      const transaction = this.db.transaction('lessons', 'readonly');
      const store = transaction.objectStore('lessons');
      const request = store.getAll();
      request.onerror = () => reject(new Error('Failed to retrieve lessons'));
      request.onsuccess = () => resolve(request.result);
    });
  }
  async getLesson(id: string): Promise<Lesson> {
    await this.connect();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      const transaction = this.db.transaction('lessons', 'readonly');
      const store = transaction.objectStore('lessons');
      const request = store.get(id);
      request.onerror = () => reject(new Error('Failed to retrieve lesson'));
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          reject(new Error('Lesson not found'));
        }
      };
    });
  }
  async deleteLesson(id: string): Promise<void> {
    await this.connect();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      const transaction = this.db.transaction('lessons', 'readwrite');
      const store = transaction.objectStore('lessons');
      const request = store.delete(id);
      request.onerror = () => reject(new Error('Failed to delete lesson'));
      request.onsuccess = () => resolve();
    });
  }
}
// Create a singleton instance
export const IndexedDBService = new IndexedDBServiceClass();