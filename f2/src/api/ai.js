import client from './client';

export const getAiPortfolioReview = (portfolioData) =>
  client.post('/api/ai/portfolio-review', portfolioData, {
    headers: { 'Content-Type': 'text/plain' }
  }).then((r) => r.data);

export const getAiStrategyBuilder = (budget, risk) =>
  client.post(`/api/ai/strategy-builder?budget=${budget}&risk=${risk}`).then((r) => r.data);

export const getAiNewsSummary = () =>
  client.get('/api/ai/news-summary').then((r) => r.data);
