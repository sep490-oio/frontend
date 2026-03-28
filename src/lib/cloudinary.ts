import { idempotentPost } from './axios'
import type { UploadSignatureResponse, ConfirmUploadRequest, ConfirmUploadResponse } from '@/types/media'

// Step 1: Request signature from backend
export async function requestUploadSignature(
  context: string,
  fileName: string,
): Promise<UploadSignatureResponse> {
  const { data } = await idempotentPost<UploadSignatureResponse>('/media/upload-signature', {
    context,
    fileName,
  })
  return data
}

// Step 2: Upload file directly to Cloudinary
export async function uploadToCloudinary(
  file: File,
  signature: UploadSignatureResponse,
  onProgress?: (progress: UploadProgress) => void,
): Promise<CloudinaryResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('public_id', signature.publicId)
  formData.append('signature', signature.signature)
  formData.append('timestamp', String(signature.timestamp))
  formData.append('api_key', signature.apiKey)
  formData.append('folder', signature.folder)

  if (signature.allowedFormats?.length) {
    formData.append('allowed_formats', signature.allowedFormats.join(','))
  }

  if (signature.eager) {
    formData.append('eager', signature.eager)
    // Only set eager_async for video uploads
    if (signature.resourceType === 'video') {
      formData.append('eager_async', 'true')
    }
  }

  const response = await fetch(signature.uploadUrl, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed: ${response.statusText}`)
  }

  onProgress?.({ loaded: file.size, total: file.size, percent: 100 })
  return response.json() as Promise<CloudinaryResponse>
}

// Step 3: Confirm upload with backend
export async function confirmUpload(
  request: ConfirmUploadRequest,
): Promise<ConfirmUploadResponse> {
  const { data } = await idempotentPost<ConfirmUploadResponse>('/media/confirm', request)
  return data
}

// Batch: Request multiple upload signatures
export async function requestBatchUploadSignatures(
  files: { context: string; fileName: string }[],
): Promise<UploadSignatureResponse[]> {
  const { data } = await idempotentPost<UploadSignatureResponse[]>('/media/batch-upload-signatures', { files })
  return data
}

// Batch: Confirm multiple uploads
export async function batchConfirmUploads(
  requests: ConfirmUploadRequest[],
): Promise<ConfirmUploadResponse[]> {
  const { data } = await idempotentPost<ConfirmUploadResponse[]>('/media/batch-confirm', requests)
  return data
}

// Get available upload contexts
export async function getUploadContexts(): Promise<{ contexts: string[] }> {
  const { default: apiClient } = await import('./axios')
  const { data } = await apiClient.get<{ contexts: string[] }>('/media/contexts')
  return data
}

// Combined 3-step upload (single file)
export async function uploadMedia(
  file: File,
  context: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<ConfirmUploadResponse> {
  // Step 1
  const signature = await requestUploadSignature(context, file.name)

  // Client-side validation
  if (file.size > signature.maxFileSize) {
    throw new Error(`File too large. Max: ${Math.round(signature.maxFileSize / 1024 / 1024)}MB`)
  }
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext && signature.allowedFormats.length && !signature.allowedFormats.includes(ext)) {
    throw new Error(`Invalid format. Allowed: ${signature.allowedFormats.join(', ')}`)
  }

  // Step 2
  const cloudResult = await uploadToCloudinary(file, signature, onProgress)

  // Step 3 — extract format from Cloudinary response or fallback to file extension
  const format = cloudResult.format
    || file.name.split('.').pop()?.toLowerCase()
    || 'unknown'

  return confirmUpload({
    mediaUploadId: signature.mediaUploadId,
    publicId: signature.publicId,
    secureUrl: cloudResult.secure_url,
    bytes: cloudResult.bytes,
    format,
    fileName: file.name,
    width: cloudResult.width,
    height: cloudResult.height,
    durationSeconds: cloudResult.duration,
  })
}

export interface UploadProgress {
  loaded: number
  total: number
  percent: number
}

interface CloudinaryResponse {
  public_id: string
  secure_url: string
  bytes: number
  format?: string            // Not present for raw/document uploads
  width?: number
  height?: number
  duration?: number
  resource_type: string
  display_name?: string      // Original filename from Cloudinary
  original_filename?: string
  [key: string]: unknown
}
