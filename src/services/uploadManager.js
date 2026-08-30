import toast from 'react-hot-toast';
import { filesApi } from '../api/files';
import { apiErrorMessage } from '../api/client';
import { useUiStore } from '../store/uiStore';
import { formatBytes } from '../utils/format';
import { loadActiveUploads } from '../utils/uploadPersistence';
import {
  clearUploadFile,
  loadUploadFile,
  saveUploadFile,
} from '../utils/uploadStorage';
import { TransferSpeedTracker } from '../utils/transferSpeed';

const CHUNK_SIZE = 2 * 1024 * 1024;

/** @type {Map<string, { file: File, serverId: string, targetPath: string, uploadId: string, paused: boolean, abortController: AbortController | null }>} */
const sessions = new Map();
/** @type {Map<string, TransferSpeedTracker>} */
const speedTrackers = new Map();
const restoringRef = { promise: null };

function getSpeedTracker(itemId, startBytes = 0) {
  let tracker = speedTrackers.get(itemId);
  if (!tracker) {
    tracker = new TransferSpeedTracker();
    speedTrackers.set(itemId, tracker);
  }
  tracker.reset(startBytes);
  return tracker;
}

function sampleSpeed(itemId, bytes, total) {
  let tracker = speedTrackers.get(itemId);
  if (!tracker) {
    tracker = new TransferSpeedTracker();
    speedTrackers.set(itemId, tracker);
  }
  tracker.sample(bytes);
  return tracker.metrics(bytes, total);
}

function clearSpeedTracker(itemId) {
  speedTrackers.delete(itemId);
}

function findPendingItem(file) {
  return useUiStore
    .getState()
    .uploads.find((u) => u.name === file.name && u.size === file.size && u.status === 'pending');
}

async function attachSession(item, file) {
  const session = {
    file,
    serverId: item.serverId,
    targetPath: item.targetPath,
    uploadId: item.uploadId,
    paused: item.status === 'paused',
    abortController: null,
  };
  sessions.set(item.id, session);
  return session;
}

async function restoreSessionForItem(item) {
  if (sessions.has(item.id)) return sessions.get(item.id);
  if (!item.uploadId || !item.serverId || !item.targetPath) return null;

  const file = await loadUploadFile(item.id);
  if (!file) return null;

  return attachSession(item, file);
}

async function syncUploadOffset(itemId, session) {
  const item = useUiStore.getState().uploads.find((u) => u.id === itemId);
  const { updateUpload } = useUiStore.getState();
  if (!item || !session) return item?.uploadedBytes ?? 0;

  try {
    const data = await filesApi.getChunkUploadStatus(session.serverId, {
      path: session.targetPath,
      uploadId: session.uploadId,
    });
    const received = data.received ?? 0;
    const total = session.file?.size ?? item.size ?? 0;
    updateUpload(itemId, {
      uploadedBytes: received,
      progress: total ? Math.min(100, Math.round((received / total) * 100)) : 0,
    });
    return received;
  } catch {
    return item.uploadedBytes ?? 0;
  }
}

/** After abort, the server may still finish writing the in-flight chunk — poll until stable. */
async function syncUploadOffsetAfterPause(itemId, session) {
  let received = await syncUploadOffset(itemId, session);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const next = await syncUploadOffset(itemId, session);
    if (next === received) break;
    received = next;
  }
  return received;
}

async function uploadFileChunks(session, itemId) {
  const { file, serverId, targetPath, uploadId } = session;
  const { updateUpload } = useUiStore.getState();

  let offset = await syncUploadOffset(itemId, session);
  getSpeedTracker(itemId, offset);

  while (offset < file.size) {
    if (session.paused) {
      offset = await syncUploadOffsetAfterPause(itemId, session);
      clearSpeedTracker(itemId);
      updateUpload(itemId, {
        status: 'paused',
        uploadedBytes: offset,
        progress: file.size ? Math.round((offset / file.size) * 100) : 0,
        speedBps: 0,
        etaSeconds: null,
        error: null,
      });
      return;
    }

    const end = Math.min(offset + CHUNK_SIZE, file.size);
    const chunk = file.slice(offset, end);
    const controller = new AbortController();
    session.abortController = controller;

    if (session.paused) {
      updateUpload(itemId, { status: 'paused', error: null });
      return;
    }

    updateUpload(itemId, { status: 'uploading', error: null });

    try {
      const result = await filesApi.uploadChunk(
        serverId,
        {
          path: targetPath,
          uploadId,
          fileName: file.name,
          totalSize: file.size,
          offset,
        },
        chunk,
        controller.signal,
        (loaded) => {
          if (session.paused) return;
          const sent = offset + loaded;
          const { speedBps, etaSeconds } = sampleSpeed(itemId, sent, file.size);
          updateUpload(itemId, {
            uploadedBytes: sent,
            progress: file.size ? Math.min(100, Math.round((sent / file.size) * 100)) : 0,
            status: 'uploading',
            speedBps,
            etaSeconds,
          });
        }
      );

      offset = result.received ?? end;
      const { speedBps, etaSeconds } = sampleSpeed(itemId, offset, file.size);

      if (result.complete && result.uploaded) {
        const saved = result.uploaded;
        clearSpeedTracker(itemId);
        updateUpload(itemId, {
          name: saved.name,
          progress: 100,
          uploadedBytes: file.size,
          status: 'done',
          speedBps: 0,
          etaSeconds: null,
          error: null,
        });
        sessions.delete(itemId);
        await clearUploadFile(itemId);
        useUiStore.getState().expandUploadTray();
        return saved;
      }

      updateUpload(itemId, {
        uploadedBytes: offset,
        progress: file.size ? Math.min(100, Math.round((offset / file.size) * 100)) : 0,
        speedBps,
        etaSeconds,
      });
    } catch (err) {
      if (controller.signal.aborted && session.paused) {
        offset = await syncUploadOffsetAfterPause(itemId, session);
        clearSpeedTracker(itemId);
        updateUpload(itemId, {
          status: 'paused',
          uploadedBytes: offset,
          progress: file.size ? Math.round((offset / file.size) * 100) : 0,
          speedBps: 0,
          etaSeconds: null,
          error: null,
        });
        return;
      }

      const data = err?.response?.data;
      if (data?.code === 'OFFSET_MISMATCH') {
        offset =
          typeof data.expectedOffset === 'number'
            ? data.expectedOffset
            : await syncUploadOffset(itemId, session);
        updateUpload(itemId, {
          uploadedBytes: offset,
          progress: file.size ? Math.round((offset / file.size) * 100) : 0,
          status: 'uploading',
          error: null,
        });
        continue;
      }

      if (data?.code === 'INSUFFICIENT_STORAGE') {
        toast.error(
          `Not enough space for ${file.name} — ${formatBytes(data.freeBytes)} free, need ${formatBytes(data.requiredBytes || file.size)}.`
        );
      }
      updateUpload(itemId, {
        status: 'error',
        error: apiErrorMessage(err, 'Upload failed'),
        speedBps: 0,
        etaSeconds: null,
      });
      clearSpeedTracker(itemId);
      sessions.delete(itemId);
      throw err;
    }
  }
}

export function hasUploadSession(itemId) {
  return sessions.has(itemId);
}

export function canResumeUpload(item) {
  return item.status === 'paused' && Boolean(item.uploadId);
}

export async function restorePersistedUploads() {
  if (restoringRef.promise) return restoringRef.promise;

  restoringRef.promise = (async () => {
    const persisted = loadActiveUploads();
    const { updateUpload } = useUiStore.getState();

    for (const item of persisted) {
      if (item.status === 'done' || item.status === 'error') continue;
      if (sessions.has(item.id)) continue;
      if (!item.uploadId || !item.serverId || !item.targetPath) continue;

      const normalizedStatus =
        item.status === 'processing' || item.status === 'pending' ? 'uploading' : item.status;

      if (normalizedStatus !== item.status) {
        updateUpload(item.id, { status: normalizedStatus, error: null });
      }

      const session = await restoreSessionForItem({ ...item, status: normalizedStatus });
      if (!session) {
        if (normalizedStatus === 'uploading' || normalizedStatus === 'paused') {
          updateUpload(item.id, {
            status: 'paused',
            error: 'Re-select this file to continue uploading',
          });
        }
        continue;
      }

      if (normalizedStatus === 'uploading') {
        session.paused = false;
        uploadFileChunks(session, item.id).catch(() => {});
      } else if (normalizedStatus === 'paused') {
        updateUpload(item.id, { status: 'paused', error: null });
      }
    }

    if (persisted.length) {
      useUiStore.getState().expandUploadTray();
    }
  })().finally(() => {
    restoringRef.promise = null;
  });

  return restoringRef.promise;
}

export async function pauseUpload(itemId) {
  const session = sessions.get(itemId);
  if (!session) return;
  session.paused = true;
  session.abortController?.abort();
  await syncUploadOffsetAfterPause(itemId, session);
  clearSpeedTracker(itemId);
  useUiStore.getState().updateUpload(itemId, {
    status: 'paused',
    speedBps: 0,
    etaSeconds: null,
    error: null,
  });
}

export async function resumeUpload(itemId) {
  await restorePersistedUploads();

  const item = useUiStore.getState().uploads.find((u) => u.id === itemId);
  if (!item) return;

  let session = sessions.get(itemId);
  if (!session) {
    session = await restoreSessionForItem(item);
  }

  if (!session) {
    toast.error('Cannot resume — pick the same file again to continue');
    return;
  }

  session.paused = false;
  getSpeedTracker(itemId, item.uploadedBytes ?? 0);
  await syncUploadOffset(itemId, session);
  useUiStore.getState().updateUpload(itemId, { status: 'uploading', error: null });
  uploadFileChunks(session, itemId).catch(() => {});
}

export async function cancelUpload(itemId) {
  const session = sessions.get(itemId);
  session?.abortController?.abort();
  sessions.delete(itemId);
  clearSpeedTracker(itemId);
  await clearUploadFile(itemId);
  useUiStore.getState().removeUpload(itemId);
}

export async function startUploads(fileList, serverId, targetPath, { onSaved } = {}) {
  const files = [...fileList];
  const { addUploads } = useUiStore.getState();
  addUploads(files, serverId);

  let hadError = false;

  for (const file of files) {
    const item = findPendingItem(file);
    if (!item) continue;

    const uploadId = crypto.randomUUID();
    const { updateUpload } = useUiStore.getState();

    updateUpload(item.id, {
      uploadId,
      serverId,
      targetPath,
      status: 'uploading',
      progress: 0,
      uploadedBytes: 0,
    });

    await saveUploadFile(item.id, file);

    const session = {
      file,
      serverId,
      targetPath,
      uploadId,
      paused: false,
      abortController: null,
    };
    sessions.set(item.id, session);

    try {
      const saved = await uploadFileChunks(session, item.id);
      if (saved) {
        onSaved?.(saved, file);
        toast.success(
          saved.name !== file.name ? `${file.name} saved as ${saved.name}` : `${saved.name} uploaded`
        );
      }
    } catch {
      hadError = true;
    }
  }

  if (!hadError && files.length > 1) {
    toast.success(`${files.length} files uploaded`);
  }
}
