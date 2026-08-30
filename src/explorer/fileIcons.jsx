import { Archive, File, FileText, Film, Folder, Image, Music } from 'lucide-react';
import { getFileCategory } from '../utils/fileTypes';

const colorClass = {
  folder: 'text-on-surface-variant',
  video: 'text-video',
  audio: 'text-audio',
  image: 'text-photos',
  docs: 'text-documents',
  archive: 'text-other',
  other: 'text-other',
};

const iconMap = {
  folder: Folder,
  video: Film,
  audio: Music,
  image: Image,
  docs: FileText,
  archive: Archive,
  other: File,
};

export function FileTypeIcon({ entry, size = 48, filled = false }) {
  const category = getFileCategory(entry.name, entry.type);
  const Icon = iconMap[category] || File;
  return (
    <Icon
      className={`${colorClass[category] || colorClass.other}`}
      size={size}
      fill={filled && category === 'folder' ? 'currentColor' : 'none'}
      strokeWidth={filled && category === 'folder' ? 1 : 1.5}
    />
  );
}
