export type PermissionCategory =
  | 'admin'
  | 'me'
  | 'items'
  | 'auctions'
  | 'warehouse'
  | 'media'
  | 'categories'

// Display order for category sections in the roles UI.
export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  'admin',
  'me',
  'items',
  'auctions',
  'warehouse',
  'media',
  'categories',
]

export function getPermissionCategory(slug: string): PermissionCategory {
  if (slug.startsWith('users:me:') || slug.startsWith('me:')) return 'me'
  if (slug.startsWith('items:')) return 'items'
  if (slug.startsWith('auctions:')) return 'auctions'
  if (slug.startsWith('warehouse:')) return 'warehouse'
  if (slug.startsWith('media:')) return 'media'
  if (slug.startsWith('categories:')) return 'categories'
  if (slug.startsWith('admin:')) return 'admin'
  return 'admin'
}

// i18n path for slug `admin:items:manage` → `permissions.admin.items.manage`
// The t() lookup will resolve {label, description} under this path.
export function permissionI18nPath(slug: string): string {
  return `permissions.${slug.replace(/:/g, '.')}`
}

export function categoryI18nKey(category: PermissionCategory): string {
  return `permissions.category.${category}`
}
