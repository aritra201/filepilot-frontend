import { useEffect, useState } from 'react';
import { Download, Play, X } from 'lucide-react';
import { filesApi } from '../api/files';
import { apiErrorMessage } from '../api/client';
import { previewKind } from '../utils/fileTypes';
import { Button } from '../ui/Button';
import { PageSpinner } from '../ui/Spinner';

const STREAMING_KINDS = new Set(['video', 'audio']);

function isMobileBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    /Android|iPhone|iPad|iPod|CriOS|Mobile Safari/i.test(ua) ||
    window.matchMedia?.('(pointer: coarse)').matches
  );
}

function videoMimeType(name = '') {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'mp4' || ext === 'm4v') return 'video/mp4';
  if (ext === 'webm') return 'video/webm';
  if (ext === 'mov') return 'video/quicktime';
  return 'video/mp4';
}

export function PreviewModal({ open, serverId, entry, onClose, onDownload }) {
  const [streamUrl, setStreamUrl] = useState(null);
  const [streamStarted, setStreamStarted] = useState(false);
  const [blob, setBlob] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const kind = entry ? previewKind(entry.name, entry.type) : null;
  const usesDirectStream = kind && STREAMING_KINDS.has(kind);
  const mobileBrowser = isMobileBrowser();
  const isMobileVideo = mobileBrowser && kind === 'video';

  useEffect(() => {
    if (!open || !entry || !serverId || !kind) return undefined;

    let objectUrl;
    setError('');
    setBlob(null);
    setStreamUrl(null);
    setStreamStarted(!isMobileVideo);
    setTextContent('');
    setLoading(kind !== 'video' || !isMobileVideo);

    if (usesDirectStream) {
      setStreamUrl(filesApi.streamPreviewUrl(serverId, entry.path, entry.name));
      if (kind !== 'video' || !isMobileVideo) {
        setLoading(false);
      }
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
  }, [open, serverId, entry, kind, usesDirectStream, isMobileVideo]);

  if (!open || !entry) return null;

  const videoType = videoMimeType(entry.name);
  const showVideo = streamUrl && kind === 'video' && streamStarted && !error;

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center ${
        isMobileVideo ? 'p-0' : 'p-4'
      }`}
    >
      <div className="absolute inset-0 bg-black/70" aria-hidden="true" />
      <div
        className={`relative flex w-full flex-col overflow-hidden border border-border bg-surface shadow-[0_20px_40px_rgba(0,0,0,0.4)] ${
          isMobileVideo ? 'h-full max-h-full rounded-none' : 'max-h-[90vh] max-w-4xl rounded-2xl'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-5">
          <p className="min-w-0 truncate text-sm font-medium text-on-surface">{entry.name}</p>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => onDownload(entry)}>
              <Download className="size-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <button type="button" onClick={onClose} className="rounded-md p-1 text-text-muted hover:bg-surface-high">
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div
          className={`relative flex flex-1 items-center justify-center overflow-hidden bg-background ${
            isMobileVideo ? 'min-h-0 p-0' : 'min-h-[320px] overflow-auto p-4'
          }`}
        >
          {loading && !error && !showVideo && kind !== 'video' && <PageSpinner />}
          {error && (
            <div className="space-y-3 px-6 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="secondary" size="sm" onClick={() => onDownload(entry)}>
                Download instead
              </Button>
            </div>
          )}

          {blob && kind === 'image' && (
            <img src={blob.url} alt={entry.name} className="max-h-[70vh] max-w-full object-contain" />
          )}

          {streamUrl && kind === 'video' && !streamStarted && !error && (
            <div className="flex flex-col items-center gap-4 px-6 text-center">
              <p className="text-sm text-text-muted">
                Large videos stream in parts on mobile. Tap below to start playback.
              </p>
              <Button
                onClick={() => {
                  setStreamStarted(true);
                  setLoading(true);
                }}
              >
                <Play className="size-4" />
                Play video
              </Button>
            </div>
          )}

          {showVideo && (
            <>
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
                  <PageSpinner />
                </div>
              )}
              <video
                key={streamUrl}
                src={streamUrl}
                controls
                playsInline
                preload="metadata"
                className={`w-full bg-black ${isMobileVideo ? 'h-full max-h-full object-contain' : 'max-h-[70vh]'}`}
                onLoadedMetadata={() => setLoading(false)}
                onCanPlay={() => setLoading(false)}
                onError={(e) => {
                  setLoading(false);
                  const code = e.currentTarget?.error?.code;
                  const hint =
                    code === 4
                      ? ' This format is not supported on your phone — use Download.'
                      : ' Use Download if streaming fails on mobile data.';
                  setError(`Could not play video.${hint}`);
                }}
              >
                <source src={streamUrl} type={videoType} />
              </video>
            </>
          )}

          {streamUrl && kind === 'audio' && !error && (
            <>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <PageSpinner />
                </div>
              )}
              <audio
                key={streamUrl}
                src={streamUrl}
                controls
                autoPlay={!mobileBrowser}
                preload={mobileBrowser ? 'metadata' : 'auto'}
                className="w-full max-w-lg px-4"
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
            <pre className="max-h-[70vh] w-full overflow-auto rounded-lg bg-surface p-4 text-left text-sm whitespace-pre-wrap text-on-surface">
              {textContent}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
