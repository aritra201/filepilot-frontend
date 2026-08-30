const STORAGE_KEY = 'fp_active_downloads';

export function loadActiveDownloads() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function persistActiveDownloads(downloads) {
  const active = downloads.filter((item) => ['downloading', 'paused'].includes(item.status));
  if (!active.length) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      active.map((item) => ({
        id: item.id,
        serverId: item.serverId,
        path: item.path,
        name: item.name,
        size: item.size,
        status: item.status,
        progress: item.progress,
        downloadedBytes: item.downloadedBytes,
        startedAt: item.startedAt,
      }))
    )
  );
}

export function clearPersistedDownload(id) {
  const next = loadActiveDownloads().filter((item) => item.id !== id);
  if (!next.length) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
