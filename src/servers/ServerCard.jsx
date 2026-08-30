import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, LayoutDashboard, MoreVertical, Pencil, PlugZap, Server, Trash2, Unplug } from 'lucide-react';
import { formatRelative } from '../utils/format';
import { getServerNetworkTag } from '../utils/serverNetwork';

export function ServerCard({
  server,
  onRename,
  onDisconnect,
  onDelete,
  onReconnect,
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const connected = Boolean(server.connected);
  const network = getServerNetworkTag(server.host);

  const openExplorer = () => {
    if (!connected) {
      onReconnect(server);
      return;
    }
    navigate(`/explorer?server=${server.id}&path=${encodeURIComponent('/mnt')}`);
  };

  return (
    <div
      className={`group relative flex h-full flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-white/20 ${
        connected ? '' : 'opacity-80'
      }`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div
          className={`flex size-12 items-center justify-center rounded-lg border transition-colors group-hover:ring-2 ${network.icon} ${network.ring}`}
        >
          <Server className="size-6" />
        </div>
        <div className="relative">
          <button
            type="button"
            className="rounded-md p-1 text-text-muted hover:bg-surface-high hover:text-on-surface"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreVertical className="size-5" />
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute top-8 right-0 z-20 min-w-44 overflow-hidden rounded-lg border border-border bg-surface-high py-1 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                <MenuItem
                  icon={FolderOpen}
                  label="Open files"
                  onClick={() => {
                    setMenuOpen(false);
                    openExplorer();
                  }}
                />
                <MenuItem
                  icon={LayoutDashboard}
                  label="Dashboard"
                  onClick={() => {
                    setMenuOpen(false);
                    if (!connected) onReconnect(server);
                    else navigate(`/dashboard?server=${server.id}`);
                  }}
                />
                <MenuItem
                  icon={Pencil}
                  label="Rename"
                  onClick={() => {
                    setMenuOpen(false);
                    onRename(server);
                  }}
                />
                {connected ? (
                  <MenuItem
                    icon={Unplug}
                    label="Disconnect"
                    onClick={() => {
                      setMenuOpen(false);
                      onDisconnect(server);
                    }}
                  />
                ) : (
                  <MenuItem
                    icon={PlugZap}
                    label="Reconnect"
                    onClick={() => {
                      setMenuOpen(false);
                      onReconnect(server);
                    }}
                  />
                )}
                <MenuItem
                  icon={Trash2}
                  label="Forget server"
                  danger
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(server);
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <button type="button" className="mb-6 text-left" onClick={openExplorer}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className={`text-lg font-semibold ${connected ? 'text-on-surface' : 'text-text-muted'}`}>
            {server.label}
          </h3>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${network.badge}`}>
            {network.label}
          </span>
        </div>
        <p className="inline-block rounded border border-border bg-surface-low px-2 py-1 font-mono text-[13px] text-text-muted">
          {server.host}:{server.port}
        </p>
      </button>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <span
            className={`size-2 rounded-full ${connected ? 'animate-pulse bg-photos' : 'bg-destructive'}`}
          />
          <span className={`text-xs font-medium ${connected ? 'text-on-surface' : 'text-text-muted'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <span className="text-xs text-text-muted">
          {connected ? 'Active now' : `Last seen: ${formatRelative(server.last_connected_at)}`}
        </span>
      </div>
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-highest ${
        danger ? 'text-destructive' : 'text-on-surface'
      }`}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}
