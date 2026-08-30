import { formatBytes } from './format';

export class TransferSpeedTracker {
  constructor(windowMs = 8000) {
    this.windowMs = windowMs;
    this.samples = [];
  }

  reset(bytes = 0) {
    this.samples = [{ at: Date.now(), bytes }];
  }

  sample(bytes) {
    const now = Date.now();
    this.samples.push({ at: now, bytes });
    const cutoff = now - this.windowMs;
    while (this.samples.length > 2 && this.samples[0].at < cutoff) {
      this.samples.shift();
    }
  }

  getBytesPerSecond() {
    if (this.samples.length < 2) return 0;
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const elapsedSec = (last.at - first.at) / 1000;
    if (elapsedSec < 0.4) return 0;
    const delta = last.bytes - first.bytes;
    return delta > 0 ? delta / elapsedSec : 0;
  }

  getEtaSeconds(remainingBytes) {
    const speed = this.getBytesPerSecond();
    if (speed <= 0 || remainingBytes <= 0) return null;
    return remainingBytes / speed;
  }

  metrics(transferredBytes, totalBytes) {
    const speedBps = this.getBytesPerSecond();
    const remaining = Math.max(0, (totalBytes || 0) - transferredBytes);
    const etaSeconds = totalBytes > 0 ? this.getEtaSeconds(remaining) : null;
    return { speedBps, etaSeconds };
  }
}

export function formatSpeed(bytesPerSecond) {
  if (!bytesPerSecond || bytesPerSecond <= 0) return null;
  return `${formatBytes(bytesPerSecond)}/s`;
}

export function formatEta(seconds) {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return null;
  const totalSec = Math.ceil(seconds);
  if (totalSec < 60) return `${totalSec}s left`;
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins < 60) {
    return secs > 0 ? `${mins}m ${secs}s left` : `${mins}m left`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hours}h ${remMins}m left` : `${hours}h left`;
}

export function formatTransferStatus(item, { bytesKey, doneMessage, errorFallback }) {
  const transferred = item[bytesKey] || 0;
  const total = item.size || 0;
  const sizePart =
    total > 0
      ? `${formatBytes(transferred)} / ${formatBytes(total)}`
      : `${formatBytes(transferred)} received`;

  if (item.status === 'paused') return `Paused · ${sizePart}`;
  if (item.status === 'done') return doneMessage;
  if (item.status === 'error') return item.error || errorFallback;

  if (item.status === 'uploading' || item.status === 'downloading') {
    const parts = [sizePart];
    const speed = formatSpeed(item.speedBps);
    if (speed) parts.push(speed);
    const eta = formatEta(item.etaSeconds);
    if (eta) parts.push(eta);
    return parts.join(' · ');
  }

  return sizePart;
}
