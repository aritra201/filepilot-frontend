import { CheckCircle2, Loader2, X, XCircle } from 'lucide-react';
import { useResumeDownloads } from '../hooks/useResumeDownloads';
import { cancelDownload } from '../services/downloadManager';
import { useUiStore } from '../store/uiStore';
import { formatBytes } from '../utils/format';

function progressLabel(item) {
  if (item.status === 'done') return `${formatBytes(item.downloadedBytes || item.size)} downloaded`;
  if (item.status === 'error') return 'Download failed';
  if (item.error && item.status === 'downloading') return item.error;
  if (item.size > 0) {
    return `${formatBytes(item.downloadedBytes || 0)} / ${formatBytes(item.size)}`;
  }
  return `${formatBytes(item.downloadedBytes || 0)} received`;
}

export function DownloadTray() {
  useResumeDownloads();
  const downloads = useUiStore((s) => s.downloads);
  const clearFinishedDownloads = useUiStore((s) => s.clearFinishedDownloads);

  if (!downloads.length) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface/90 shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-medium text-on-surface">Downloads</p>
        <button
          type="button"
          onClick={clearFinishedDownloads}
          className="text-text-muted hover:text-on-surface"
          aria-label="Clear finished downloads"
        >
          <X className="size-4" />
        </button>
      </div>
      <ul className="max-h-64 space-y-3 overflow-y-auto p-4">
        {downloads.map((item) => (
          <li key={item.id}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="truncate text-xs text-on-surface">{item.name}</p>
              {item.status === 'downloading' && (
                <div className="flex shrink-0 items-center gap-1">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <button
                    type="button"
                    onClick={() => cancelDownload(item.id)}
                    className="rounded p-0.5 text-text-muted hover:text-on-surface"
                    aria-label="Cancel download"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
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
                style={{
                  width: `${
                    item.status === 'done'
                      ? 100
                      : item.size > 0
                        ? item.progress
                        : item.downloadedBytes > 0
                          ? 100
                          : 0
                  }%`,
                }}
              />
            </div>
            {item.error && <p className="mt-1 text-[11px] text-destructive">{item.error}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
