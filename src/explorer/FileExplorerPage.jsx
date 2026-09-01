import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckSquare, FolderPlus, Grid3x3, List, Square, Upload } from 'lucide-react';
import { apiErrorMessage } from '../api/client';
import { startDownload } from '../services/downloadManager';
import { startUploads } from '../services/uploadManager';
import { useFileMutations, useFiles } from '../hooks/useFiles';
import { useServers } from '../hooks/useServers';
import { useUiStore } from '../store/uiStore';
import { previewKind, getFileCategory } from '../utils/fileTypes';
import { basename, isRootPath, joinPath, MNT_ROOT, normalizePath } from '../utils/paths';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { PageSpinner } from '../ui/Spinner';
import { Breadcrumbs } from './Breadcrumbs';
import { ContextMenu } from './ContextMenu';
import { CopyMoveModal } from './CopyMoveModal';
import { FileGridItem } from './FileGridItem';
import { FileInfoDrawer } from './FileInfoDrawer';
import { FileListRow } from './FileListRow';
import { PreviewModal } from './PreviewModal';
import { AudioPlayerModal } from './AudioPlayerModal';
import { UploadDropzone } from './UploadDropzone';

export function FileExplorerPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const serverId = params.get('server');
  const path = normalizePath(params.get('path') || MNT_ROOT);
  const isRoot = isRootPath(path);

  const setPageTitle = useUiStore((s) => s.setPageTitle);
  const setShowSearch = useUiStore((s) => s.setShowSearch);
  const searchQuery = useUiStore((s) => s.searchQuery);
  const promptReconnect = useUiStore((s) => s.promptReconnect);

  const { data: servers = [] } = useServers();
  const server = servers.find((s) => s.id === serverId);
  const listing = useFiles(serverId, path);
  const mutations = useFileMutations(serverId, path);
  const fileInputRef = useRef(null);

  const [view, setView] = useState('grid');
  const [selected, setSelected] = useState(() => new Set());
  const [menu, setMenu] = useState(null);
  const [mkdirOpen, setMkdirOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [renameTarget, setRenameTarget] = useState(null);
  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [copyMove, setCopyMove] = useState(null);
  const [infoEntry, setInfoEntry] = useState(null);
  const [previewEntry, setPreviewEntry] = useState(null);
  const [audioPlayer, setAudioPlayer] = useState(null);

  useEffect(() => {
    setPageTitle(basename(path));
    setShowSearch(true);
    return () => setShowSearch(false);
  }, [path, setPageTitle, setShowSearch]);

  useEffect(() => {
    setSelected(new Set());
  }, [path, serverId]);

  useEffect(() => {
    if (!serverId) navigate('/servers', { replace: true });
  }, [serverId, navigate]);

  const entries = useMemo(() => {
    const list = listing.data?.entries || [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((e) => e.name.toLowerCase().includes(q));
  }, [listing.data, searchQuery]);

  const setPath = (next) => {
    setParams({ server: serverId, path: next });
  };

  const toggleSelect = (entry, event) => {
    setSelected((prev) => {
      const next = new Set(event?.ctrlKey || event?.metaKey ? prev : []);
      if (next.has(entry.path)) next.delete(entry.path);
      else next.add(entry.path);
      return next;
    });
  };

  const openEntry = (entry) => {
    if (entry.type === 'directory') {
      setPath(entry.path);
      return;
    }
    if (getFileCategory(entry.name, entry.type) === 'audio') {
      const playlist = entries.filter((e) => getFileCategory(e.name, e.type) === 'audio');
      const index = playlist.findIndex((e) => e.path === entry.path);
      setAudioPlayer({
        playlist,
        index: index >= 0 ? index : 0,
      });
      return;
    }
    if (previewKind(entry.name, entry.type)) {
      setPreviewEntry(entry);
      return;
    }
    downloadEntry(entry);
  };

  const downloadEntry = (entry) => {
    try {
      startDownload({
        serverId,
        path: entry.path,
        name: entry.name,
        size: entry.size || 0,
      });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Download failed'));
    }
  };

  const handleMenuAction = (action, entry) => {
    if (action === 'info') setInfoEntry(entry);
    if (action === 'download') downloadEntry(entry);
    if (action === 'rename') {
      setRenameTarget(entry);
      setNewName(entry.name);
    }
    if (action === 'copy') setCopyMove({ mode: 'copy', sources: [entry] });
    if (action === 'move') setCopyMove({ mode: 'move', sources: [entry] });
    if (action === 'delete') setDeleteTarget(entry);
  };

  const selectedEntries = entries.filter((e) => selected.has(e.path));
  const allVisibleSelected = entries.length > 0 && selectedEntries.length === entries.length;

  const selectAll = () => {
    setSelected(new Set(entries.map((e) => e.path)));
  };

  const deselectAll = () => {
    setSelected(new Set());
  };

  const runUploads = async (fileList) => {
    if (isRoot) {
      toast.error('Uploads are disabled at /mnt root.');
      return;
    }
    await startUploads(fileList, serverId, path, {
      onSaved: () => mutations.invalidate(),
    });
  };

  if (!serverId) return null;

  return (
    <UploadDropzone disabled={isRoot} onFiles={runUploads}>
      <div className="p-6">
        <div className="mb-6 flex flex-col gap-4">
          <Breadcrumbs serverLabel={server?.label} path={path} onNavigate={setPath} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-on-surface">{basename(path)}</h2>
            <div className="flex flex-wrap items-center gap-3">
              {!isRoot && selectedEntries.length === 0 && (
                <>
                  <Button variant="secondary" onClick={() => setMkdirOpen(true)}>
                    <FolderPlus className="size-4" />
                    New Folder
                  </Button>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="size-4" />
                    Upload
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) runUploads(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </>
              )}
              {selectedEntries.length > 0 && (
                <>
                  <span className="text-xs font-medium text-text-muted">
                    {selectedEntries.length} selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAll}
                    disabled={allVisibleSelected}
                  >
                    <CheckSquare className="size-4" />
                    Select all
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll}>
                    <Square className="size-4" />
                    Deselect all
                  </Button>
                  {!isRoot && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setCopyMove({ mode: 'copy', sources: selectedEntries })}>
                        Copy
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setCopyMove({ mode: 'move', sources: selectedEntries })}>
                        Move
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget({ paths: selectedEntries.map((e) => e.path), name: `${selectedEntries.length} items` })}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </>
              )}
              <div className="flex items-center rounded-lg border border-border bg-surface-low p-1">
                <button
                  type="button"
                  onClick={() => setView('grid')}
                  className={`rounded p-1 ${view === 'grid' ? 'bg-surface-high text-primary' : 'text-on-surface-variant'}`}
                >
                  <Grid3x3 className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className={`rounded p-1 ${view === 'list' ? 'bg-surface-high text-primary' : 'text-on-surface-variant'}`}
                >
                  <List className="size-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {listing.isLoading && <PageSpinner />}
        {listing.isError && (
          <div className="rounded-xl border border-border bg-surface p-6 text-center">
            <p className="mb-3 text-sm text-destructive">
              {apiErrorMessage(listing.error, 'Failed to load files')}
            </p>
            <Button variant="secondary" onClick={() => promptReconnect(serverId)}>
              Reconnect
            </Button>
          </div>
        )}

        {!listing.isLoading && !listing.isError && entries.length === 0 && (
          <EmptyState
            icon={FolderPlus}
            title={searchQuery ? 'No matching files' : 'This folder is empty'}
            description={isRoot ? 'Connect a server and mount devices under /mnt.' : 'Upload files or create a folder.'}
          />
        )}

        {!listing.isLoading && view === 'grid' && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {entries.map((entry) => (
              <FileGridItem
                key={entry.path}
                entry={entry}
                selectable={!isRoot}
                selected={selected.has(entry.path)}
                onSelect={toggleSelect}
                onOpen={openEntry}
                onMenu={(e, item) => setMenu({ x: e.clientX, y: e.clientY, entry: item })}
              />
            ))}
          </div>
        )}

        {!listing.isLoading && view === 'list' && (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            {entries.map((entry) => (
              <FileListRow
                key={entry.path}
                entry={entry}
                selectable={!isRoot}
                selected={selected.has(entry.path)}
                onSelect={toggleSelect}
                onOpen={openEntry}
                onMenu={(e, item) => setMenu({ x: e.clientX, y: e.clientY, entry: item })}
              />
            ))}
          </div>
        )}
      </div>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          entry={menu.entry}
          isRoot={isRoot || menu.entry.isRoot}
          onClose={() => setMenu(null)}
          onAction={handleMenuAction}
        />
      )}

      <Modal
        open={mkdirOpen}
        onClose={() => setMkdirOpen(false)}
        title="New folder"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMkdirOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={mutations.mkdir.isPending}
              onClick={async () => {
                try {
                  await mutations.mkdir.mutateAsync(joinPath(path, folderName.trim()));
                  toast.success('Folder created');
                  setFolderName('');
                  setMkdirOpen(false);
                } catch (err) {
                  toast.error(apiErrorMessage(err, 'Could not create folder'));
                }
              }}
            >
              Create
            </Button>
          </>
        }
      >
        <Input
          id="folder-name"
          label="Folder name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
        />
      </Modal>

      <Modal
        open={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        title="Rename"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button
              loading={mutations.rename.isPending}
              onClick={async () => {
                try {
                  await mutations.rename.mutateAsync({ targetPath: renameTarget.path, newName });
                  toast.success('Renamed');
                  setRenameTarget(null);
                } catch (err) {
                  toast.error(apiErrorMessage(err, 'Rename failed'));
                }
              }}
            >
              Rename
            </Button>
          </>
        }
      >
        <Input id="new-name" label="New name" value={newName} onChange={(e) => setNewName(e.target.value)} />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete permanently?"
        message={`This will delete ${deleteTarget?.name || deleteTarget?.path}. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={mutations.remove.isPending}
        onConfirm={async () => {
          try {
            const paths = deleteTarget.paths || [deleteTarget.path];
            for (const p of paths) {
              await mutations.remove.mutateAsync(p);
            }
            toast.success('Deleted');
            setDeleteTarget(null);
            setSelected(new Set());
          } catch (err) {
            toast.error(apiErrorMessage(err, 'Delete failed'));
          }
        }}
      />

      <CopyMoveModal
        open={Boolean(copyMove)}
        mode={copyMove?.mode}
        serverId={serverId}
        sources={copyMove?.sources || []}
        loading={mutations.copy.isPending || mutations.move.isPending}
        onClose={() => setCopyMove(null)}
        onConfirm={async (dest) => {
          try {
            for (const src of copyMove.sources) {
              const destPath = joinPath(dest, src.name);
              if (copyMove.mode === 'move') {
                await mutations.move.mutateAsync({ srcPath: src.path, destPath });
              } else {
                await mutations.copy.mutateAsync({ srcPath: src.path, destPath });
              }
            }
            toast.success(copyMove.mode === 'move' ? 'Moved' : 'Copied');
            setCopyMove(null);
            setSelected(new Set());
          } catch (err) {
            toast.error(apiErrorMessage(err, 'Operation failed'));
          }
        }}
      />

      <FileInfoDrawer
        open={Boolean(infoEntry)}
        serverId={serverId}
        path={infoEntry?.path}
        entry={infoEntry}
        onClose={() => setInfoEntry(null)}
      />

      <PreviewModal
        open={Boolean(previewEntry)}
        serverId={serverId}
        entry={previewEntry}
        onClose={() => setPreviewEntry(null)}
        onDownload={downloadEntry}
      />

      <AudioPlayerModal
        open={Boolean(audioPlayer)}
        serverId={serverId}
        playlist={audioPlayer?.playlist || []}
        initialIndex={audioPlayer?.index ?? 0}
        onClose={() => setAudioPlayer(null)}
        onDownload={downloadEntry}
      />
    </UploadDropzone>
  );
}
