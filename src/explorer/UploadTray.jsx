import { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Loader2, Pause, Play, X, XCircle } from 'lucide-react';
import { pauseUpload, resumeUpload, cancelUpload, hasUploadSession, canResumeUpload } from '../services/uploadManager';
import { useUiStore } from '../store/uiStore';
import { formatBytes } from '../utils/format';
import { formatEta, formatSpeed, formatTransferStatus } from '../utils/transferSpeed';
import { ConfirmDialog } from '../ui/ConfirmDialog';

function progressLabel(item) {
  if (item.status === 'pending') return 'Waiting to start…';
  if (item.status === 'processing') {
    const detail = formatTransferStatus(
      { ...item, status: 'uploading' },
      {
        bytesKey: 'uploadedBytes',
        doneMessage: '',
        errorFallback: 'Upload failed',
      }
    );
    return detail ? `Sending to server · ${detail}` : 'Sending to server…';
  }
  return formatTransferStatus(item, {
    bytesKey: 'uploadedBytes',
    doneMessage: `${formatBytes(item.size)} uploaded`,
    errorFallback: 'Upload failed',
  });
}

function isActive(item) {
  return ['uploading', 'paused', 'processing', 'pending'].includes(item.status);
}

function traySummary(uploads) {
  const active = uploads.filter(isActive);
  if (active.length === 1 && active[0].status === 'uploading') {
    const item = active[0];
    const pct = item.size ? Math.round(((item.uploadedBytes || 0) / item.size) * 100) : 0;
    const eta = formatEta(item.etaSeconds);
    if (eta) return `${pct}% · ${eta}`;
    const speed = formatSpeed(item.speedBps);
    if (speed) return `${pct}% · ${speed}`;
    return `${pct}%`;
  }
  if (active.length) {
    const total = active.reduce((sum, item) => sum + (item.size || 0), 0);
    const done = active.reduce((sum, item) => sum + (item.uploadedBytes || 0), 0);
    const pct = total ? Math.round((done / total) * 100) : 0;
    return `${active.length} active · ${pct}%`;
  }
  const failed = uploads.filter((item) => item.status === 'error').length;
  if (failed) return `${uploads.length} finished · ${failed} failed`;
  return `${uploads.length} complete`;
}

export function UploadTray() {
  const uploads = useUiStore((s) => s.uploads);
  const minimized = useUiStore((s) => s.uploadTrayMinimized);
  const minimizeUploadTray = useUiStore((s) => s.minimizeUploadTray);
  const expandUploadTray = useUiStore((s) => s.expandUploadTray);
  const clearFinishedUploads = useUiStore((s) => s.clearFinishedUploads);
  const [cancelTarget, setCancelTarget] = useState(null);

  const hasActive = uploads.some(isActive);

  if (minimized) {
    return (
      <button
        type="button"
        onClick={expandUploadTray}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-surface/90 px-4 py-3 text-left shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-md transition-colors hover:bg-surface-high/90"
        aria-label="Expand uploads panel"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-on-surface">Uploads</p>
          <p className="truncate text-[11px] text-text-muted">{traySummary(uploads)}</p>
        </div>
        <ChevronUp className="size-4 shrink-0 text-text-muted" />
      </button>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface/90 shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-on-surface">Uploads</p>
          {hasActive ? (
            <button
              type="button"
              onClick={minimizeUploadTray}
              className="rounded p-1 text-text-muted hover:bg-surface-high hover:text-on-surface"
              aria-label="Minimize uploads panel"
            >
              <ChevronDown className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={clearFinishedUploads}
              className="rounded p-1 text-text-muted hover:bg-surface-high hover:text-on-surface"
              aria-label="Dismiss completed uploads"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <ul className="max-h-64 space-y-3 overflow-y-auto p-4">
          {uploads.map((item) => {
            const live = hasUploadSession(item.id);
            const showPause = item.status === 'uploading' && live;
            const showResume = canResumeUpload(item);
            const showSpinner = item.status === 'uploading' && !item.error;

            return (
              <li key={item.id}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-on-surface">{item.name}</p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {showPause && (
                      <button
                        type="button"
                        onClick={() => pauseUpload(item.id)}
                        className="rounded p-0.5 text-text-muted hover:text-on-surface"
                        aria-label="Pause upload"
                      >
                        <Pause className="size-3.5" />
                      </button>
                    )}
                    {showResume && (
                      <button
                        type="button"
                        onClick={() => resumeUpload(item.id)}
                        className="rounded p-0.5 text-primary hover:text-primary/80"
                        aria-label="Resume upload"
                      >
                        <Play className="size-3.5" />
                      </button>
                    )}
                    {showSpinner && <Loader2 className="size-4 animate-spin text-primary" />}
                    {item.status === 'done' && <CheckCircle2 className="size-4 text-photos" />}
                    {item.status === 'error' && <XCircle className="size-4 text-destructive" />}
                    {isActive(item) && (
                      <button
                        type="button"
                        onClick={() => setCancelTarget(item)}
                        className="rounded px-1 text-[10px] font-medium text-destructive hover:bg-destructive/10"
                        aria-label="Cancel upload"
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
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel upload?"
        message={
          cancelTarget
            ? `Stop uploading "${cancelTarget.name}"? Any progress will be lost and cannot be resumed.`
            : ''
        }
        confirmLabel="Stop upload"
        danger
        onConfirm={async () => {
          if (cancelTarget) await cancelUpload(cancelTarget.id);
          setCancelTarget(null);
        }}
      />
    </>
  );
}
