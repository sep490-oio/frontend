interface QualityOptions {
  minWidth?: number
  minHeight?: number
  type?: 'document' | 'face'
}

interface QualityResult {
  isValid: boolean
  issues: string[]
  scores: { blur: number; brightness: number }
}

/**
 * Validate captured image quality using canvas pixel analysis.
 * Returns quality result with issues array for user feedback.
 */
export function validateCaptureQuality(
  canvas: HTMLCanvasElement,
  options: QualityOptions = {},
): QualityResult {
  const { minWidth = 800, minHeight = 600 } = options
  const issues: string[] = []

  const ctx = canvas.getContext('2d')
  if (!ctx) return { isValid: false, issues: ['Cannot analyze image'], scores: { blur: 0, brightness: 0 } }

  const { width, height } = canvas

  // Resolution check
  if (width < minWidth || height < minHeight) {
    issues.push(`Resolution too low (${width}x${height}). Minimum: ${minWidth}x${minHeight}.`)
  }

  const imageData = ctx.getImageData(0, 0, width, height)
  const pixels = imageData.data

  // Brightness check (average luminance)
  let totalLuminance = 0
  const pixelCount = width * height
  for (let i = 0; i < pixels.length; i += 4) {
    totalLuminance += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]
  }
  const avgBrightness = totalLuminance / pixelCount

  if (avgBrightness < 40) issues.push('Image is too dark. Please improve lighting.')
  if (avgBrightness > 220) issues.push('Image is too bright. Reduce glare or direct light.')

  // Blur detection (Laplacian variance on grayscale)
  // Sample center region for performance
  const sampleSize = Math.min(200, Math.floor(width / 2))
  const startX = Math.floor((width - sampleSize) / 2)
  const startY = Math.floor((height - sampleSize) / 2)

  let laplacianSum = 0
  let laplacianSqSum = 0
  let count = 0

  for (let y = startY + 1; y < startY + sampleSize - 1; y++) {
    for (let x = startX + 1; x < startX + sampleSize - 1; x++) {
      const idx = (y * width + x) * 4
      const gray = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2]

      const top = 0.299 * pixels[((y - 1) * width + x) * 4] + 0.587 * pixels[((y - 1) * width + x) * 4 + 1] + 0.114 * pixels[((y - 1) * width + x) * 4 + 2]
      const bottom = 0.299 * pixels[((y + 1) * width + x) * 4] + 0.587 * pixels[((y + 1) * width + x) * 4 + 1] + 0.114 * pixels[((y + 1) * width + x) * 4 + 2]
      const left = 0.299 * pixels[(y * width + x - 1) * 4] + 0.587 * pixels[(y * width + x - 1) * 4 + 1] + 0.114 * pixels[(y * width + x - 1) * 4 + 2]
      const right = 0.299 * pixels[(y * width + x + 1) * 4] + 0.587 * pixels[(y * width + x + 1) * 4 + 1] + 0.114 * pixels[(y * width + x + 1) * 4 + 2]

      const laplacian = top + bottom + left + right - 4 * gray
      laplacianSum += laplacian
      laplacianSqSum += laplacian * laplacian
      count++
    }
  }

  const mean = laplacianSum / count
  const blurScore = (laplacianSqSum / count) - (mean * mean)

  if (blurScore < 100) issues.push('Image is too blurry. Please hold your device steady.')

  return {
    isValid: issues.length === 0,
    issues,
    scores: { blur: blurScore, brightness: avgBrightness },
  }
}
