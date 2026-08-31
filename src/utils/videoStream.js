/** Diagnose why mobile video playback failed (auth, range, codec, nginx). */
export async function diagnoseVideoStream(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-11' },
      credentials: 'include',
    });

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const acceptRanges = res.headers.get('accept-ranges');
    const contentRange = res.headers.get('content-range');

    if (res.status === 401) {
      return 'Session expired — refresh the page and sign in again.';
    }

    if (contentType.includes('json')) {
      const body = await res.json().catch(() => null);
      return body?.message || 'Server returned an error instead of video.';
    }

    if (contentType.includes('text/html')) {
      return 'Server or proxy returned HTML instead of video. Check nginx proxy_buffering off for /api.';
    }

    if (res.status !== 206 && res.status !== 200) {
      return `Stream unavailable (HTTP ${res.status}). Try Download instead.`;
    }

    if (res.status === 200 && acceptRanges !== 'bytes') {
      return 'Byte-range streaming is not enabled on the server. Redeploy the latest backend.';
    }

    const sample = new Uint8Array(await res.arrayBuffer());
    const box = sample.length >= 8 ? String.fromCharCode(...sample.slice(4, 8)) : '';

    if (box !== 'ftyp' && !contentType.includes('video')) {
      return 'Response is not a valid MP4 stream. Try Download instead.';
    }

    if (contentRange && !contentRange.startsWith('bytes ')) {
      return 'Invalid range response from server. Check nginx proxy settings.';
    }

    // Stream looks valid — likely codec (HEVC/AV1) or moov-at-end without working suffix ranges
    return 'This file may use a codec your phone cannot play (e.g. some HEVC/AV1 MP4s). Use Download and play in VLC, or re-encode to H.264.';
  } catch {
    return 'Could not reach the video stream. Check your connection and try Download.';
  }
}

export async function probeSuffixRange(url, totalBytes = 0) {
  if (!totalBytes) return true;
  try {
    const suffix = Math.min(512 * 1024, totalBytes);
    const res = await fetch(url, {
      method: 'GET',
      headers: { Range: `bytes=-${suffix}` },
      credentials: 'include',
    });
    return res.status === 206 || res.status === 200;
  } catch {
    return false;
  }
}
