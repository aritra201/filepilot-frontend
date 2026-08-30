const STORAGE_KEY = 'fp_active_uploads';

export function loadActiveUploads() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function persistActiveUploads(uploads) {
  const active = uploads.filter((item) =>
    ['pending', 'uploading', 'processing', 'paused'].includes(item.status)
  );
  if (!active.length) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      active.map((item) => ({
        id: item.id,
        uploadId: item.uploadId,
        serverId: item.serverId,
        name: item.name,
        size: item.size,
        status: item.status,
        progress: item.progress,
        uploadedBytes: item.uploadedBytes,
        targetPath: item.targetPath,
      }))
    )
  );
}

export function clearPersistedUpload(id) {
  const next = loadActiveUploads().filter((item) => item.id !== id);
  if (!next.length) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
