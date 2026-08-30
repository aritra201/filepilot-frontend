import { Copy, Download, FolderInput, Info, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export function ContextMenu({ x, y, entry, isRoot, onClose, onAction }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ top: y, left: x });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const pad = 8;
    let left = x;
    let top = y;

    if (left + rect.width > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - rect.width - pad);
    }
    if (top + rect.height > window.innerHeight - pad) {
      top = Math.max(pad, window.innerHeight - rect.height - pad);
    }

    setPosition({ left, top });
  }, [x, y]);

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
      style={{ top: position.top, left: position.left }}
      className="fixed z-[70] w-max min-w-44 rounded-lg border border-border bg-surface py-1 shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-left text-sm hover:bg-surface-high ${
            item.danger ? 'text-destructive' : 'text-on-surface'
          }`}
          onClick={() => {
            onAction(item.id, entry);
            onClose();
          }}
        >
          <item.icon className="size-4 shrink-0" />
          {item.label}
        </button>
      ))}
    </div>
  );
}
