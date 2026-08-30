import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HardDrive, RefreshCw } from 'lucide-react';
import { apiErrorMessage } from '../api/client';
import { useDashboard, useRefreshDashboard } from '../hooks/useDashboard';
import { useServers } from '../hooks/useServers';
import { useUiStore } from '../store/uiStore';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { PageSpinner } from '../ui/Spinner';
import { DeviceUsageCard } from './DeviceUsageCard';

export function StorageDashboardPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const setPageTitle = useUiStore((s) => s.setPageTitle);
  const setShowSearch = useUiStore((s) => s.setShowSearch);
  const promptReconnect = useUiStore((s) => s.promptReconnect);

  const { data: servers = [], isLoading: serversLoading } = useServers();
  const connected = servers.filter((s) => s.connected);
  const serverId = params.get('server') || connected[0]?.id || servers[0]?.id;
  const server = servers.find((s) => s.id === serverId);

  const stats = useDashboard(server?.connected ? serverId : null);
  const refresh = useRefreshDashboard(serverId);

  useEffect(() => {
    setPageTitle('Storage Dashboard');
    setShowSearch(false);
  }, [setPageTitle, setShowSearch]);

  useEffect(() => {
    if (serverId && params.get('server') !== serverId) {
      setParams({ server: serverId }, { replace: true });
    }
  }, [serverId, params, setParams]);

  const onRefresh = async () => {
    if (!server?.connected) {
      promptReconnect(serverId);
      return;
    }
    try {
      const result = await refresh.mutateAsync();
      if (result?.queued) {
        toast.success('Storage scan started — loading results…');
      } else {
        toast.success(result?.message || 'Storage scan completed');
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Refresh failed'));
    }
  };

  if (serversLoading) return <PageSpinner />;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 md:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-on-surface">Connected Devices</h3>
          <p className="mt-1 text-sm text-text-muted">
            {server
              ? `Manage and monitor storage volumes for ${server.label}.`
              : 'Connect a server to see storage stats.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {servers.length > 0 && (
            <select
              value={serverId || ''}
              onChange={(e) => setParams({ server: e.target.value })}
              className="appearance-none rounded-md border border-border bg-surface-low px-3 py-1.5 pr-8 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                  {s.connected ? '' : ' (offline)'}
                </option>
              ))}
            </select>
          )}
          <Button variant="ghost" onClick={onRefresh} loading={refresh.isPending} disabled={!serverId}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        </div>
      </div>

      {!server && (
        <EmptyState
          icon={HardDrive}
          title="No servers saved"
          description="Connect a server first, then open the storage dashboard."
          action={<Button onClick={() => navigate('/servers')}>Go to My Servers</Button>}
        />
      )}

      {server && !server.connected && (
        <EmptyState
          icon={HardDrive}
          title="Server is disconnected"
          description="Reconnect to load cached stats or run a new storage scan."
          action={<Button onClick={() => promptReconnect(server.id)}>Reconnect</Button>}
        />
      )}

      {server?.connected && (stats.isLoading || refresh.isPending) && (
        <div className="flex flex-col items-center justify-center py-16">
          <PageSpinner />
          <p className="mt-4 text-sm text-text-muted">
            {refresh.isPending ? 'Scanning mounted devices under /mnt…' : 'Loading storage stats…'}
          </p>
        </div>
      )}

      {server?.connected && !stats.isLoading && !refresh.isPending && (stats.data?.devices || []).length === 0 && (
        <EmptyState
          icon={HardDrive}
          title="No scan results yet"
          description="Trigger a refresh to scan mounted devices under /mnt."
          action={<Button onClick={onRefresh}>Scan now</Button>}
        />
      )}

      {server?.connected && !stats.isLoading && !refresh.isPending && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {(stats.data?.devices || []).map((device) => (
            <DeviceUsageCard
              key={device.id}
              device={device}
              onViewFiles={(devicePath) =>
                navigate(`/explorer?server=${serverId}&path=${encodeURIComponent(devicePath)}`)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
