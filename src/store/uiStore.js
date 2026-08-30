import { create } from 'zustand';
import { persistActiveUploads, clearPersistedUpload } from '../utils/uploadPersistence';
import { persistActiveDownloads, clearPersistedDownload } from '../utils/downloadPersistence';

function syncPersist(uploads) {
  persistActiveUploads(uploads);
}

export const useUiStore = create((set) => ({
  sidebarOpen: false,
  pageTitle: 'My Servers',
  showSearch: false,
  searchQuery: '',
  reconnect: { open: false, serverId: null },
  uploads: [],
  downloads: [],

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setPageTitle: (pageTitle) => set({ pageTitle }),
  setShowSearch: (showSearch) => set({ showSearch }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  promptReconnect: (serverId) => set({ reconnect: { open: true, serverId } }),
  closeReconnect: () => set({ reconnect: { open: false, serverId: null } }),

  addUploads: (files, serverId = null) =>
    set((state) => {
      const uploads = [
        ...state.uploads,
        ...files.map((file) => ({
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
          uploadId: null,
          serverId,
          name: file.name,
          size: file.size,
          uploadedBytes: 0,
          progress: 0,
          status: 'pending',
          error: null,
        })),
      ];
      syncPersist(uploads);
      return { uploads };
    }),
  updateUpload: (id, patch) =>
    set((state) => {
      const uploads = state.uploads.map((item) => (item.id === id ? { ...item, ...patch } : item));
      if (patch.status === 'done' || patch.status === 'error') {
        clearPersistedUpload(id);
      } else {
        syncPersist(uploads);
      }
      return { uploads };
    }),
  clearFinishedUploads: () =>
    set((state) => {
      const uploads = state.uploads.filter(
        (item) =>
          item.status === 'uploading' ||
          item.status === 'pending' ||
          item.status === 'processing'
      );
      syncPersist(uploads);
      return { uploads };
    }),

  addDownload: (item) =>
    set((state) => {
      const downloads = [...state.downloads, item];
      persistActiveDownloads(downloads);
      return { downloads };
    }),
  updateDownload: (id, patch) =>
    set((state) => {
      const downloads = state.downloads.map((item) => (item.id === id ? { ...item, ...patch } : item));
      if (patch.status === 'done' || patch.status === 'error') {
        clearPersistedDownload(id);
      } else {
        persistActiveDownloads(downloads);
      }
      return { downloads };
    }),
  clearFinishedDownloads: () =>
    set((state) => {
      const downloads = state.downloads.filter((item) => item.status === 'downloading');
      persistActiveDownloads(downloads);
      return { downloads };
    }),
}));
