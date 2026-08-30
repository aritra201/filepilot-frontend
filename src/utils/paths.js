export const MNT_ROOT = '/mnt';

export function normalizePath(path) {
  if (!path || path === '/') return MNT_ROOT;
  const cleaned = `/${String(path).split('/').filter(Boolean).join('/')}`;
  return cleaned.startsWith(MNT_ROOT) ? cleaned : MNT_ROOT;
}

export function joinPath(...parts) {
  return normalizePath(parts.filter(Boolean).join('/'));
}

export function pathSegments(path) {
  return normalizePath(path).split('/').filter(Boolean);
}

export function parentPath(path) {
  const segs = pathSegments(path);
  if (segs.length <= 1) return MNT_ROOT;
  return `/${segs.slice(0, -1).join('/')}`;
}

export function basename(path) {
  const segs = pathSegments(path);
  return segs[segs.length - 1] || 'mnt';
}

export function isRootPath(path) {
  return normalizePath(path) === MNT_ROOT;
}
