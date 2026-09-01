const HEAD_BYTES = 1024 * 1024;
const TAIL_BYTES = 512 * 1024;

async function fetchRange(url, start, end) {
  const res = await fetch(url, {
    headers: { Range: `bytes=${start}-${end}` },
  });
  if (!res.ok && res.status !== 206) {
    throw new Error(`Range request failed (${res.status})`);
  }
  return res.blob();
}

async function coverFromBlob(blob) {
  const { parseBlob: parse } = await import('music-metadata');
  const metadata = await parse(blob, { skipPostHeaders: true });
  const picture = metadata.common.picture?.[0];
  if (!picture?.data?.length) return null;
  const mime = picture.format || 'image/jpeg';
  return URL.createObjectURL(new Blob([picture.data], { type: mime }));
}

export async function extractAudioCoverArt(streamUrl, fileSize = 0) {
  try {
    const headEnd = fileSize > 0 ? Math.min(HEAD_BYTES - 1, fileSize - 1) : HEAD_BYTES - 1;
    const headArt = await coverFromBlob(await fetchRange(streamUrl, 0, headEnd));
    if (headArt) return headArt;

    if (fileSize > HEAD_BYTES) {
      const tailStart = Math.max(0, fileSize - TAIL_BYTES);
      const tailArt = await coverFromBlob(await fetchRange(streamUrl, tailStart, fileSize - 1));
      if (tailArt) return tailArt;
    }
  } catch {
    return null;
  }
  return null;
}
