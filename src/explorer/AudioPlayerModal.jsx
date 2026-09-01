import { useEffect, useRef, useState } from 'react';
import {
  Download,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  X,
} from 'lucide-react';
import { filesApi } from '../api/files';
import { extractAudioCoverArt } from '../utils/extractAudioCoverArt';
import { formatBytes } from '../utils/format';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function AudioPlayerModal({
  open,
  serverId,
  playlist = [],
  initialIndex = 0,
  onClose,
  onDownload,
}) {
  const audioRef = useRef(null);
  const [index, setIndex] = useState(initialIndex);
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coverUrl, setCoverUrl] = useState(null);
  const [coverLoading, setCoverLoading] = useState(false);

  const track = playlist[index] || null;
  const hasPrev = index > 0;
  const hasNext = index < playlist.length - 1;

  useEffect(() => {
    if (!open) return;
    setIndex(initialIndex);
    setPlaying(true);
    setCurrentTime(0);
    setDuration(0);
    setError('');
    setCoverUrl(null);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open || !track || !serverId) return undefined;

    let cancelled = false;
    let objectUrl = null;

    setCoverUrl(null);
    setCoverLoading(true);

    const streamUrl = filesApi.streamPreviewUrl(serverId, track.path);
    extractAudioCoverArt(streamUrl, track.size || 0)
      .then((url) => {
        if (cancelled) {
          if (url) URL.revokeObjectURL(url);
          return;
        }
        if (url) {
          objectUrl = url;
          setCoverUrl(url);
        }
      })
      .finally(() => {
        if (!cancelled) setCoverLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, track?.path, serverId, track?.size]);

  useEffect(() => {
    if (!open || !track || !serverId) return undefined;

    const audio = audioRef.current;
    if (!audio) return undefined;

    setLoading(true);
    setError('');
    setCurrentTime(0);
    audio.src = filesApi.streamPreviewUrl(serverId, track.path);
    audio.load();

    const onLoaded = () => {
      setDuration(audio.duration || 0);
      setLoading(false);
      audio.play().catch(() => setPlaying(false));
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      if (index < playlist.length - 1) {
        setIndex((i) => i + 1);
        setPlaying(true);
      } else {
        setPlaying(false);
        setCurrentTime(0);
        audio.currentTime = 0;
      }
    };
    const onError = () => {
      setLoading(false);
      setPlaying(false);
      setError('Could not play this track');
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
    };
  }, [open, track?.path, serverId, index, playlist.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !open || loading) return;
    if (playing) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }, [playing, open, loading]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft' && index > 0) {
        setIndex((i) => i - 1);
        setPlaying(true);
      }
      if (e.key === 'ArrowRight' && index < playlist.length - 1) {
        setIndex((i) => i + 1);
        setPlaying(true);
      }
      if (e.key === ' ') {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index, playlist.length]);

  const seek = (value) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(duration)) return;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  if (!open || !track) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
      <div className="pointer-events-none absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
        <audio ref={audioRef} preload="metadata" />

        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">Now playing</p>
            <p className="truncate text-sm text-text-muted">
              Track {index + 1} of {playlist.length}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-text-muted hover:bg-surface-high hover:text-on-surface"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-6 py-8 text-center">
          <div className="mx-auto mb-6 size-36 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-audio/20 to-primary-container/10 shadow-lg">
            {coverUrl ? (
              <img src={coverUrl} alt="" className="size-full object-cover" />
            ) : coverLoading ? (
              <div className="flex size-full items-center justify-center">
                <Spinner className="size-8" />
              </div>
            ) : (
              <div className="flex size-full items-center justify-center">
                <Volume2 className="size-12 text-audio" />
              </div>
            )}
          </div>

          <h3 className="truncate text-lg font-semibold text-on-surface" title={track.name}>
            {track.name}
          </h3>
          <p className="mt-1 text-sm text-text-muted">{formatBytes(track.size)}</p>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <div className="mt-8">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              disabled={!duration || loading}
              onChange={(e) => seek(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-high accent-primary-container disabled:opacity-50"
            />
            <div className="mt-1.5 flex justify-between text-xs text-text-muted">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                setIndex((i) => i - 1);
                setPlaying(true);
              }}
              disabled={!hasPrev || loading}
              className="flex size-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-high hover:text-on-surface disabled:opacity-30"
              aria-label="Previous track"
            >
              <SkipBack className="size-5" />
            </button>

            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              disabled={loading || Boolean(error)}
              className="flex size-14 items-center justify-center rounded-full bg-primary-container text-white shadow-lg shadow-primary-container/30 transition-transform hover:bg-primary-container/90 active:scale-95 disabled:opacity-50"
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? <Pause className="size-6" /> : <Play className="size-6 ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setIndex((i) => i + 1);
                setPlaying(true);
              }}
              disabled={!hasNext || loading}
              className="flex size-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-high hover:text-on-surface disabled:opacity-30"
              aria-label="Next track"
            >
              <SkipForward className="size-5" />
            </button>
          </div>

          {playlist.length > 1 && (
            <p className="mt-4 text-xs text-text-muted">
              Auto-plays the next song when this track ends
            </p>
          )}
        </div>

        <div className="flex justify-end border-t border-border px-5 py-3">
          <Button variant="secondary" size="sm" onClick={() => onDownload(track)}>
            <Download className="size-4" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}
