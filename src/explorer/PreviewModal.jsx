import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { filesApi } from '../api/files';
import { apiErrorMessage } from '../api/client';
import { previewKind } from '../utils/fileTypes';
import { Button } from '../ui/Button';
import { PageSpinner } from '../ui/Spinner';

const STREAMING_KINDS = new Set(['video', 'audio']);

/** Mobile Safari, Chrome (Android/iOS), and other touch browsers. */
function isMobilePlayback() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    /Android|iPhone|iPad|iPod|CriOS|Mobile Safari/i.test(ua) ||
    window.matchMedia?.('(pointer: coarse)').matches
  );
}

export function PreviewModal({ open, serverId, entry, onClose, onDownload }) {
  const [mediaUrl, setMediaUrl] = useState(null);
  const [blob, setBlob] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const kind = entry ? previewKind(entry.name, entry.type) : null;
  const usesDirectStream = kind && STREAMING_KINDS.has(kind);
  const mobilePlayback = isMobilePlayback();

  useEffect(() => {
    if (!open || !entry || !serverId || !kind) return undefined;

    let objectUrl;
    setLoading(true);
    setError('');
    setBlob(null);
    setMediaUrl(null);
    setTextContent('');

    if (usesDirectStream) {
      setMediaUrl(filesApi.streamPreviewUrl(serverId, entry.path, entry.name));
      return undefined;
    }

    filesApi
      .streamBlob(serverId, entry.path, entry.name)
      .then(async (result) => {
        objectUrl = result.url;
        if (kind === 'text') {
          const text = await fetch(result.url).then((r) => r.text());
          setTextContent(text);
        }
        setBlob(result);
      })
      .catch((err) => setError(apiErrorMessage(err, 'Could not load preview')))
      .finally(() => setLoading(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, serverId, entry, kind, usesDirectStream]);

  if (!open || !entry) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" aria-hidden="true" />
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="truncate text-sm font-medium text-on-surface">{entry.name}</p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => onDownload(entry)}>
              <Download className="size-4" />
              Download
            </Button>
            <button type="button" onClick={onClose} className="rounded-md p-1 text-text-muted hover:bg-surface-high">
              <X className="size-5" />
            </button>
          </div>
        </div>
        <div className="relative flex min-h-[320px] items-center justify-center overflow-auto bg-background p-4">
          {loading && !mediaUrl && <PageSpinner />}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {blob && kind === 'image' && (
            <img src={blob.url} alt={entry.name} className="max-h-[70vh] max-w-full object-contain" />
          )}
          {mediaUrl && kind === 'video' && (
            <>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <PageSpinner />
                </div>
              )}
              <video
                key={mediaUrl}
                src={mediaUrl}
                controls
                autoPlay={!mobilePlayback}
                preload={mobilePlayback ? 'metadata' : 'auto'}
                playsInline
                className="max-h-[70vh] w-full"
                onLoadedMetadata={() => setLoading(false)}
                onCanPlay={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError('Could not play video');
                }}
              />
            </>
          )}
          {mediaUrl && kind === 'audio' && (
            <>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <PageSpinner />
                </div>
              )}
              <audio
                key={mediaUrl}
                src={mediaUrl}
                controls
                autoPlay={!mobilePlayback}
                preload={mobilePlayback ? 'metadata' : 'auto'}
                className="w-full"
                onLoadedMetadata={() => setLoading(false)}
                onCanPlay={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError('Could not play audio');
                }}
              />
            </>
          )}
          {blob && kind === 'pdf' && (
            <embed
              src={blob.url}
              type="application/pdf"
              title={entry.name}
              className="h-[70vh] w-full rounded-lg bg-white"
            />
          )}
          {blob && kind === 'text' && (
            <pre className="max-h-[70vh] w-full overflow-auto rounded-lg bg-surface p-4 text-left text-sm text-on-surface whitespace-pre-wrap">
              {textContent}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
