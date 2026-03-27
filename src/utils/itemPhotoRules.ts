// High-risk categories that require at least one live-captured photo
const HIGH_RISK_CATEGORIES = new Set([
  'luxury',
  'collectible',
  'electronics',
  'jewelry',
  'watches',
  'designer',
  'art',
  'antiques',
])

export function isHighRiskCategory(categoryId: string): boolean {
  return HIGH_RISK_CATEGORIES.has(categoryId.toLowerCase())
}

export function getPhotoChecklist(_categoryId?: string): string[] {
  return [
    'Overview (full item)',
    'Front view',
    'Back view',
    'Serial number / Label',
    'Defects or wear (if any)',
  ]
}
