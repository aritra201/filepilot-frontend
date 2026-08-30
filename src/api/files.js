import { api, transferTimeoutMs, unwrap, getAccessToken, API_BASE } from './client';
import { getExtension } from '../utils/fileTypes';

const CHUNK_FALLBACK_BYTES = 2 * 1024 * 1024;

export const filesApi = {
  list: (serverId, path) =>
    api.get(`/servers/${serverId}/files`, { params: { path } }).then(unwrap),
  mkdir: (serverId, path) =>
    api.post(`/servers/${serverId}/files/mkdir`, { path }).then(unwrap),
  rename: (serverId, path, newName) =>
    api.patch(`/servers/${serverId}/files/rename`, { path, newName }).then(unwrap),
  remove: (serverId, path) =>
    api.delete(`/servers/${serverId}/files`, { data: { path } }).then(unwrap),
  copy: (serverId, srcPath, destPath) =>
    api.post(`/servers/${serverId}/files/copy`, { srcPath, destPath }).then(unwrap),
  move: (serverId, srcPath, destPath) =>
    api.post(`/servers/${serverId}/files/move`, { srcPath, destPath }).then(unwrap),
  info: (serverId, path) =>
    api.get(`/servers/${serverId}/files/info`, { params: { path } }).then(unwrap),
  upload: (serverId, path, files, { onUploadProgress, uploadId } = {}) => {
    const form = new FormData();
    form.append('path', path);
    let totalSize = 0;
    for (const file of files) {
      form.append('files', file);
      totalSize += file.size;
    }
    form.append('totalSize', String(totalSize));
    return api
      .post(`/servers/${serverId}/files/upload`, form, {
        onUploadProgress,
        timeout: transferTimeoutMs(totalSize),
        headers: uploadId ? { 'X-Upload-Id': uploadId } : undefined,
      })
      .then(unwrap);
  },
  uploadChunk: (serverId, meta, chunkBlob, signal, onUploadProgress) => {
    const form = new FormData();
    form.append('path', meta.path);
    form.append('uploadId', meta.uploadId);
    form.append('fileName', meta.fileName);
    form.append('totalSize', String(meta.totalSize));
    form.append('offset', String(meta.offset));
    form.append('chunk', chunkBlob, meta.fileName);
    return api
      .post(`/servers/${serverId}/files/upload-chunk`, form, {
        signal,
        onUploadProgress: onUploadProgress
          ? (e) => onUploadProgress(e.loaded ?? 0)
          : undefined,
        timeout: transferTimeoutMs(Math.max(chunkBlob.size, CHUNK_FALLBACK_BYTES)),
      })
      .then(unwrap);
  },
  getChunkUploadStatus: (serverId, { path, uploadId }) =>
    api
      .get(`/servers/${serverId}/files/upload-chunk/status`, {
        params: { path, uploadId },
      })
      .then(unwrap),
  getUploadProgress: (serverId, uploadId) =>
    api.get(`/servers/${serverId}/files/upload-progress/${uploadId}`).then(unwrap),
  pollUploadProgress(serverId, uploadId, onProgress, intervalMs = 500) {
    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      try {
        const data = await api
          .get(`/servers/${serverId}/files/upload-progress/${uploadId}`, {
            params: { _: Date.now() },
          })
          .then(unwrap);
        onProgress(data);
      } catch {
        /* progress not registered yet */
      }
    };
    const timer = setInterval(tick, intervalMs);
    tick();
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  },
  downloadUrl(serverId, path) {
    const token = getAccessToken();
    const params = new URLSearchParams({ path });
    if (token) params.set('access_token', token);
    return `${API_BASE}/servers/${serverId}/files/download?${params.toString()}`;
  },
  downloadUrlFrom(url) {
    try {
      const parsed = new URL(url, window.location.origin);
      const token = getAccessToken();
      if (token) parsed.searchParams.set('access_token', token);
      else parsed.searchParams.delete('access_token');
      return parsed.toString();
    } catch {
      return url;
    }
  },
  streamPreviewUrl(serverId, path, name = '') {
    const token = getAccessToken();
    const params = new URLSearchParams({ path });
    if (token) params.set('access_token', token);
    return `${API_BASE}/servers/${serverId}/files/stream?${params.toString()}`;
  },
  streamBlob: async (serverId, path, name = '') => {
    const res = await api.get(`/servers/${serverId}/files/stream`, {
      params: { path },
      responseType: 'blob',
      timeout: transferTimeoutMs(100 * 1024 * 1024),
    });
    const ext = getExtension(name || path);
    const headerType = res.headers['content-type'] || '';
    const contentType =
      headerType && headerType !== 'application/octet-stream'
        ? headerType.split(';')[0].trim()
        : ext === 'pdf'
          ? 'application/pdf'
          : res.data.type || 'application/octet-stream';
    const blob =
      res.data instanceof Blob && res.data.type === contentType
        ? res.data
        : new Blob([res.data], { type: contentType });
    return {
      url: URL.createObjectURL(blob),
      type: contentType,
    };
  },
};
