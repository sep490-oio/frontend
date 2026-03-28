import { useState, useCallback } from 'react'
import { uploadMedia } from '@/lib/cloudinary'
import type { UploadProgress } from '@/lib/cloudinary'
import type { ConfirmUploadResponse } from '@/types/media'

interface UploadedFile {
  mediaUploadId: string
  secureUrl: string
  publicId: string
  resourceType: string
  fileName: string
}

interface UseMediaUploadReturn {
  upload: (file: File) => Promise<ConfirmUploadResponse>
  uploadMultiple: (files: File[]) => Promise<ConfirmUploadResponse[]>
  uploading: boolean
  progress: number
  uploadedFiles: UploadedFile[]
  error: string | null
  reset: () => void
  removeFile: (mediaUploadId: string) => void
}

export type { UploadedFile }

export function useMediaUpload(context: string): UseMediaUploadReturn {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const reset = useCallback(() => {
    setUploading(false)
    setProgress(0)
    setError(null)
    setUploadedFiles([])
  }, [])

  const removeFile = useCallback((mediaUploadId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.mediaUploadId !== mediaUploadId))
  }, [])

  const upload = useCallback(async (file: File): Promise<ConfirmUploadResponse> => {
    setUploading(true)
    setProgress(0)
    setError(null)
    try {
      const result = await uploadMedia(file, context, (p: UploadProgress) => setProgress(p.percent))
      setUploadedFiles(prev => [...prev, {
        mediaUploadId: result.mediaUploadId,
        secureUrl: result.secureUrl,
        publicId: result.publicId,
        resourceType: result.resourceType,
        fileName: file.name,
      }])
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setError(msg)
      throw err
    } finally {
      setUploading(false)
    }
  }, [context])

  const uploadMultiple = useCallback(async (files: File[]): Promise<ConfirmUploadResponse[]> => {
    setUploading(true)
    setError(null)
    const results: ConfirmUploadResponse[] = []
    try {
      for (let i = 0; i < files.length; i++) {
        setProgress(Math.round((i / files.length) * 100))
        const result = await uploadMedia(files[i], context)
        results.push(result)
        setUploadedFiles(prev => [...prev, {
          mediaUploadId: result.mediaUploadId,
          secureUrl: result.secureUrl,
          publicId: result.publicId,
          resourceType: result.resourceType,
          fileName: files[i].name,
        }])
      }
      setProgress(100)
      return results
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setError(msg)
      throw err
    } finally {
      setUploading(false)
    }
  }, [context])

  return { upload, uploadMultiple, uploading, progress, uploadedFiles, error, reset, removeFile }
}
