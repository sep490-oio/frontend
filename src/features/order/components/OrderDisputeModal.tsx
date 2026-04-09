/**
 * @deprecated Use CreateDisputeModal from './CreateDisputeModal' instead.
 * This file re-exports for backwards compatibility.
 */
export { OrderDisputeModal, CreateDisputeModal } from './CreateDisputeModal'
export type { CreateDisputeModalProps, DisputeTargetType } from './CreateDisputeModal'
// Re-export is kept for backwards compatibility — all new code should import CreateDisputeModal directly.

export interface OrderDisputeModalProps {
  orderId: string
  open: boolean
  onClose: () => void
  redirectPath?: string
}
