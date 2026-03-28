import apiClient, { extractArray } from '@/lib/axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import type { PagedList, PaginationParams } from '@/types'

// ── Types ────────────────────────────────────────────────────────────

export interface InspectionQueueItem {
  id: string
  itemId: string
  itemTitle: string
  sellerId: string
  sellerName: string
  providerCode: string
  status: string
  arrivedAt: string
  createdAt: string
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

export interface StorageLocationDto {
  id: string
  zone: string
  aisle: string
  shelf: string
  bin: string
  label: string
  isOccupied: boolean
  createdAt: string
}

// ── Inspection Queue ─────────────────────────────────────────────────

export function useInspectionQueue(params?: PaginationParams & { status?: string }) {
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

// ── Storage Locations ────────────────────────────────────────────────

export function useStorageLocations() {
  return useQuery({
    queryKey: queryKeys.warehouse.locations(),
    queryFn: async () => {
      const res = await apiClient.get('/warehouse/storage-locations')
      return extractArray<StorageLocationDto>(res.data)
    },
  })
}

export function useCreateStorageLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      zone: string
      aisle: string
      shelf: string
      bin: string
    }) => {
      const res = await apiClient.post<StorageLocationDto>('/warehouse/storage-locations', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warehouse.locations() })
    },
  })
}

export function useUpdateStorageLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string
      zone: string
      aisle: string
      shelf: string
      bin: string
    }) => {
      const res = await apiClient.put<StorageLocationDto>(`/warehouse/storage-locations/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warehouse.locations() })
    },
  })
}

export function useDeleteStorageLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/warehouse/storage-locations/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warehouse.locations() })
    },
  })
}

// ── Store Warehouse Item ─────────────────────────────────────────────

export function useStoreWarehouseItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { warehouseItemId: string; storageLocationId: string }) => {
      const { warehouseItemId, ...body } = data
      const res = await apiClient.post(
        `/warehouse/warehouse-items/${warehouseItemId}/store`,
        body,
      )
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.warehouse.all })
    },
  })
}
