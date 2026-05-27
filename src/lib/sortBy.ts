export type SortDirection = 'asc' | 'desc';
export interface SortSpec<F extends string> {
  field: F;
  direction: SortDirection;
}

export function serializeSortBy<F extends string>(
  sorts: ReadonlyArray<SortSpec<F>> | SortSpec<F> | undefined,
): string | undefined {
  if (!sorts) return undefined;
  const list = Array.isArray(sorts) ? sorts : [sorts];
  if (list.length === 0) return undefined;
  return list
    .map(s => s.direction === 'desc' ? `${s.field} desc` : s.field)
    .join(',');
}
