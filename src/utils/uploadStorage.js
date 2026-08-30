const DB_NAME = 'fp_upload_files';
const STORE = 'files';
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

export async function saveUploadFile(id, file) {
  const db = await openDb();
  const buffer = await file.arrayBuffer();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({
      id,
      name: file.name,
      type: file.type,
      lastModified: file.lastModified,
      size: file.size,
      buffer,
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadUploadFile(id) {
  const db = await openDb();
  const record = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  if (!record?.buffer) return null;
  const blob = new Blob([record.buffer], {
    type: record.type || 'application/octet-stream',
  });
  return new File([blob], record.name, {
    type: record.type || 'application/octet-stream',
    lastModified: record.lastModified || Date.now(),
  });
}

export async function hasStoredUploadFile(id) {
  const file = await loadUploadFile(id);
  return Boolean(file);
}

export async function clearUploadFile(id) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
