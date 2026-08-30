import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { Plus, Server } from 'lucide-react';
import { apiErrorMessage } from '../api/client';
import { useDeleteServer, useDisconnectServer, useRenameServer, useServers } from '../hooks/useServers';
import { useUiStore } from '../store/uiStore';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { PageSpinner } from '../ui/Spinner';
import { ConnectServerModal } from './ConnectServerModal';
import { ServerCard } from './ServerCard';

export function ServerListPage() {
  const setPageTitle = useUiStore((s) => s.setPageTitle);
  const setShowSearch = useUiStore((s) => s.setShowSearch);
  const promptReconnect = useUiStore((s) => s.promptReconnect);
  const { data: servers = [], isLoading, isError, error } = useServers();
  const rename = useRenameServer();
  const disconnect = useDisconnectServer();
  const remove = useDeleteServer();

  const [connectOpen, setConnectOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [label, setLabel] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionsEl, setActionsEl] = useState(null);

  useEffect(() => {
    setPageTitle('My Servers');
    setShowSearch(false);
  }, [setPageTitle, setShowSearch]);

  useEffect(() => {
    setActionsEl(document.getElementById('topbar-actions'));
  }, []);

  const connectButton = (
    <Button onClick={() => setConnectOpen(true)}>
      <Plus className="size-4" />
      Connect New Server
    </Button>
  );

  if (isLoading) return <PageSpinner />;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 md:px-8">
      {actionsEl && createPortal(connectButton, actionsEl)}

      <div className="mb-8 md:hidden">
        <h2 className="text-2xl font-semibold text-on-surface">My Servers</h2>
        <p className="mt-1 text-sm text-text-muted">Manage your connected infrastructure.</p>
        <div className="mt-4">{connectButton}</div>
      </div>

      {isError && (
        <p className="mb-4 text-sm text-destructive">{apiErrorMessage(error, 'Failed to load servers')}</p>
      )}

      {servers.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No servers yet"
          description="Connect your Debian home server over SSH to browse /mnt and manage files."
          action={connectButton}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servers.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              onRename={(s) => {
                setRenameTarget(s);
                setLabel(s.label);
              }}
              onDisconnect={async (s) => {
                try {
                  await disconnect.mutateAsync(s.id);
                  toast.success('Disconnected');
                } catch (err) {
                  toast.error(apiErrorMessage(err, 'Disconnect failed'));
                }
              }}
              onDelete={setDeleteTarget}
              onReconnect={(s) => promptReconnect(s.id)}
            />
          ))}
          <button
            type="button"
            onClick={() => setConnectOpen(true)}
            className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-6 text-center transition-all duration-200 hover:border-primary/50 hover:bg-primary-container/5"
          >
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-surface-high text-text-muted">
              <Plus className="size-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-on-surface">Connect New Server</h3>
            <p className="max-w-[200px] text-sm text-text-muted">
              Add another server to your remote management cluster.
            </p>
          </button>
        </div>
      )}

      <ConnectServerModal open={connectOpen} onClose={() => setConnectOpen(false)} />

      <Modal
        open={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        title="Rename server"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button
              loading={rename.isPending}
              onClick={async () => {
                try {
                  await rename.mutateAsync({ id: renameTarget.id, label });
                  toast.success('Server renamed');
                  setRenameTarget(null);
                } catch (err) {
                  toast.error(apiErrorMessage(err, 'Rename failed'));
                }
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <Input id="server-label" label="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Forget this server?"
        message={`Remove “${deleteTarget?.label}” from your saved servers. You can connect again later.`}
        confirmLabel="Forget"
        danger
        loading={remove.isPending}
        onConfirm={async () => {
          try {
            await remove.mutateAsync(deleteTarget.id);
            toast.success('Server removed');
            setDeleteTarget(null);
          } catch (err) {
            toast.error(apiErrorMessage(err, 'Delete failed'));
          }
        }}
      />
    </div>
  );
}
