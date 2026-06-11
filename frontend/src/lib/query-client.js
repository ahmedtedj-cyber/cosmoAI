import { QueryClient } from '@tanstack/react-query';

// Erreurs qui ne méritent pas de retry
const NO_RETRY_MESSAGES = ['invalide', 'expiré', 'Non authentifié', '401', '403'];

function shouldRetry(failureCount, error) {
  if (failureCount >= 1) return false;
  const msg = error?.message ?? '';
  if (NO_RETRY_MESSAGES.some(s => msg.includes(s))) return false;
  return true;
}

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: shouldRetry,
    },
  },
});
