const NETWORK_STYLES = {
  tailscale: {
    label: 'Tailscale',
    icon: 'border-audio/40 bg-audio/10 text-audio',
    badge: 'border-audio/35 bg-audio/15 text-audio',
    ring: 'ring-audio/30',
  },
  local: {
    label: 'Local',
    icon: 'border-video/40 bg-video/10 text-video',
    badge: 'border-video/35 bg-video/15 text-video',
    ring: 'ring-video/30',
  },
  remote: {
    label: 'Remote',
    icon: 'border-documents/40 bg-documents/10 text-documents',
    badge: 'border-documents/35 bg-documents/15 text-documents',
    ring: 'ring-documents/30',
  },
};

function isPrivateIpv4(host) {
  const parts = host.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true;
  return false;
}

function isTailscaleIpv4(host) {
  return /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(host);
}

/** Classify server host for visual network tag (Tailscale vs LAN vs remote). */
export function getServerNetworkTag(host) {
  const value = (host || '').trim().toLowerCase();
  if (!value) return { kind: 'remote', ...NETWORK_STYLES.remote };

  if (isTailscaleIpv4(value)) {
    return { kind: 'tailscale', ...NETWORK_STYLES.tailscale };
  }

  if (value === 'localhost' || isPrivateIpv4(value)) {
    return { kind: 'local', ...NETWORK_STYLES.local };
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) {
    return { kind: 'remote', ...NETWORK_STYLES.remote };
  }

  return { kind: 'remote', ...NETWORK_STYLES.remote };
}
