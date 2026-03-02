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
      // Retry failed requests once before showing error
      retry: 1,
      // Cache data for 5 minutes before considering it stale
      staleTime: 5 * 60 * 1000,
    },
  },
});
