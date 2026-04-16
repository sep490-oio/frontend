import apiClient from '@/lib/axios'
import { useQuery } from '@tanstack/react-query'
import type { ProvinceDto, DistrictDto, WardDto } from '@/types/address'

export const addressQueryKeys = {
  all: ['address'] as const,
  provinces: () => [...addressQueryKeys.all, 'provinces'] as const,
  districts: (provinceId?: number) => [...addressQueryKeys.all, 'districts', provinceId] as const,
  wards: (districtId?: number) => [...addressQueryKeys.all, 'wards', districtId] as const,
}

export function useProvinces() {
  return useQuery({
    queryKey: addressQueryKeys.provinces(),
    queryFn: async () => {
      const res = await apiClient.get<ProvinceDto[]>('/address/provinces')
      return res.data
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours (provinces rarely change)
  })
}

export function useDistricts(provinceId?: number) {
  return useQuery({
    queryKey: addressQueryKeys.districts(provinceId),
    queryFn: async () => {
      const res = await apiClient.get<DistrictDto[]>('/address/districts', { params: { province_id: provinceId } })
      return res.data
    },
    enabled: !!provinceId,
    staleTime: 1000 * 60 * 60 * 24,
  })
}

export function useWards(districtId?: number) {
  return useQuery({
    queryKey: addressQueryKeys.wards(districtId),
    queryFn: async () => {
      const res = await apiClient.get<WardDto[]>('/address/wards', { params: { district_id: districtId } })
      return res.data
    },
    enabled: !!districtId,
    staleTime: 1000 * 60 * 60 * 24,
  })
}
