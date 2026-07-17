import client from './client';

export const updateProfile = (payload) =>
  client.put('/api/users/profile', payload).then((r) => r.data);

export const changePassword = (currentPassword, newPassword) =>
  client.post('/api/users/change-password', null, { params: { currentPassword, newPassword } }).then((r) => r.data);

export const submitKyc = (documentType, documentNumber) =>
  client.post('/api/users/kyc', { documentType, documentNumber }).then((r) => r.data);

export const approveKyc = () =>
  client.post('/api/users/kyc/approve').then((r) => r.data);

export const getAllSessions = () =>
  client.get('/api/users/sessions/all').then((r) => r.data);

export const getAiChatUsage = () =>
  client.get('/chat/usage').then((r) => r.data);
