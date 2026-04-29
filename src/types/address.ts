export interface ProvinceDto {
  provinceId: number
  provinceName: string
}

export interface DistrictDto {
  districtId: number
  districtName: string
}

export interface WardDto {
  wardCode: string
  wardName: string
}

export interface GhnMetadata {
  id: number // districtId
  code: string // wardCode
}
