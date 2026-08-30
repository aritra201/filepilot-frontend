const DB_NAME = 'fp_downloads';
const STORE = 'parts';
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txStore(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

function idbGet(store, key) {
  return new Promise((resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(store, value) {
  return new Promise((resolve, reject) => {
    const req = store.put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function idbDelete(store, key) {
  return new Promise((resolve, reject) => {
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getStoredBytes(id) {
  const db = await openDb();
  const record = await idbGet(txStore(db, 'readonly'), id);
  return record?.downloadedBytes || 0;
}

export async function appendDownloadChunk(id, chunk) {
  const db = await openDb();
  const store = txStore(db, 'readwrite');
  const record = (await idbGet(store, id)) || { id, parts: [], downloadedBytes: 0 };
  record.parts.push(chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength));
  record.downloadedBytes += chunk.byteLength;
  await idbPut(store, record);
  return record.downloadedBytes;
}

export async function buildDownloadBlob(id) {
  const db = await openDb();
  const record = await idbGet(txStore(db, 'readonly'), id);
  if (!record?.parts?.length) return null;
  return new Blob(record.parts);
}

export async function clearDownloadStorage(id) {
  const db = await openDb();
  await idbDelete(txStore(db, 'readwrite'), id);
}
