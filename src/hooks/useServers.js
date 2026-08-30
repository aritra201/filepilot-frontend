import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { serversApi } from '../api/servers';

async function refreshAfterSessionRestore(qc, serverId) {
  const tasks = [qc.invalidateQueries({ queryKey: ['servers'] })];
  if (serverId) {
    tasks.push(
      qc.invalidateQueries({ queryKey: ['files', serverId] }),
      qc.invalidateQueries({ queryKey: ['dashboard', serverId] }),
      qc.invalidateQueries({ queryKey: ['file-info', serverId] })
    );
  }
  await Promise.all(tasks);

  await qc.refetchQueries({ queryKey: ['servers'], type: 'active' });
  if (serverId) {
    await qc.refetchQueries({ queryKey: ['files', serverId], type: 'active' });
    await qc.refetchQueries({ queryKey: ['dashboard', serverId], type: 'active' });
  }
}

function patchServerConnected(qc, serverId, connected) {
  qc.setQueryData(['servers'], (old) => {
    if (!Array.isArray(old)) return old;
    return old.map((s) => (s.id === serverId ? { ...s, connected } : s));
  });
}

export function useServers() {
  return useQuery({
    queryKey: ['servers'],
    queryFn: serversApi.list,
  });
}

export function useConnectServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: serversApi.connect,
    onSuccess: async (data) => {
      const serverId = data?.savedServerId;
      if (serverId) patchServerConnected(qc, serverId, true);
      await refreshAfterSessionRestore(qc, serverId);
    },
  });
}

export function useReconnectServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, username, password }) => serversApi.reconnect(id, { username, password }),
    onSuccess: async (_data, { id }) => {
      patchServerConnected(qc, id, true);
      await refreshAfterSessionRestore(qc, id);
    },
  });
}

export function useDisconnectServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: serversApi.disconnect,
    onSuccess: async (_data, id) => {
      patchServerConnected(qc, id, false);
      await refreshAfterSessionRestore(qc, id);
    },
  });
}

export function useRenameServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, label }) => serversApi.rename(id, label),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servers'] }),
  });
}

export function useDeleteServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: serversApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servers'] }),
  });
}
