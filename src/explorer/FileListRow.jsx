import { Check, MoreVertical } from 'lucide-react';
import { formatBytes, formatDate } from '../utils/format';
import { isMountDeviceEntry } from '../utils/storageDevice';
import { FileTypeIcon } from './fileIcons';

export function FileListRow({ entry, selected, selectable = true, onSelect, onOpen, onMenu }) {
  return (
    <div
      onClick={(e) => (selectable ? onSelect(entry, e) : onOpen(entry))}
      onDoubleClick={() => selectable && onOpen(entry)}
      onContextMenu={(e) => {
        e.preventDefault();
        onMenu(e, entry);
      }}
      className={`group flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2.5 ${
        selectable && selected
          ? 'border-l-2 border-l-primary bg-primary-container/10'
          : 'border-l-2 border-l-transparent hover:bg-[#242830]'
      }`}
    >
      {selectable ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(entry, { ...e, ctrlKey: true });
          }}
          className={`flex size-5 shrink-0 items-center justify-center rounded border ${
            selected ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant'
          }`}
        >
          {selected && <Check className="size-3.5" />}
        </button>
      ) : (
        <span className="size-5 shrink-0" aria-hidden="true" />
      )}
      <FileTypeIcon entry={entry} size={20} filled={entry.type === 'directory' && !entry.isRoot} />
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-on-surface">{entry.name}</p>
      <p className="hidden w-28 text-right text-xs text-text-muted sm:block">
        {isMountDeviceEntry(entry) ? 'Storage' : entry.type === 'directory' ? '—' : formatBytes(entry.size)}
      </p>
      <p className="hidden w-40 text-right text-xs text-text-muted md:block">{formatDate(entry.mtime)}</p>
      <button
        type="button"
        className="text-on-surface-variant opacity-0 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onMenu(e, entry);
        }}
      >
        <MoreVertical className="size-4" />
      </button>
    </div>
  );
}
