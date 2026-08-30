import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard';

const POLL_MS = 2500;
const POLL_MAX = 120;

function pollUntilDevices(serverId, qc, attempt = 0) {
  if (attempt >= POLL_MAX) return;

  window.setTimeout(async () => {
    try {
      const data = await dashboardApi.get(serverId);
      if ((data?.devices || []).length > 0) {
        qc.setQueryData(['dashboard', serverId], data);
        return;
      }
      pollUntilDevices(serverId, qc, attempt + 1);
    } catch {
      pollUntilDevices(serverId, qc, attempt + 1);
    }
  }, POLL_MS);
}

export function useDashboard(serverId) {
  return useQuery({
    queryKey: ['dashboard', serverId],
    queryFn: () => dashboardApi.get(serverId),
    enabled: Boolean(serverId),
    staleTime: 0,
  });
}

export function useRefreshDashboard(serverId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => dashboardApi.refresh(serverId),
    onSuccess: (data) => {
      if (data?.devices?.length) {
        qc.setQueryData(['dashboard', serverId], data);
      }
      if (data?.queued) {
        pollUntilDevices(serverId, qc);
      }
      qc.invalidateQueries({ queryKey: ['dashboard', serverId] });
    },
  });
}
