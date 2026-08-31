function fourCc(bytes, offset = 4) {
  if (bytes.length < offset + 4) return '';
  return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
}

function scanCodecs(bytes) {
  const slice = bytes.slice(0, Math.min(bytes.length, 300000));
  const text = String.fromCharCode(...slice);
  const codecs = [];
  if (/hvc1|hev1|hvcC/i.test(text)) codecs.push('HEVC');
  if (/avc1|avc3|avcC/i.test(text)) codecs.push('H.264');
  if (/av01|av1C/i.test(text)) codecs.push('AV1');
  if (/ac-3|ec-3|dac3/i.test(text)) codecs.push('AC3');
  return [...new Set(codecs)];
}

function parseTotalBytes(contentRange) {
  if (!contentRange) return null;
  const match = /\/(\d+)\s*$/.exec(contentRange);
  return match ? Number(match[1]) : null;
}

function messageForCodecs(codecs = [], videoProbe = null) {
  const merged = [...new Set([...(videoProbe?.codecs || []), ...codecs])];
  if (merged.includes('AV1')) {
    return 'This video uses AV1, which most phone browsers cannot play. Download and open in VLC.';
  }
  if (merged.includes('HEVC') && !merged.includes('H.264')) {
    return 'This video uses HEVC (H.265). Many phones cannot stream it in the browser — Download and use VLC.';
  }
  if (merged.includes('AC3')) {
    return 'This video uses Dolby Digital audio, which Safari often blocks. Download and play in VLC.';
  }
  return null;
}

/** Diagnose why mobile video playback failed (auth, range, codec, moov-at-end). */
export async function diagnoseVideoStream(url, { fileSize = 0, videoProbe = null } = {}) {
  try {
    const headRes = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-65535' },
      credentials: 'include',
    });

    const contentType = (headRes.headers.get('content-type') || '').toLowerCase();
    const acceptRanges = headRes.headers.get('accept-ranges');
    const contentRange = headRes.headers.get('content-range');
    const totalBytes = parseTotalBytes(contentRange) || fileSize || 0;

    if (headRes.status === 401) {
      return 'Session expired — refresh the page and sign in again.';
    }

    if (contentType.includes('json')) {
      const body = await headRes.json().catch(() => null);
      return body?.message || 'Server returned an error instead of video.';
    }

    if (contentType.includes('text/html')) {
      return 'Server or proxy returned HTML instead of video. Check nginx: proxy_buffering off; proxy_set_header Range $http_range;';
    }

    if (headRes.status !== 206 && headRes.status !== 200) {
      return `Stream unavailable (HTTP ${headRes.status}). Try Download instead.`;
    }

    if (headRes.status === 200 && acceptRanges !== 'bytes') {
      return 'Byte-range streaming is not enabled. Redeploy the latest backend.';
    }

    const headBytes = new Uint8Array(await headRes.arrayBuffer());
    if (fourCc(headBytes) !== 'ftyp' && !contentType.includes('video')) {
      return 'Response is not a valid MP4 stream. Try Download instead.';
    }

    const headCodecs = scanCodecs(headBytes);
    const codecMessage = messageForCodecs(headCodecs, videoProbe);
    if (codecMessage) return codecMessage;

    const headSample = String.fromCharCode(...headBytes.slice(0, Math.min(headBytes.length, 200000)));
    const moovAtEnd = videoProbe?.moovAtEnd ?? !headSample.includes('moov');

    if (totalBytes > 0) {
      const suffixLen = Math.min(524288, totalBytes);
      const suffixRes = await fetch(url, {
        method: 'GET',
        headers: { Range: `bytes=-${suffixLen}` },
        credentials: 'include',
      });

      if (suffixRes.status === 416) {
        return 'Server rejected the end-of-file range request (HTTP 416). Redeploy the latest backend.';
      }

      if (suffixRes.status !== 206 && suffixRes.status !== 200) {
        return `End-of-file streaming failed (HTTP ${suffixRes.status}). Your reverse proxy may be stripping Range headers.`;
      }

      const suffixRange = suffixRes.headers.get('content-range') || '';
      if (suffixRes.status === 206 && !suffixRange.startsWith('bytes ')) {
        return 'Invalid range response from server. Check nginx proxy settings.';
      }

      const tailBytes = new Uint8Array(await suffixRes.arrayBuffer());
      const tailCodecs = scanCodecs(tailBytes);
      const tailCodecMessage = messageForCodecs(tailCodecs, videoProbe);
      if (tailCodecMessage) return tailCodecMessage;

      const tailText = String.fromCharCode(...tailBytes.slice(0, Math.min(tailBytes.length, 200000)));
      const hasMoovInTail = tailText.includes('moov');

      if ((moovAtEnd || hasMoovInTail) && suffixRes.status !== 206) {
        return 'This video stores metadata at the file end, but your server did not return HTTP 206 for range requests. Fix nginx proxy_buffering.';
      }
    }

    if (videoProbe && videoProbe.moovAtEnd && videoProbe.mobileFriendly) {
      return 'This large H.264 file stores metadata at the end. Streaming can be slow from SD cards — wait longer or use Download.';
    }

    return 'Could not play this video in the browser. Download and open in VLC (Files/VLC app on iPhone).';
  } catch {
    return 'Could not reach the video stream. Check your connection and try Download.';
  }
}

/** Prime server tail cache before mobile playback (moov-at-end MP4s). */
export async function warmVideoTail(url, fileSize = 0) {
  const suffix = Math.min(524288, fileSize || 524288);
  try {
    await fetch(url, {
      method: 'GET',
      headers: { Range: `bytes=-${suffix}` },
      credentials: 'include',
    });
  } catch {
    /* best-effort */
  }
}

export function iosVideoSrc(url) {
  if (!url) return url;
  return url.includes('#') ? url : `${url}#t=0.001`;
}
