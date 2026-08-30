import { useState } from 'react';
import { ChevronRight, Folder } from 'lucide-react';
import { useFiles } from '../hooks/useFiles';
import { joinPath, MNT_ROOT, parentPath } from '../utils/paths';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { PageSpinner } from '../ui/Spinner';

export function CopyMoveModal({ open, mode, serverId, sources, onClose, onConfirm, loading }) {
  const [dest, setDest] = useState(MNT_ROOT);
  const listing = useFiles(open ? serverId : null, dest);
  const folders = (listing.data?.entries || []).filter((e) => e.type === 'directory');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'move' ? 'Move to…' : 'Copy to…'}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={loading} onClick={() => onConfirm(dest)} disabled={dest === MNT_ROOT}>
            {mode === 'move' ? 'Move here' : 'Copy here'}
          </Button>
        </>
      }
    >
      <p className="mb-3 font-mono text-xs text-text-muted">{dest}</p>
      <div className="mb-3 flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => setDest(MNT_ROOT)}>
          /mnt
        </Button>
        {dest !== MNT_ROOT && (
          <Button variant="ghost" size="sm" onClick={() => setDest(parentPath(dest))}>
            Up one level
          </Button>
        )}
      </div>
      <div className="max-h-72 overflow-y-auto rounded-xl border border-border">
        {listing.isLoading && <PageSpinner />}
        {folders.map((folder) => (
          <button
            key={folder.path}
            type="button"
            className="flex w-full items-center gap-2 border-b border-border px-3 py-2.5 text-left text-sm last:border-b-0 hover:bg-surface-high"
            onClick={() => setDest(joinPath(dest, folder.name))}
          >
            <Folder className="size-4 text-on-surface-variant" />
            <span className="flex-1 truncate">{folder.name}</span>
            <ChevronRight className="size-4 text-text-muted" />
          </button>
        ))}
        {!listing.isLoading && folders.length === 0 && (
          <p className="p-4 text-sm text-text-muted">No folders here. You can still {mode} into this path.</p>
        )}
      </div>
      <p className="mt-3 text-xs text-text-muted">
        {sources.length} item{sources.length === 1 ? '' : 's'} selected. Destination cannot be /mnt root.
      </p>
    </Modal>
  );
}
