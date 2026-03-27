const PROVIDER_LABELS: Record<string, string> = {
  ghn: 'Giao Hang Nhanh (GHN)',
  ghtk: 'Giao Hang Tiet Kiem (GHTK)',
  external: 'External Carrier',
}

const MODE_LABELS: Record<string, string> = {
  platform_managed: 'Platform Managed',
  external_carrier: 'External Carrier',
}

const STATUS_LABELS: Record<string, string> = {
  awaiting_pickup: 'Awaiting Pickup',
  in_transit: 'In Transit',
  arrived: 'Arrived',
  inspected: 'Inspected',
  completed: 'Completed',
  cancelled: 'Cancelled',
  failed: 'Failed',
}

const NEXT_STEP_MESSAGES: Record<string, string> = {
  awaiting_pickup: 'Waiting for carrier pickup. Update tracking number after handover.',
  in_transit: 'Your shipment is on the way to the warehouse.',
  arrived: 'Package arrived at warehouse. Inspection pending.',
  inspected: 'Inspection complete. Awaiting final processing.',
  completed: 'Item is stored in warehouse and ready for auction.',
  cancelled: 'This shipment has been cancelled.',
  failed: 'Shipment failed. Please contact support.',
}

const STEP_INDEX: Record<string, number> = {
  awaiting_pickup: 0,
  in_transit: 1,
  arrived: 2,
  inspected: 3,
  completed: 4,
}

export function getProviderLabel(code?: string): string {
  if (!code) return 'Unknown'
  return PROVIDER_LABELS[code.toLowerCase()] ?? code.toUpperCase()
}

export function getModeLabel(mode?: string): string {
  if (!mode) return 'Platform Managed'
  return MODE_LABELS[mode.toLowerCase()] ?? mode.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getStatusLabel(status?: string): string {
  if (!status) return 'Unknown'
  return STATUS_LABELS[status.toLowerCase()] ?? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getNextStepMessage(status?: string): string {
  if (!status) return ''
  return NEXT_STEP_MESSAGES[status.toLowerCase()] ?? 'Status update pending.'
}

export function getStepperIndex(status?: string): number {
  if (!status) return 0
  return STEP_INDEX[status.toLowerCase()] ?? 0
}

export function isCancelledStatus(status?: string): boolean {
  return status?.toLowerCase() === 'cancelled'
}

export function isFailedStatus(status?: string): boolean {
  return status?.toLowerCase() === 'failed'
}

export function formatWeight(grams?: number): string {
  if (grams == null) return '—'
  if (grams >= 1000) return `${(grams / 1000).toFixed(1)}kg`
  return `${grams}g`
}
