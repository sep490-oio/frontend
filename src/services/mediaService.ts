/**
 * Media Upload Service — Cloudinary signed upload flow.
 *
 * The backend owns the Cloudinary API secret. The FE never sees it.
 * Instead, we follow a 3-step signed upload flow:
 *
 *   1. Ask BE for a signature:  POST /api/media/upload-signature
 *   2. Upload file to Cloudinary directly (using the signature)
 *   3. Confirm with BE:         POST /api/media/confirm
 *
 * This keeps the secret server-side while letting the browser upload
 * directly to Cloudinary (no file proxying through our backend).
 *
 * Source: docs/vps/Flow Create Item.txt, docs/vps/Cloudinary.txt
 */
import { api } from './api';
import type { ApiResponse } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────

/** Request body for POST /api/media/upload-signature */
export interface UploadSignatureRequest {
  /** Where this media will be used — e.g. "item_image", "avatar" */
  context: string;
  /** Original file name — BE uses this for naming the public ID */
  fileName: string;
}

/** Response from POST /api/media/upload-signature */
export interface UploadSignatureResponse {
  mediaUploadId: string;
  uploadUrl: string;
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  publicId: string;
  folder: string;
  /** Eager transforms — e.g. "w_800,h_800,c_limit|w_400,h_400,c_fill|w_200,h_200,c_thumb" */
  eager: string;
  resourceType: string;
  maxFileSize: number;
  allowedFormats: string[];
}

/** Request body for POST /api/media/confirm */
export interface ConfirmUploadRequest {
  mediaUploadId: string;
  publicId: string | null;
  secureUrl: string | null;
  bytes: number;
  format: string | null;
  width: number | null;
  height: number | null;
  /** Only needed for video uploads */
  durationSeconds: number | null;
}

/** Response from POST /api/media/confirm */
export interface ConfirmUploadResponse {
  mediaUploadId: string;
  publicId: string | null;
  secureUrl: string | null;
  resourceType: string | null;
}

/** Cloudinary's response after a successful upload (relevant fields only) */
interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  bytes: number;
  format: string;
  width: number;
  height: number;
  resource_type: string;
  duration?: number;
}

/** Progress callback for tracking upload percentage */
export type UploadProgressCallback = (percent: number) => void;

/** Final result returned by the high-level uploadMedia function */
export interface MediaUploadResult {
  mediaUploadId: string;
  publicId: string;
  secureUrl: string;
  resourceType: string;
}

// ─── Step 1: Get Upload Signature ───────────────────────────────────

async function getUploadSignature(
  context: string,
  fileName: string
): Promise<UploadSignatureResponse> {
  const { data } = await api.post<ApiResponse<UploadSignatureResponse>>(
    '/api/media/upload-signature',
    { context, fileName } satisfies UploadSignatureRequest
  );
  return data.data;
}

// ─── Step 2: Upload to Cloudinary ───────────────────────────────────

/**
 * Uploads a file directly to Cloudinary using the signed params from Step 1.
 * Uses XMLHttpRequest (via FormData) to support upload progress tracking.
 */
async function uploadToCloudinary(
  file: File,
  signature: UploadSignatureResponse,
  onProgress?: UploadProgressCallback
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signature.apiKey);
  formData.append('timestamp', String(signature.timestamp));
  formData.append('signature', signature.signature);
  formData.append('public_id', signature.publicId);
  formData.append('folder', signature.folder);
  formData.append('eager', signature.eager);

  // Upload directly to Cloudinary (NOT through our backend API)
  // Using fetch here instead of our `api` axios instance because this
  // goes to Cloudinary's URL, not our backend
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', signature.uploadUrl);

    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as CloudinaryUploadResult);
      } else {
        reject(new Error(`Cloudinary upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Cloudinary upload network error'));
    });

    xhr.send(formData);
  });
}

// ─── Step 3: Confirm Upload with Backend ────────────────────────────

async function confirmUpload(
  mediaUploadId: string,
  cloudinaryResult: CloudinaryUploadResult
): Promise<ConfirmUploadResponse> {
  const body: ConfirmUploadRequest = {
    mediaUploadId,
    publicId: cloudinaryResult.public_id,
    secureUrl: cloudinaryResult.secure_url,
    bytes: cloudinaryResult.bytes,
    format: cloudinaryResult.format,
    width: cloudinaryResult.width,
    height: cloudinaryResult.height,
    durationSeconds: cloudinaryResult.duration ?? null,
  };

  const { data } = await api.post<ApiResponse<ConfirmUploadResponse>>(
    '/api/media/confirm',
    body
  );
  return data.data;
}

// ─── High-Level Orchestrator ────────────────────────────────────────

/**
 * Uploads a media file end-to-end: signature -> Cloudinary -> confirm.
 *
 * Usage:
 *   const result = await uploadMedia(file, 'item_image', (pct) => {
 *     console.log(`Upload: ${pct}%`);
 *   });
 *   // result.mediaUploadId — use when creating an item
 *   // result.secureUrl — for preview
 */
async function uploadMedia(
  file: File,
  context: string,
  onProgress?: UploadProgressCallback
): Promise<MediaUploadResult> {
  // Step 1: Get signed params from our backend
  const signature = await getUploadSignature(context, file.name);

  // Validate file before uploading
  if (file.size > signature.maxFileSize) {
    throw new Error(
      `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds max ${(signature.maxFileSize / 1024 / 1024).toFixed(0)}MB`
    );
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (
    signature.allowedFormats.length > 0 &&
    !signature.allowedFormats.includes(extension)
  ) {
    throw new Error(
      `File format "${extension}" not allowed. Accepted: ${signature.allowedFormats.join(', ')}`
    );
  }

  // Step 2: Upload directly to Cloudinary
  const cloudinaryResult = await uploadToCloudinary(file, signature, onProgress);

  // Step 3: Confirm with our backend
  const confirmed = await confirmUpload(signature.mediaUploadId, cloudinaryResult);

  return {
    mediaUploadId: confirmed.mediaUploadId,
    publicId: cloudinaryResult.public_id,
    secureUrl: cloudinaryResult.secure_url,
    resourceType: confirmed.resourceType ?? cloudinaryResult.resource_type,
  };
}

// ─── Public API ─────────────────────────────────────────────────────

export const mediaService = {
  getUploadSignature,
  uploadToCloudinary,
  confirmUpload,
  uploadMedia,
} as const;
