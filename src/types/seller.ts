import type { IdentityVerificationStatus, SellerProfileStatus } from './enums'

export interface SellerProfileDto {
  id: string
  userId: string
  storeName: string
  description?: string
  logo?: string
  rating: number
  reviewCount: number
  trustScore?: number
  status: SellerProfileStatus
  createdAt: string
  approvedAt?: string
}

export interface CreateSellerProfileRequest {
  storeName: string
  description?: string
}

export interface VerificationDocumentInfoDto {
  idType: string
  idNumber: string
  issuedDate?: string
  expiredDate?: string
  issuedPlace?: string
}

export interface VerificationAddressDto {
  fullAddress: string
  province: string
  district: string
  ward: string
}

export interface VerificationDocumentDto {
  id: string
  documentType: string
  resourceType: string
  secureUrl: string
  fileHash?: string
  mimeType?: string
  verificationStatus: string
  uploadedAt: string
  createdAt: string
}

export interface VerificationDto {
  id: string
  userId: string
  verificationType: string
  autoVerified: boolean
  fullName?: string
  dateOfBirth?: string
  gender?: string
  nationality?: string
  document?: VerificationDocumentInfoDto
  permanentAddress?: VerificationAddressDto
  status: IdentityVerificationStatus
  verifiedAt?: string
  verifiedBy?: string
  rejectionReason?: string
  rejectionCode?: string
  submittedAt?: string
  expiresAt?: string
  attemptCount: number
  createdAt: string
  modifiedAt?: string
  documents: VerificationDocumentDto[]
}

export interface VerificationSummaryDto {
  id: string
  verificationType: string
  autoVerified: boolean
  fullName?: string
  status: string
  submittedAt?: string
  attemptCount: number
  createdAt: string
}

export interface PublicSellerItemDto {
  id: string
  title: string
  price: number
  status: string
  createdAt: string
}
