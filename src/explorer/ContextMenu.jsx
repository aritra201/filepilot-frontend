import { Copy, Download, FolderInput, Info, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function ContextMenu({ x, y, entry, isRoot, onClose, onAction }) {
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current?.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);

  const items = [
    { id: 'info', label: 'File info', icon: Info },
    { id: 'download', label: 'Download', icon: Download },
    !isRoot && { id: 'rename', label: 'Rename', icon: Pencil },
    !isRoot && { id: 'copy', label: 'Copy to…', icon: Copy },
    !isRoot && { id: 'move', label: 'Move to…', icon: FolderInput },
    !isRoot && { id: 'delete', label: 'Delete', icon: Trash2, danger: true },
  ].filter(Boolean);

  return (
    <div
      ref={ref}
      style={{ top: y, left: x }}
      className="fixed z-[70] min-w-44 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-high ${
            item.danger ? 'text-destructive' : 'text-on-surface'
          }`}
          onClick={() => {
            onAction(item.id, entry);
            onClose();
          }}
        >
          <item.icon className="size-4" />
          {item.label}
        </button>
      ))}
    </div>
  );
}
