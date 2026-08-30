const VIDEO = new Set(['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v']);
const AUDIO = new Set(['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma']);
const IMAGE = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'raw']);
const DOCS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'txt', 'md', 'csv', 'json', 'xml', 'html', 'htm',
]);

export function getExtension(name = '') {
  const i = name.lastIndexOf('.');
  if (i <= 0) return '';
  return name.slice(i + 1).toLowerCase();
}

export function getFileCategory(name, type) {
  if (type === 'directory') return 'folder';
  const ext = getExtension(name);
  if (VIDEO.has(ext)) return 'video';
  if (AUDIO.has(ext)) return 'audio';
  if (IMAGE.has(ext)) return 'image';
  if (DOCS.has(ext)) return 'docs';
  if (ext === 'zip' || ext === 'tar' || ext === 'gz' || ext === '7z' || ext === 'rar') return 'archive';
  return 'other';
}

export function previewKind(name, type) {
  if (type === 'directory') return null;
  const ext = getExtension(name);
  const category = getFileCategory(name, type);
  if (category === 'video') return 'video';
  if (category === 'audio') return 'audio';
  if (category === 'image') return 'image';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'txt' || ext === 'md' || ext === 'html' || ext === 'htm') return 'text';
  return null;
}

export function isPreviewable(name, type) {
  return previewKind(name, type) !== null;
}

export const CATEGORY_COLORS = {
  video: '#5B8CFF',
  audio: '#A78BFA',
  image: '#4ADE80',
  photos: '#4ADE80',
  docs: '#F5A462',
  documents: '#F5A462',
  other: '#8B93A7',
  folder: '#C3C6D6',
  archive: '#8B93A7',
};
