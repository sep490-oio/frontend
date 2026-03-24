import { Navigate, Outlet } from 'react-router'
import { Spin, Flex } from 'antd'
import { useAuth } from '@/hooks/useAuth'
import { useMySellerProfile } from '@/features/seller/api'

export function SellerGuard() {
  const { isAuthenticated } = useAuth()
  const { data: sellerProfile, isLoading, isError } = useMySellerProfile()

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

  return <Outlet />
}
