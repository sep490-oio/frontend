export interface CaptureMetadata {
  captureSource: 'camera' | 'file_picker'
  facingMode?: 'user' | 'environment'
  resolution?: { width: number; height: number }
  capturedAt: string
  step: string
  challengeId?: string
  burstId?: string
  qualityScore?: { blur: number; brightness: number }
  livenessCheckPassed?: boolean
}

export type CaptureStep = 'id_front' | 'id_back' | 'selfie' | 'item_photo'
export type OverlayType = 'document' | 'face'
export type LivenessChallenge = 'blink' | 'head_left' | 'head_right'
