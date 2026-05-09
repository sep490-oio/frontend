import type {
  CaptureQualityProfile,
  CaptureQualityResult,
} from '@/types/capture'

/**
 * Quality profile thresholds. Each profile tunes blur/brightness/resolution
 * for its capture context (document scans vs. selfies vs. warehouse items).
 *
 * Three blur tiers per profile: reject (definitely unusable),
 * warning (borderline — let user proceed with banner),
 * accept (clean — silent pass).
 */
export const QUALITY_PROFILE_THRESHOLDS = {
  strict_document: {
    // Relaxed for web — webcam feeds are inherently softer than native mobile cameras.
    // Old values: blurReject 35 / blurWarning 80 / blurAccept 90
    blurReject: 15,
    blurWarning: 40,
    blurAccept: 60,
    brightnessMin: 45,
    brightnessMax: 230,
    minResolution: { width: 640, height: 480 },
  },
  face: {
    // Relaxed for web — selfie via webcam is inherently lower quality.
    // Old values: blurReject 25 / blurWarning 55 / blurAccept 65
    blurReject: 12,
    blurWarning: 30,
    blurAccept: 50,
    brightnessMin: 40,
    brightnessMax: 235,
    minResolution: { width: 320, height: 320 },
  },
  item_or_package: {
    // Very lenient — only block extremely blurry frames.
    blurReject: 15,
    blurWarning: 35,
    blurAccept: 70,
    // Warehouse low-light tolerant.
    brightnessMin: 30,
    brightnessMax: 240,
    minResolution: { width: 480, height: 360 },
  },
} as const

type RegionKey = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

/** Extract a square region of `regionSize` from imageData at the given anchor. */
function extractRegion(
  imageData: ImageData,
  region: RegionKey,
  regionSize: number,
): ImageData {
  const { width, height, data } = imageData
  const size = Math.min(regionSize, Math.floor(width / 2), Math.floor(height / 2))
  let startX = 0
  let startY = 0
  switch (region) {
    case 'center':
      startX = Math.floor((width - size) / 2)
      startY = Math.floor((height - size) / 2)
      break
    case 'top-left':
      startX = Math.floor(width * 0.1)
      startY = Math.floor(height * 0.1)
      break
    case 'top-right':
      startX = Math.floor(width * 0.9) - size
      startY = Math.floor(height * 0.1)
      break
    case 'bottom-left':
      startX = Math.floor(width * 0.1)
      startY = Math.floor(height * 0.9) - size
      break
    case 'bottom-right':
      startX = Math.floor(width * 0.9) - size
      startY = Math.floor(height * 0.9) - size
      break
  }
  startX = Math.max(0, Math.min(width - size, startX))
  startY = Math.max(0, Math.min(height - size, startY))

  const out = new Uint8ClampedArray(size * size * 4)
  for (let y = 0; y < size; y++) {
    const srcRow = (startY + y) * width
    const dstRow = y * size
    for (let x = 0; x < size; x++) {
      const srcIdx = (srcRow + (startX + x)) * 4
      const dstIdx = (dstRow + x) * 4
      out[dstIdx] = data[srcIdx]
      out[dstIdx + 1] = data[srcIdx + 1]
      out[dstIdx + 2] = data[srcIdx + 2]
      out[dstIdx + 3] = data[srcIdx + 3]
    }
  }
  return new ImageData(out, size, size)
}

/** Compute Laplacian variance over an ImageData region (higher = sharper). */
function computeLaplacianVariance(region: ImageData): number {
  const { width, height, data } = region
  if (width < 3 || height < 3) return 0

  let laplacianSum = 0
  let laplacianSqSum = 0
  let count = 0

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4
      const gray =
        0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]

      const topIdx = ((y - 1) * width + x) * 4
      const bottomIdx = ((y + 1) * width + x) * 4
      const leftIdx = (y * width + (x - 1)) * 4
      const rightIdx = (y * width + (x + 1)) * 4

      const top = 0.299 * data[topIdx] + 0.587 * data[topIdx + 1] + 0.114 * data[topIdx + 2]
      const bottom = 0.299 * data[bottomIdx] + 0.587 * data[bottomIdx + 1] + 0.114 * data[bottomIdx + 2]
      const left = 0.299 * data[leftIdx] + 0.587 * data[leftIdx + 1] + 0.114 * data[leftIdx + 2]
      const right = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2]

      const laplacian = top + bottom + left + right - 4 * gray
      laplacianSum += laplacian
      laplacianSqSum += laplacian * laplacian
      count++
    }
  }
  if (count === 0) return 0
  const mean = laplacianSum / count
  return laplacianSqSum / count - mean * mean
}

/**
 * Sample multiple regions for `item_or_package` (warehouse photos may have
 * subjects off-center) and use the BEST score. Document/face profiles use
 * center only (subject is always framed).
 */
function computeMultiRegionBlurScore(
  imageData: ImageData,
  profile: CaptureQualityProfile,
): number {
  // Use multi-region sampling for all profiles so the BEST region counts.
  // For documents/faces, also sample corners — useful on web where autofocus
  // may lock onto a non-center region.
  const regions: RegionKey[] =
    profile === 'item_or_package'
      ? ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right']
      : ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right']

  // 200x200 regions (or proportional if image is small).
  const regionSize = Math.min(200, Math.floor(imageData.width / 2), Math.floor(imageData.height / 2))
  if (regionSize < 3) return 0

  const scores = regions.map((r) =>
    computeLaplacianVariance(extractRegion(imageData, r, regionSize)),
  )
  return Math.max(...scores)
}

/** Average luminance across the entire frame, 0..255. */
function computeBrightness(imageData: ImageData): number {
  const { data } = imageData
  if (data.length === 0) return 0
  let total = 0
  const pixelCount = data.length / 4
  for (let i = 0; i < data.length; i += 4) {
    total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }
  return total / pixelCount
}

/** Pick the sharpest frame from a burst using the multi-region score. */
export function pickBestFrame(
  frames: ImageData[],
  profile: CaptureQualityProfile,
): { frame: ImageData; index: number; score: number } {
  if (frames.length === 0) {
    throw new Error('pickBestFrame requires at least one frame')
  }
  const scored = frames.map((f, i) => ({
    frame: f,
    index: i,
    score: computeMultiRegionBlurScore(f, profile),
  }))
  scored.sort((a, b) => b.score - a.score)
  return scored[0]
}

/**
 * Validate a burst of captured frames against the given quality profile.
 * Picks the best frame, then runs resolution → brightness → blur tier checks.
 */
export function validateCaptureQuality(
  frames: ImageData[],
  profile: CaptureQualityProfile = 'item_or_package',
): CaptureQualityResult {
  if (frames.length === 0) {
    return {
      decision: 'rejected',
      qualityProfile: profile,
      selectedFrameIndex: 0,
      blurScore: 0,
      brightnessScore: 0,
      warnings: [],
      rejectionReason: 'resolution_too_low',
    }
  }

  const best = pickBestFrame(frames, profile)
  const thresholds = QUALITY_PROFILE_THRESHOLDS[profile]
  const brightness = computeBrightness(best.frame)

  const baseResult = {
    qualityProfile: profile,
    selectedFrameIndex: best.index,
    blurScore: best.score,
    brightnessScore: brightness,
  }

  // Resolution check (severe reject).
  if (
    best.frame.width < thresholds.minResolution.width ||
    best.frame.height < thresholds.minResolution.height
  ) {
    return {
      ...baseResult,
      decision: 'rejected',
      warnings: [],
      rejectionReason: 'resolution_too_low',
    }
  }

  // Brightness extremes (severe reject).
  if (brightness < thresholds.brightnessMin) {
    return { ...baseResult, decision: 'rejected', warnings: [], rejectionReason: 'too_dark' }
  }
  if (brightness > thresholds.brightnessMax) {
    return { ...baseResult, decision: 'rejected', warnings: [], rejectionReason: 'too_bright' }
  }

  // Blur tiers.
  if (best.score < thresholds.blurReject) {
    return { ...baseResult, decision: 'rejected', warnings: [], rejectionReason: 'blur_severe' }
  }
  if (best.score < thresholds.blurWarning) {
    return { ...baseResult, decision: 'warning', warnings: ['borderline_blur'] }
  }

  return { ...baseResult, decision: 'accepted', warnings: [] }
}

/**
 * @deprecated Legacy canvas-based single-frame validator. Kept for
 * backward compat. New code should use `validateCaptureQuality(frames, profile)`.
 */
export function validateCanvasQuality(
  canvas: HTMLCanvasElement,
  options: { minWidth?: number; minHeight?: number; type?: 'document' | 'face' } = {},
): { isValid: boolean; issues: string[]; scores: { blur: number; brightness: number } } {
  const { minWidth = 800, minHeight = 600 } = options
  const issues: string[] = []
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return { isValid: false, issues: ['Cannot analyze image'], scores: { blur: 0, brightness: 0 } }
  }
  const { width, height } = canvas
  if (width < minWidth || height < minHeight) {
    issues.push(`Resolution too low (${width}x${height}). Minimum: ${minWidth}x${minHeight}.`)
  }
  const imageData = ctx.getImageData(0, 0, width, height)
  const brightness = computeBrightness(imageData)
  if (brightness < 40) issues.push('Image is too dark. Please improve lighting.')
  if (brightness > 220) issues.push('Image is too bright. Reduce glare or direct light.')
  const profile: CaptureQualityProfile = options.type === 'face' ? 'face' : 'strict_document'
  const blur = computeMultiRegionBlurScore(imageData, profile)
  if (blur < 100) issues.push('Image is too blurry. Please hold your device steady.')
  return {
    isValid: issues.length === 0,
    issues,
    scores: { blur, brightness },
  }
}
