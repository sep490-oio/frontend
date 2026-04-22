import { Navigate, Outlet, useLocation } from 'react-router'
import { Spin, Flex } from 'antd'
import { useAuth } from '@/hooks/useAuth'
import { useMySellerProfile } from '@/features/seller/api'
import { SellerProfileStatus } from '@/types/enums'

export function SellerGuard() {
  const { isAuthenticated } = useAuth()
  const { data: sellerProfile, isLoading, isError } = useMySellerProfile()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 400 }}>
        <Spin size="large" />
      </Flex>
    )
  }

  // No seller profile or fetch error → redirect to register
  if (isError || !sellerProfile) {
    return <Navigate to="/seller/register" replace />
  }

  // If seller profile is not verified, only allow access to the verification and profile pages
  if (
    sellerProfile.status !== SellerProfileStatus.Verified &&
    location.pathname !== '/seller/verification' &&
    location.pathname !== '/seller/profile'
  ) {
    return <Navigate to="/seller/verification" replace />
  }

  return <Outlet />
}
