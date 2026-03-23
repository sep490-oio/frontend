/**
 * TanStack Query client — exported from its own file so it can be imported
 * by both providers.tsx (to pass into QueryClientProvider) and by any handler
 * that needs to call queryClient.clear() on logout without triggering the
 * react-refresh "only-export-components" lint warning.
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch when the browser tab regains focus (less aggressive)
      refetchOnWindowFocus: false,
      // Retry failed requests with exponential backoff (500ms, 1000ms).
      // This gives the axios 401-refresh interceptor time to complete
      // before the next retry fires — prevents "empty page on first load".
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000),
      // Cache data for 5 minutes before considering it stale
      staleTime: 5 * 60 * 1000,
    },
  },
});
