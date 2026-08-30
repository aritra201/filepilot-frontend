import { api, transferTimeoutMs, unwrap } from './client';

export const dashboardApi = {
  get: (serverId) =>
    api
      .get(`/servers/${serverId}/dashboard`, { params: { _: Date.now() } })
      .then(unwrap),
  refresh: (serverId) =>
    api
      .post(`/servers/${serverId}/dashboard/refresh`, null, {
        timeout: transferTimeoutMs(500 * 1024 * 1024, { minMs: 120_000, maxMs: 3_600_000 }),
      })
      .then(unwrap),
};
