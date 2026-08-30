import { api, unwrap } from './client';

export const serversApi = {
  list: () => api.get('/servers').then(unwrap),
  connect: (body) => api.post('/servers/connect', body).then(unwrap),
  reconnect: (id, body) => api.post(`/servers/${id}/connect`, body).then(unwrap),
  disconnect: (id) => api.post(`/servers/${id}/disconnect`).then(unwrap),
  rename: (id, label) => api.patch(`/servers/${id}`, { label }).then(unwrap),
  remove: (id) => api.delete(`/servers/${id}`).then(unwrap),
  status: (id) => api.get(`/ssh/servers/${id}/status`).then(unwrap),
};
