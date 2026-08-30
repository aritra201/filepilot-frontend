import { useEffect } from 'react';
import { resumeDownload } from '../services/downloadManager';
import { useUiStore } from '../store/uiStore';
import { loadActiveDownloads } from '../utils/downloadPersistence';

export function useResumeDownloads() {
  useEffect(() => {
    const persisted = loadActiveDownloads();
    if (!persisted.length) return;

    const { downloads, updateDownload } = useUiStore.getState();
    const merged = [...downloads];

    for (const item of persisted) {
      if (!merged.some((d) => d.id === item.id)) {
        merged.push({ ...item, error: item.status === 'paused' ? null : item.error ?? null });
      } else {
        const idx = merged.findIndex((d) => d.id === item.id);
        merged[idx] = {
          ...merged[idx],
          ...item,
          status: item.status === 'paused' ? 'paused' : merged[idx].status,
          error: null,
        };
      }
    }

    useUiStore.setState({ downloads: merged });

    for (const item of persisted) {
      if (item.status === 'paused') continue;
      if (item.status !== 'downloading') continue;
      updateDownload(item.id, { status: 'downloading', error: 'Resuming…' });
      resumeDownload(item);
    }
  }, []);
}
