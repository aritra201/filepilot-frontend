import { useEffect, useState } from 'react';
import { restorePersistedUploads } from '../services/uploadManager';
import { useUiStore } from '../store/uiStore';
import { loadActiveUploads } from '../utils/uploadPersistence';

/** Restore upload list and file sessions after page refresh. */
export function useResumeUploads() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const persisted = loadActiveUploads();
    if (!persisted.length) {
      setReady(true);
      return;
    }

    const { uploads } = useUiStore.getState();
    const merged = [...uploads];

    for (const item of persisted) {
      if (!merged.some((u) => u.id === item.id)) {
        merged.push({ ...item, error: null });
      }
    }

    useUiStore.setState({ uploads: merged });

    restorePersistedUploads().finally(() => setReady(true));
  }, []);

  return ready;
}
