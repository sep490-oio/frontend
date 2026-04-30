export type CaptureQualityProfile = 'strict_document' | 'face' | 'item_or_package'

export type CaptureQualityDecision = 'accepted' | 'warning' | 'rejected'

export type CaptureQualityRejectionReason =
  | 'resolution_too_low'
  | 'too_dark'
  | 'too_bright'
  | 'blur_severe'

export interface CaptureQualityResult {
  decision: CaptureQualityDecision
  qualityProfile: CaptureQualityProfile
  selectedFrameIndex: number
  /** Best (max) blur score across sampled regions. */
  blurScore: number
  /** Average luminance, 0..255. */
  brightnessScore: number
  /** Human-readable warning keys, e.g. "borderline_blur". */
  warnings: string[]
  rejectionReason?: CaptureQualityRejectionReason
}

export interface CaptureMetadata {
  captureSource: 'camera' | 'file_picker'
  facingMode?: 'user' | 'environment'
  resolution?: { width: number; height: number }
  capturedAt: string
  step: string
  challengeId?: string
  burstId?: string
  /** Populated by SecureCaptureUploader after burst capture + validation. */
  qualityScore?: CaptureQualityResult
  livenessCheckPassed?: boolean
}

export type CaptureStep = 'id_front' | 'id_back' | 'selfie' | 'item_photo'
export type OverlayType = 'document' | 'face'
export type LivenessChallenge = 'blink' | 'head_left' | 'head_right'
