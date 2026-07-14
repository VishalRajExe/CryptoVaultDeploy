import client from './client';

// Maps to com.vishal.controller.SubscriptionController

export const getCurrentSubscription = () =>
  client.get('/api/subscription/current').then((r) => r.data);

export const upgradeSubscription = (plan) =>
  client.post(`/api/subscription/upgrade/${plan}`).then((r) => r.data);

export const upgradeSubscriptionWithWallet = (plan) =>
  client.post(`/api/subscription/upgrade/${plan}/wallet`).then((r) => r.data);

export const cancelSubscription = () =>
  client.post('/api/subscription/cancel').then((r) => r.data);

export const getSubscriptionHistory = () =>
  client.get('/api/subscription/history').then((r) => r.data);

export const verifyUpgradePayment = (paymentId, orderId) =>
  client
    .put('/api/subscription/callback', null, { params: { payment_id: paymentId, order_id: orderId } })
    .then((r) => r.data);

// Admin Endpoints
export const adminGetAllSubscriptions = () =>
  client.get('/api/subscription/admin/all').then((r) => r.data);

export const adminExtendSubscription = (id, days) =>
  client.post(`/api/subscription/admin/${id}/extend/${days}`).then((r) => r.data);

export const adminCancelSubscription = (id) =>
  client.post(`/api/subscription/admin/${id}/cancel`).then((r) => r.data);
