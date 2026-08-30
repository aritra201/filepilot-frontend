import { useState } from 'react';
import { CheckCircle2, Loader2, Pause, Play, X, XCircle } from 'lucide-react';
import { pauseUpload, resumeUpload, cancelUpload, hasUploadSession, canResumeUpload } from '../services/uploadManager';
import { useUiStore } from '../store/uiStore';
import { formatBytes } from '../utils/format';
import { ConfirmDialog } from '../ui/ConfirmDialog';

function progressLabel(item) {
  if (item.status === 'paused') {
    return `Paused · ${formatBytes(item.uploadedBytes || 0)} / ${formatBytes(item.size)}`;
  }
  if (item.status === 'done') return `${formatBytes(item.size)} uploaded`;
  if (item.status === 'processing') {
    return `Sending to server: ${formatBytes(item.uploadedBytes || 0)} / ${formatBytes(item.size)}`;
  }
  if (item.status === 'error') return item.error || 'Upload failed';
  return `Sending to server: ${formatBytes(item.uploadedBytes || 0)} / ${formatBytes(item.size)}`;
}

function isActive(item) {
  return ['uploading', 'paused', 'processing', 'pending'].includes(item.status);
}

export function UploadTray() {
  const uploads = useUiStore((s) => s.uploads);
  const dismissTransferTray = useUiStore((s) => s.dismissTransferTray);
  const [cancelTarget, setCancelTarget] = useState(null);

  return (
    <>
    <div className="overflow-hidden rounded-2xl border border-border bg-surface/90 shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-medium text-on-surface">Uploads</p>
        <button
          type="button"
          onClick={dismissTransferTray}
          className="rounded p-1 text-text-muted hover:bg-surface-high hover:text-on-surface"
          aria-label="Close uploads panel"
        >
          <X className="size-4" />
        </button>
      </div>
      <ul className="max-h-64 space-y-3 overflow-y-auto p-4">
        {uploads.map((item) => {
          const live = hasUploadSession(item.id);
          const showPause = item.status === 'uploading' && live;
          const showResume = canResumeUpload(item);
          const showSpinner = item.status === 'uploading' && !live && !item.error;

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
