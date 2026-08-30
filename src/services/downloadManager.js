import toast from 'react-hot-toast';
import { filesApi } from '../api/files';
import { refreshAccessToken } from '../api/client';
import { useUiStore } from '../store/uiStore';
import { clearPersistedDownload, persistActiveDownloads } from '../utils/downloadPersistence';
import {
  appendDownloadChunk,
  buildDownloadBlob,
  clearDownloadStorage,
  getStoredBytes,
} from '../utils/downloadStorage';
import { TransferSpeedTracker } from '../utils/transferSpeed';

const activeControllers = new Map();
const abortReasons = new Map();
const runningIds = new Set();
/** @type {Map<string, TransferSpeedTracker>} */
const speedTrackers = new Map();
const FLUSH_BYTES = 512 * 1024;

function getSpeedTracker(id, startBytes = 0) {
  let tracker = speedTrackers.get(id);
  if (!tracker) {
    tracker = new TransferSpeedTracker();
    speedTrackers.set(id, tracker);
  }
  tracker.reset(startBytes);
  return tracker;
}

function sampleSpeed(id, bytes, total) {
  let tracker = speedTrackers.get(id);
  if (!tracker) {
    tracker = new TransferSpeedTracker();
    speedTrackers.set(id, tracker);
  }
  tracker.sample(bytes);
  return tracker.metrics(bytes, total);
}

function clearSpeedTracker(id) {
  speedTrackers.delete(id);
}

function parseFilename(res, fallback) {
  const disposition = res.headers.get('content-disposition') || '';
  const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i);
  return decodeURIComponent(match?.[1] || fallback);
}

function parseTotalBytes(res, startByte, fallbackSize) {
  const range = res.headers.get('Content-Range');
  if (range) {
    const match = /\/(\d+)$/.exec(range);
    if (match) return parseInt(match[1], 10);
  }
  const partial = parseInt(res.headers.get('Content-Length') || '0', 10);
  if (partial > 0 && startByte > 0) return partial + startByte;
  return fallbackSize || partial || 0;
}

function syncDownloads() {
  persistActiveDownloads(useUiStore.getState().downloads);
}

async function fetchDownload(url, signal, startByte = 0) {
  const headers = startByte > 0 ? { Range: `bytes=${startByte}-` } : undefined;
  let res = await fetch(url, { credentials: 'include', signal, headers });

  if (res.status === 401) {
    const body = await res.clone().json().catch(() => ({}));
    if (body.code === 'TOKEN_EXPIRED') {
      await refreshAccessToken();
      res = await fetch(filesApi.downloadUrlFrom(url), { credentials: 'include', signal, headers });
    }
  }

  return res;
}

function saveBlobToDisk(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function flushMemBuffer(id, memChunks, memSize) {
  if (!memSize) return 0;
  const merged = new Uint8Array(memSize);
  let offset = 0;
  for (const chunk of memChunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return appendDownloadChunk(id, merged);
}

export function cancelDownload(id) {
  abortReasons.set(id, 'cancelled');
  activeControllers.get(id)?.abort();
  activeControllers.delete(id);
  runningIds.delete(id);
  abortReasons.delete(id);
  clearDownloadStorage(id);
  clearPersistedDownload(id);
  clearSpeedTracker(id);
  useUiStore.getState().removeDownload(id);
}

export function pauseDownload(id) {
  if (!runningIds.has(id)) return;
  abortReasons.set(id, 'paused');
  activeControllers.get(id)?.abort();
}

export function startDownload({ serverId, path, name, size = 0 }) {
  const id = `${name}-${size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { addDownload } = useUiStore.getState();

  addDownload({
    id,
    serverId,
    path,
    name,
    size,
    downloadedBytes: 0,
    progress: 0,
    status: 'downloading',
    error: null,
    speedBps: 0,
    etaSeconds: null,
    startedAt: Date.now(),
  });

  getSpeedTracker(id, 0);

  syncDownloads();
  launchDownload(id, serverId, path, name, size);
  return id;
}

export function resumeDownload(item) {
  if (runningIds.has(item.id)) return;
  abortReasons.delete(item.id);
  getSpeedTracker(item.id, item.downloadedBytes ?? 0);
  useUiStore.getState().updateDownload(item.id, {
    status: 'downloading',
    error: null,
    speedBps: 0,
    etaSeconds: null,
  });
  launchDownload(item.id, item.serverId, item.path, item.name, item.size);
}

function launchDownload(id, serverId, path, name, size) {
  const controller = new AbortController();
  activeControllers.set(id, controller);
  runningIds.add(id);

  runDownload(id, serverId, path, name, size, controller.signal).finally(() => {
    activeControllers.delete(id);
    runningIds.delete(id);
  });
}

async function runDownload(id, serverId, path, name, size, signal) {
  const { updateDownload } = useUiStore.getState();
  const url = filesApi.downloadUrl(serverId, path);
  const fallbackName = name || path.split('/').pop() || 'download';

  const startByte = await getStoredBytes(id);
  getSpeedTracker(id, startByte);

  try {
    const res = await fetchDownload(url, signal, startByte);

    if (!res.ok && res.status !== 206) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Download failed (${res.status})`);
    }

    if (!res.body) {
      throw new Error('Streaming not supported in this browser');
    }

    const total = parseTotalBytes(res, startByte, size);
    const saveAs = parseFilename(res, fallbackName);
    const reader = res.body.getReader();

    let flushedTotal = startByte;
    let unflushed = 0;
    let lastProgressAt = 0;
    const memChunks = [];
    let memSize = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      memChunks.push(value);
      memSize += value.byteLength;
      unflushed += value.byteLength;

      if (memSize >= FLUSH_BYTES) {
        flushedTotal = await flushMemBuffer(id, memChunks, memSize);
        memChunks.length = 0;
        memSize = 0;
        unflushed = 0;
      }

      const now = Date.now();
      if (now - lastProgressAt >= 150) {
        lastProgressAt = now;
        const displayBytes = flushedTotal + unflushed;
        const progress = total > 0 ? Math.min(100, Math.round((displayBytes / total) * 100)) : 0;
        const { speedBps, etaSeconds } = sampleSpeed(id, displayBytes, total);
        updateDownload(id, {
          downloadedBytes: displayBytes,
          progress,
          status: 'downloading',
          speedBps,
          etaSeconds,
          error: null,
        });
        syncDownloads();
      }
    }

    if (memSize > 0) {
      await flushMemBuffer(id, memChunks, memSize);
    }

    const finalBytes = await getStoredBytes(id);
    const blob = await buildDownloadBlob(id);
    if (!blob) throw new Error('Download produced no data');

    saveBlobToDisk(blob, saveAs);
    await clearDownloadStorage(id);
    clearPersistedDownload(id);
    abortReasons.delete(id);
    clearSpeedTracker(id);

    updateDownload(id, {
      status: 'done',
      progress: 100,
      downloadedBytes: total || finalBytes,
      speedBps: 0,
      etaSeconds: null,
      error: null,
    });
    toast.success(`${saveAs} downloaded`);
    useUiStore.getState().expandDownloadTray();
  } catch (err) {
    if (signal.aborted) {
      const reason = abortReasons.get(id);
      abortReasons.delete(id);

      if (reason === 'paused') {
        const stored = await getStoredBytes(id);
        const progress = size > 0 ? Math.min(100, Math.round((stored / size) * 100)) : 0;
        clearSpeedTracker(id);
        updateDownload(id, {
          downloadedBytes: stored,
          progress,
          status: 'paused',
          speedBps: 0,
          etaSeconds: null,
          error: null,
        });
        syncDownloads();
        return;
      }

      if (reason === 'cancelled') return;
    }

    const stored = await getStoredBytes(id);
    if (stored > 0) {
      const progress = size > 0 ? Math.min(100, Math.round((stored / size) * 100)) : 0;
      updateDownload(id, {
        downloadedBytes: stored,
        progress,
        status: 'paused',
        error: 'Connection lost — tap resume to continue',
      });
      syncDownloads();
      return;
    }

    const message = err?.message || 'Download failed';
    await clearDownloadStorage(id);
    clearPersistedDownload(id);
    clearSpeedTracker(id);
    updateDownload(id, {
      status: 'error',
      error: message,
      speedBps: 0,
      etaSeconds: null,
    });
    toast.error(message);
  }
}
