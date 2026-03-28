export interface UploadSignatureResponse {
  mediaUploadId: string
  uploadUrl: string
  signature: string
  timestamp: number
  apiKey: string
  cloudName: string
  publicId: string
  storagePublicId: string
  folder: string
  eager?: string
  resourceType: string
  maxFileSize: number
  allowedFormats: string[]
}

export interface ConfirmUploadRequest {
  mediaUploadId: string
  publicId: string
  secureUrl: string
  bytes: number
  format: string
  fileName?: string
  width?: number
  height?: number
  durationSeconds?: number
}

export interface ConfirmUploadResponse {
  mediaUploadId: string
  secureUrl: string
  publicId: string
  resourceType: string
}

export interface UploadContextDto {
  name: string
  resourceType: string
  maxFileSizeBytes: number
  allowedFormats: string[]
  maxUploadsPerEntity: number
}

export interface MediaDto {
  id: string
  url: string
  thumbnailUrl?: string
  publicId: string
  resourceType: string
  createdAt: string
}
