import client from './client';

export const getPriceAlerts = () =>
  client.get('/api/price-alerts').then((r) => r.data);

export const createPriceAlert = (symbol, targetPrice, condition) =>
  client.post(`/api/price-alerts?symbol=${symbol}&targetPrice=${targetPrice}&condition=${condition}`).then((r) => r.data);

export const deletePriceAlert = (alertId) =>
  client.delete(`/api/price-alerts/${alertId}`).then((r) => r.data);
