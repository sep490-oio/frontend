interface SlotConfig {
  type: string
  label: string
  required: boolean
  accept: string
}

export const SLOT_CONFIGS: Record<string, SlotConfig[]> = {
  government_id: [
    { type: 'id_front', label: 'ID Front', required: true, accept: 'image/*' },
    { type: 'id_back', label: 'ID Back', required: false, accept: 'image/*' },
    { type: 'selfie', label: 'Selfie', required: true, accept: 'image/*' },
  ],
  passport: [
    { type: 'id_front', label: 'Passport Page', required: true, accept: 'image/*' },
    { type: 'selfie', label: 'Selfie', required: true, accept: 'image/*' },
  ],
  business_owner: [
    { type: 'business_license', label: 'Business License', required: true, accept: 'image/*,.pdf' },
    { type: 'id_front', label: 'ID Front', required: true, accept: 'image/*' },
  ],
  manual: [
    { type: 'other', label: 'Document', required: true, accept: 'image/*,.pdf' },
  ],
}

export function getRequiredSlots(verificationType: string): string[] {
  const slots = SLOT_CONFIGS[verificationType] ?? SLOT_CONFIGS.manual
  return slots.filter((s) => s.required).map((s) => s.type)
}
