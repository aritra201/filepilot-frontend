import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Loader2, Pause, Play, X, XCircle } from 'lucide-react';
import { cancelDownload, pauseDownload, resumeDownload } from '../services/downloadManager';
import { useUiStore } from '../store/uiStore';
import { formatBytes } from '../utils/format';
import { ConfirmDialog } from '../ui/ConfirmDialog';

function progressLabel(item) {
  if (item.status === 'paused') {
    return `Paused · ${formatBytes(item.downloadedBytes || 0)} / ${formatBytes(item.size)}`;
  }
  if (item.status === 'done') return `${formatBytes(item.downloadedBytes || item.size)} downloaded`;
  if (item.status === 'error') return item.error || 'Download failed';
  if (item.size > 0) {
    return `${formatBytes(item.downloadedBytes || 0)} / ${formatBytes(item.size)}`;
  }
  return `${formatBytes(item.downloadedBytes || 0)} received`;
}

function isActive(item) {
  return item.status === 'downloading' || item.status === 'paused';
}

function traySummary(downloads) {
  const active = downloads.filter(isActive);
  if (active.length) {
    const total = active.reduce((sum, item) => sum + (item.size || 0), 0);
    const done = active.reduce((sum, item) => sum + (item.downloadedBytes || 0), 0);
    const pct = total ? Math.round((done / total) * 100) : 0;
    return `${active.length} active · ${pct}%`;
  }
  const failed = downloads.filter((item) => item.status === 'error').length;
  if (failed) return `${downloads.length} finished · ${failed} failed`;
  return `${downloads.length} complete`;
}

export function DownloadTray() {
  const downloads = useUiStore((s) => s.downloads);
  const minimized = useUiStore((s) => s.downloadTrayMinimized);
  const minimizeDownloadTray = useUiStore((s) => s.minimizeDownloadTray);
  const expandDownloadTray = useUiStore((s) => s.expandDownloadTray);
  const clearFinishedDownloads = useUiStore((s) => s.clearFinishedDownloads);
  const [cancelTarget, setCancelTarget] = useState(null);

  const hasActive = downloads.some(isActive);

  if (minimized) {
    return (
      <button
        type="button"
        onClick={expandDownloadTray}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-surface/90 px-4 py-3 text-left shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-md transition-colors hover:bg-surface-high/90"
        aria-label="Expand downloads panel"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-on-surface">Downloads</p>
          <p className="truncate text-[11px] text-text-muted">{traySummary(downloads)}</p>
        </div>
        <ChevronUp className="size-4 shrink-0 text-text-muted" />
      </button>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface/90 shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-on-surface">Downloads</p>
          {hasActive ? (
            <button
              type="button"
              onClick={minimizeDownloadTray}
              className="rounded p-1 text-text-muted hover:bg-surface-high hover:text-on-surface"
              aria-label="Minimize downloads panel"
            >
              <ChevronDown className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={clearFinishedDownloads}
              className="rounded p-1 text-text-muted hover:bg-surface-high hover:text-on-surface"
              aria-label="Dismiss completed downloads"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <ul className="max-h-64 space-y-3 overflow-y-auto p-4">
          {downloads.map((item) => (
            <li key={item.id}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="truncate text-xs text-on-surface">{item.name}</p>
                <div className="flex shrink-0 items-center gap-1.5">
                  {item.status === 'downloading' && (
                    <>
                      <button
                        type="button"
                        onClick={() => pauseDownload(item.id)}
                        className="rounded p-0.5 text-text-muted hover:text-on-surface"
                        aria-label="Pause download"
                      >
                        <Pause className="size-3.5" />
                      </button>
                      <Loader2 className="size-4 animate-spin text-primary" />
                    </>
                  )}
                  {item.status === 'paused' && (
                    <button
                      type="button"
                      onClick={() => resumeDownload(item)}
                      className="rounded p-0.5 text-primary hover:text-primary/80"
                      aria-label="Resume download"
                    >
                      <Play className="size-3.5" />
                    </button>
                  )}
                  {item.status === 'done' && <CheckCircle2 className="size-4 text-photos" />}
                  {item.status === 'error' && <XCircle className="size-4 text-destructive" />}
                  {isActive(item) && (
                    <button
                      type="button"
                      onClick={() => setCancelTarget(item)}
                      className="rounded px-1 text-[10px] font-medium text-destructive hover:bg-destructive/10"
                      aria-label="Cancel download"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              <p className="mb-1.5 text-[11px] text-text-muted">{progressLabel(item)}</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-highest">
                <div
                  className={`h-full rounded-full transition-[width] duration-200 ${
                    item.status === 'error'
                      ? 'bg-destructive'
                      : item.status === 'done'
                        ? 'bg-photos'
                        : item.status === 'paused'
                          ? 'bg-text-muted'
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
            </li>
          ))}
        </ul>
      </div>

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel download?"
        message={
          cancelTarget
            ? `Stop downloading "${cancelTarget.name}"? Any progress will be lost and cannot be resumed.`
            : ''
        }
        confirmLabel="Stop download"
        danger
        onConfirm={() => {
          if (cancelTarget) cancelDownload(cancelTarget.id);
          setCancelTarget(null);
        }}
      />
    </>
  );
}
