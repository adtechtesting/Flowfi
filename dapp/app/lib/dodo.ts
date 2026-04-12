
import DodoPayments from 'dodopayments';

const apiKey = process.env.DODO_PAYMENTS_API_KEY;


export const dodo = apiKey && apiKey !== 'mock'
  ? new DodoPayments({
    bearerToken: apiKey,
    environment: process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode',
  })
  : null;