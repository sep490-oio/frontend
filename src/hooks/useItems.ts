/**
 * Item mutation hooks — TanStack Query wrappers for item management.
 * Used by the Create Item page (seller flow).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getItemById, createItem, activateItem, submitItemForReview } from '@/services/auctionService';

/** Query: Fetch a single item by ID */
export function useItem(itemId: string | undefined) {
  return useQuery({
    queryKey: ['item', itemId],
    queryFn: () => getItemById(itemId!),
    enabled: !!itemId,
  });
}

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

/** Mutation: Submit item for online moderation review (draft → pending_review) */
export function useSubmitItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => submitItemForReview(itemId, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myItems'] });
    },
  });
}
