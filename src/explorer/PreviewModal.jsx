import { useEffect, useState } from 'react';
import { Download, ExternalLink, Play, X } from 'lucide-react';
import { filesApi } from '../api/files';
import { apiErrorMessage } from '../api/client';
import { previewKind } from '../utils/fileTypes';
import { diagnoseVideoStream, iosVideoSrc, warmVideoTail } from '../utils/videoStream';
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

export function PreviewModal({ open, serverId, entry, onClose, onDownload }) {
  const [streamUrl, setStreamUrl] = useState(null);
  const [streamStarted, setStreamStarted] = useState(false);
  const [blob, setBlob] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoProbe, setVideoProbe] = useState(null);
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
    setVideoProbe(null);
    setLoading(kind !== 'video' || !isMobileVideo);

    if (usesDirectStream) {
      const url = filesApi.streamPreviewUrl(serverId, entry.path);
      setStreamUrl(url);
      if (kind === 'video') {
        filesApi
          .info(serverId, entry.path)
          .then((info) => setVideoProbe(info.videoProbe || null))
          .catch(() => {});
      }
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

  const showVideo = streamUrl && kind === 'video' && streamStarted && !error;
  const videoSrc = isMobileVideo ? iosVideoSrc(streamUrl) : streamUrl;
  const moovAtEnd = videoProbe?.moovAtEnd;
  const playHint =
    moovAtEnd && videoProbe?.mobileFriendly
      ? 'This file stores video metadata at the end — first load may take 10–20 seconds on SD storage.'
      : videoProbe && !videoProbe.mobileFriendly
        ? `Detected: ${videoProbe.codecs?.join(', ') || 'unknown codec'}. Browser playback may not work.`
        : 'Large videos stream in parts on mobile. Tap below to start playback.';

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
              <div className="flex flex-wrap items-center justify-center gap-2">
                {streamUrl && kind === 'video' && videoProbe?.mobileFriendly !== false && (
                  <a
                    href={streamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-on-surface hover:bg-surface-high"
                  >
                    <ExternalLink className="size-4" />
                    Open video directly
                  </a>
                )}
                <Button variant="secondary" size="sm" onClick={() => onDownload(entry)}>
                  Download instead
                </Button>
              </div>
            </div>
          )}

          {blob && kind === 'image' && (
            <img src={blob.url} alt={entry.name} className="max-h-[70vh] max-w-full object-contain" />
          )}

          {streamUrl && kind === 'video' && !streamStarted && !error && (
            <div className="flex flex-col items-center gap-4 px-6 text-center">
              <p className="text-sm text-text-muted">{playHint}</p>
              <Button
                onClick={async () => {
                  setStreamStarted(true);
                  setLoading(true);
                  if (moovAtEnd) {
                    await warmVideoTail(streamUrl, entry.size || 0);
                  }
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
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/50 px-6 text-center">
                  <PageSpinner />
                  {moovAtEnd && (
                    <p className="text-xs text-white/80">
                      Reading video metadata from SD storage — this can take 15–30 seconds…
                    </p>
                  )}
                </div>
              )}
              <video
                key={videoSrc}
                src={videoSrc}
                controls
                playsInline
                preload={isMobileVideo ? 'auto' : 'metadata'}
                className={`w-full bg-black ${isMobileVideo ? 'h-full max-h-full object-contain' : 'max-h-[70vh]'}`}
                onLoadedMetadata={() => setLoading(false)}
                onCanPlay={() => setLoading(false)}
                onError={async () => {
                  setLoading(false);
                  const detail = streamUrl
                    ? await diagnoseVideoStream(streamUrl, {
                        fileSize: entry.size || 0,
                        videoProbe,
                      })
                    : 'Could not play video.';
                  setError(detail);
                }}
              />
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
