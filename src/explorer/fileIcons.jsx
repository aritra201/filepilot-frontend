import { Archive, File, FileText, Film, Folder, HardDrive, Image, Music } from 'lucide-react';
import { getFileCategory } from '../utils/fileTypes';
import { isMountDeviceEntry } from '../utils/storageDevice';

const colorClass = {
  folder: 'text-on-surface-variant',
  video: 'text-video',
  audio: 'text-audio',
  image: 'text-photos',
  docs: 'text-documents',
  archive: 'text-other',
  other: 'text-other',
  storage: 'text-primary',
};

const iconMap = {
  folder: Folder,
  video: Film,
  audio: Music,
  image: Image,
  docs: FileText,
  archive: Archive,
  other: File,
  storage: HardDrive,
};

function resolveEntryVisual(entry) {
  if (isMountDeviceEntry(entry)) {
    return { category: 'storage', Icon: HardDrive };
  }

  const category = getFileCategory(entry.name, entry.type);
  return { category, Icon: iconMap[category] || File };
}

export function FileTypeIcon({ entry, size = 48, filled = false }) {
  const { category, Icon } = resolveEntryVisual(entry);
  const useFilledFolder = filled && category === 'folder';

  return (
    <Icon
      className={`${colorClass[category] || colorClass.other}`}
      size={size}
      fill={useFilledFolder ? 'currentColor' : 'none'}
      strokeWidth={useFilledFolder ? 1 : 1.5}
    />
  );
}
