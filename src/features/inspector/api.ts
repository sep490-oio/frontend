import apiClient from '@/lib/axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import type { PagedList } from '@/types'

/**
 * @deprecated Storage-location ownership moved to warehouse-staff. Import from
 * `@/features/warehouse/api` instead. Re-exported here for back-compat only.
 */
export {
  useStorageLocations,
  useCreateStorageLocation,
  useUpdateStorageLocation,
  useDeleteStorageLocation,
  useStoreWarehouseItem,
} from '@/features/warehouse/api'
/** @deprecated Import from `@/features/warehouse/api`. */
export type { StorageLocationDto, StorageLocationsParams } from '@/features/warehouse/api'

// ── Types ────────────────────────────────────────────────────────────

export interface InspectionQueueItem {
  inboundShipmentId: string
  itemId: string
  itemTitle: string
  sellerId: string
  warehouseItemId?: string
  inspectionId?: string
  shipmentStatus: string
  queueStatus: string
  carrierTrackingNumber?: string
  arrivedAt?: string
  declaredCondition: string
  conditionOnArrival?: string
  inspectedAt?: string
  storageLocationLabel?: string
  itemImageUrl?: string
}

export interface WarehouseInspectionDto {
  id: string
  warehouseItemId: string
  inboundShipmentId: string
  itemId: string
  declaredCondition: string
  conditionOnArrival: string
  inspectionNotes?: string
  decisionStatus: string
  decisionReason?: string
  inspectedBy: string
  inspectedAt: string
  reviewedBy?: string
  reviewedAt?: string
  sellerConfirmedAt?: string
  createdAt: string
  evidence: InspectionEvidenceDto[]
}

export interface InspectionEvidenceDto {
  id: string
  url: string
  type: string
}

// ── Inspection Queue ─────────────────────────────────────────────────

export function useInspectionQueue(params?: { pageNumber?: number; pageSize?: number; status?: string }) {
  return useQuery({
    queryKey: [...queryKeys.warehouse.all, 'inspectionQueue', params],
    queryFn: async () => {
      const res = await apiClient.get<PagedList<InspectionQueueItem>>(
        '/warehouse/inbound-shipments/inspection-queue',
        { params },
      )
      return res.data
    },
  })
}

// ── Inspect Item ─────────────────────────────────────────────────────

export function useInspectItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      shipmentId: string
      condition: string
      inspectionNotes?: string
      inspectionMediaUploadIds?: string[]
    }) => {
      const { shipmentId, ...body } = data
      const res = await apiClient.post<WarehouseInspectionDto>(
        `/warehouse/inbound-shipments/${shipmentId}/inspect`,
        body,
      )
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warehouse.all })
    },
  })
}

/**
 * Multipart variant of useInspectItem. Posts the inspection form directly as
 * `multipart/form-data` to `/warehouse/inbound-shipments/{id}/inspect/multipart`,
 * bypassing the separate media-upload step. Prefer this when file uploads are
 * part of the submission — callers pass raw `File` blobs instead of
 * pre-confirmed `mediaUploadId`s.
 *
 * Mirrors the pattern used by {@link file://./../warehouse/api.ts#useReceiveInboundPackage}.
 */
export function useInspectItemMultipart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      shipmentId: string
      condition: string
      inspectionNotes?: string
      inspectionPhotos?: File[]
    }) => {
      const { shipmentId, condition, inspectionNotes, inspectionPhotos } = data
      const form = new FormData()
      form.append('condition', condition)
      if (inspectionNotes) form.append('inspectionNotes', inspectionNotes)
      if (inspectionPhotos) {
        for (const file of inspectionPhotos) {
          form.append('inspectionPhotos', file)
        }
      }
      const res = await apiClient.post<WarehouseInspectionDto>(
        `/warehouse/inbound-shipments/${shipmentId}/inspect/multipart`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warehouse.all })
    },
  })
}

// ── Review Inspection ────────────────────────────────────────────────

export function useReviewInspection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      shipmentId: string
      decision: string
      reason?: string
    }) => {
      const { shipmentId, ...body } = data
      const res = await apiClient.post<WarehouseInspectionDto>(
        `/warehouse/inbound-shipments/${shipmentId}/review`,
        body,
      )
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warehouse.all })
    },
  })
}

