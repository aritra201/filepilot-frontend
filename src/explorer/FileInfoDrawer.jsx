import { X } from 'lucide-react';
import { useFileInfo } from '../hooks/useFiles';
import { formatBytes, formatDate } from '../utils/format';
import { getFileCategory } from '../utils/fileTypes';
import { FileTypeIcon } from './fileIcons';
import { PageSpinner } from '../ui/Spinner';

export function FileInfoDrawer({ open, serverId, path, entry, onClose }) {
  const info = useFileInfo(serverId, path, open);
  const data = info.data;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <aside className="relative h-full w-full max-w-md border-l border-border bg-surface p-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
        <div className="mb-6 flex items-start justify-between">
          <h3 className="text-lg font-semibold text-on-surface">File info</h3>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-on-surface">
            <X className="size-5" />
          </button>
        </div>
        {info.isLoading && <PageSpinner />}
        {(data || entry) && (
          <div>
            <div className="mb-6 flex flex-col items-center">
              <FileTypeIcon entry={entry || { name: data?.path, type: data?.type }} size={56} />
              <p className="mt-3 text-center text-sm font-medium text-on-surface">
                {entry?.name || data?.path}
              </p>
              <p className="mt-1 text-xs text-text-muted capitalize">
                {getFileCategory(entry?.name || data?.path, data?.type || entry?.type)}
              </p>
            </div>
            <dl className="space-y-3 text-sm">
              <Row label="Path" value={data?.path || path} mono />
              <Row label="Type" value={data?.type || entry?.type} />
              <Row label="Size" value={formatBytes(data?.size ?? entry?.size)} />
              <Row label="Modified" value={formatDate(data?.mtime || entry?.mtime)} />
              {data?.permissions != null && (
                <Row label="Permissions" value={String(data.permissions)} mono />
              )}
            </dl>
          </div>
        )}
      </aside>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
      <dt className="text-text-muted">{label}</dt>
      <dd className={`text-right text-on-surface break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}
