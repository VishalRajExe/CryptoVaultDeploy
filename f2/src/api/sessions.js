import client from './client';

export const getActiveSessions = () =>
  client.get('/api/users/sessions').then((r) => r.data);

export const revokeSession = (sessionId) =>
  client.delete(`/api/users/sessions/${sessionId}`).then((r) => r.data);
