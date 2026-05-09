import apiClient, { extractArray } from '@/lib/axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  WarehouseToSellerShipmentDto,
  WarehouseToSellerShipmentEvidenceDto,
} from '@/types'
import type { WarehouseReturnEvidenceCategory } from '@/types/enums'

// Shared cache key used by the warehouse-staff return screens and by the
// seller-side confirm flow so invalidations cross both personas when the
// staff marks a return shipped (seller dashboard widgets should refresh).
const warehouseReturnsQueryKey = ['warehouse-returns'] as const

export type StaffWarehouseReturnStatusFilter = 'pending' | 'in_transit' | 'all'

/**
 * Staff-side pending/active return shipments awaiting tracking or delivery
 * confirmation.
 *
 * Backed by GET /api/warehouse-staff/returns with an optional `status`
 * filter ('pending' | 'in_transit' | 'all'). Defaults to `'all'`.
 */
export function useStaffPendingReturns(options?: { status?: StaffWarehouseReturnStatusFilter }) {
  const status = options?.status ?? 'all'
  return useQuery({
    queryKey: [...warehouseReturnsQueryKey, 'staff', status] as const,
    queryFn: async () => {
      const res = await apiClient.get<WarehouseToSellerShipmentDto[]>('/warehouse-staff/returns', {
        params: { status },
      })
      return extractArray<WarehouseToSellerShipmentDto>(res.data)
    },
  })
}

export interface MarkWarehouseReturnShippedRequest {
  id: string
  providerCode: string
  trackingNumber: string
  shippedAt: string
}

/**
 * Warehouse staff records tracking details for a return shipment and
 * transitions it to `InTransit`.
 */
export function useMarkWarehouseReturnShipped() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, providerCode, trackingNumber, shippedAt }: MarkWarehouseReturnShippedRequest) => {
      const res = await apiClient.post<WarehouseToSellerShipmentDto>(
        `/warehouse-staff/returns/${id}/ship`,
        { providerCode, trackingNumber, shippedAt },
      )
      return res.data
    },
    onSuccess: () => {
      // Refresh both staff + seller lists — staff sees the row flip out of
      // "Pending" and seller sees the "In Transit" count move up.
      qc.invalidateQueries({ queryKey: warehouseReturnsQueryKey })
    },
  })
}

export interface RecordWarehouseReturnDeliveryFailureRequest {
  id: string
  reason: string
}

/**
 * Warehouse staff records that a return shipment failed to deliver
 * (returned-to-warehouse). Used when the carrier bounces the package back.
 */
export function useRecordWarehouseReturnDeliveryFailure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: RecordWarehouseReturnDeliveryFailureRequest) => {
      const res = await apiClient.post<WarehouseToSellerShipmentDto>(
        `/warehouse-staff/returns/${id}/delivery-failure`,
        { reason },
      )
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseReturnsQueryKey })
    },
  })
}

/**
 * Warehouse staff manually marks a return shipment as delivered.
 * Used for manual / self-delivery carriers where there is no external
 * webhook to automatically transition InTransit → Delivered.
 */
export function useMarkWarehouseReturnDelivered() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/warehouse-staff/returns/${id}/mark-delivered`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseReturnsQueryKey })
    },
  })
}

/**
 * Staff uploads a PickupByWarehouseStaff photo on a return shipment.
 * Required before POST /warehouse-staff/returns/{id}/ship will succeed —
 * BE enforces the guard on MarkShipped.
 */
export function useAddWarehouseReturnEvidenceStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      mediaUploadId,
      category,
    }: {
      id: string
      mediaUploadId: string
      category: WarehouseReturnEvidenceCategory
    }) => {
      const res = await apiClient.post<WarehouseToSellerShipmentEvidenceDto>(
        `/warehouse-staff/returns/${id}/evidence`,
        { mediaUploadId, category },
      )
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: warehouseReturnsQueryKey })
    },
  })
}
