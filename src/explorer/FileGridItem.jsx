import { Check, MoreVertical } from 'lucide-react';
import { formatBytes } from '../utils/format';
import { FileTypeIcon } from './fileIcons';

export function FileGridItem({ entry, selected, selectable = true, onSelect, onOpen, onMenu }) {
  return (
    <div
      onClick={(e) => (selectable ? onSelect(entry, e) : onOpen(entry))}
      onDoubleClick={() => selectable && onOpen(entry)}
      onContextMenu={(e) => {
        e.preventDefault();
        onMenu(e, entry);
      }}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border p-4 transition-all duration-200 ${
        selectable && selected
          ? 'border-primary/40 bg-primary-container/10'
          : 'border-border bg-surface hover:border-outline-variant hover:bg-surface-highest'
      }`}
    >
      {selectable && selected && <div className="absolute top-0 bottom-0 left-0 w-1 bg-primary" />}
      <div className="mb-2 flex items-start justify-between">
        {selectable ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(entry, { ...e, ctrlKey: true });
            }}
            className={`flex size-5 items-center justify-center rounded border transition-opacity ${
              selected
                ? 'border-primary bg-primary text-on-primary'
                : 'border-outline-variant bg-surface-low opacity-0 group-hover:opacity-100'
            }`}
          >
            {selected && <Check className="size-3.5" />}
          </button>
        ) : (
          <span className="size-5" aria-hidden="true" />
        )}
        <button
          type="button"
          className="text-on-surface-variant opacity-0 transition-opacity group-hover:opacity-100 hover:text-on-surface"
          onClick={(e) => {
            e.stopPropagation();
            onMenu(e, entry);
          }}
        >
          <MoreVertical className="size-5" />
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center py-4">
        <FileTypeIcon entry={entry} size={48} filled={entry.type === 'directory'} />
      </div>
      <div className="mt-auto border-t border-border/50 pt-2">
        <p className={`truncate text-sm font-medium ${selectable && selected ? 'text-primary' : 'text-on-surface'}`} title={entry.name}>
          {entry.name}
        </p>
        <p className="mt-0.5 text-xs text-text-muted">
          {entry.type === 'directory' ? 'Folder' : formatBytes(entry.size)}
        </p>
      </div>
    </div>
  );
}
