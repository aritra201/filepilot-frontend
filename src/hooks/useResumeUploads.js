import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { filesApi } from '../api/files';
import { useUiStore } from '../store/uiStore';
import { loadActiveUploads, persistActiveUploads, clearPersistedUpload } from '../utils/uploadPersistence';

function applyProgress(itemId, prog, fileSize) {
  const updateUpload = useUiStore.getState().updateUpload;

  if (prog.phase === 'done') {
    updateUpload(itemId, {
      status: 'done',
      progress: 100,
      uploadedBytes: fileSize,
    });
    clearPersistedUpload(itemId);
    return true;
  }

  if (prog.phase === 'writing' && prog.total && prog.written > 0) {
    const pct = Math.round((prog.written / prog.total) * 100);
    updateUpload(itemId, {
      uploadedBytes: prog.written,
      progress: pct,
      status: 'processing',
    });
    persistActiveUploads(useUiStore.getState().uploads);
  }

  return false;
}

export function useResumeUploads() {
  const qc = useQueryClient();
  const stoppersRef = useRef([]);

  useEffect(() => {
    const persisted = loadActiveUploads();
    if (!persisted.length) return;

    const { uploads, updateUpload } = useUiStore.getState();
    const merged = [...uploads];

    for (const item of persisted) {
      if (!merged.some((u) => u.id === item.id)) {
        merged.push({ ...item, error: null });
      }
    }
    useUiStore.setState({ uploads: merged });

    for (const item of persisted) {
      if (!item.uploadId || !item.serverId) continue;
      if (item.status === 'done' || item.status === 'error') continue;

      if (item.status === 'uploading') {
        updateUpload(item.id, { status: 'processing' });
      }

      const stopPoll = filesApi.pollUploadProgress(item.serverId, item.uploadId, (prog) => {
        const finished = applyProgress(item.id, prog, item.size);
        if (finished) {
          stopPoll();
          qc.invalidateQueries({ queryKey: ['files', item.serverId] });
          toast.success(`${item.name} uploaded`);
        }
      });

      stoppersRef.current.push(stopPoll);

      filesApi
        .getUploadProgress(item.serverId, item.uploadId)
        .then((prog) => {
          if (applyProgress(item.id, prog, item.size)) {
            stopPoll();
            qc.invalidateQueries({ queryKey: ['files', item.serverId] });
            toast.success(`${item.name} uploaded`);
          }
        })
        .catch(() => {
          /* server may not have started yet */
        });
    }

    return () => {
      stoppersRef.current.forEach((stop) => stop());
      stoppersRef.current = [];
    };
  }, [qc]);
}
