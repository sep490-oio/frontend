/**
 * Item mutation hooks — TanStack Query wrappers for item management.
 * Used by the Create Item page (seller flow).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createItem, activateItem } from '@/services/auctionService';

/** Mutation: Create a new item (draft) */
export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myItems'] });
    },
  });
}

/** Mutation: Activate an item (draft → active) */
export function useActivateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => activateItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myItems'] });
    },
  });
}
