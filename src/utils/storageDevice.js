export function isMountDeviceEntry(entry) {
  return Boolean(entry?.isRoot);
}

export function getStorageDeviceLabel() {
  return 'Storage device';
}

export function isStorageInfo(entry, data) {
  return Boolean(entry?.isRoot || data?.storage);
}
