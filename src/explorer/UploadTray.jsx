import { CheckCircle2, Loader2, X, XCircle } from 'lucide-react';
import { useResumeUploads } from '../hooks/useResumeUploads';
import { useUiStore } from '../store/uiStore';
import { formatBytes } from '../utils/format';

function progressLabel(item) {
  if (item.status === 'done') return `${formatBytes(item.size)} uploaded`;
  if (item.status === 'processing') {
    if ((item.uploadedBytes || 0) >= item.size) {
      return 'Sent · saving to remote server…';
    }
    return `Saving to remote server: ${formatBytes(item.uploadedBytes || 0)} / ${formatBytes(item.size)}`;
  }
  if (item.status === 'error') return 'Upload failed';
  return `Sending to server: ${formatBytes(item.uploadedBytes || 0)} / ${formatBytes(item.size)}`;
}

export function UploadTray() {
  useResumeUploads();
  const uploads = useUiStore((s) => s.uploads);
  const clearFinishedUploads = useUiStore((s) => s.clearFinishedUploads);

  if (!uploads.length) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface/90 shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-medium text-on-surface">Uploads</p>
        <button type="button" onClick={clearFinishedUploads} className="text-text-muted hover:text-on-surface">
          <X className="size-4" />
        </button>
      </div>
      <ul className="max-h-64 space-y-3 overflow-y-auto p-4">
        {uploads.map((item) => (
          <li key={item.id}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="truncate text-xs text-on-surface">{item.name}</p>
              {item.status === 'processing' && (
                <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
              )}
              {item.status === 'done' && <CheckCircle2 className="size-4 shrink-0 text-photos" />}
              {item.status === 'error' && <XCircle className="size-4 shrink-0 text-destructive" />}
            </div>
            <p className="mb-1.5 text-[11px] text-text-muted">{progressLabel(item)}</p>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-highest">
              <div
                className={`h-full rounded-full transition-[width] duration-200 ${
                  item.status === 'error'
                    ? 'bg-destructive'
                    : item.status === 'done'
                      ? 'bg-photos'
                      : 'bg-primary-container'
                }`}
                style={{ width: `${item.progress}%` }}
              />
            </div>
            {item.error && <p className="mt-1 text-[11px] text-destructive">{item.error}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
