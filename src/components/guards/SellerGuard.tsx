import { Navigate, Outlet, useLocation } from 'react-router'
import { Spin, Flex, Result, Button } from 'antd'
import { useAuth } from '@/hooks/useAuth'
import { useMySellerProfile } from '@/features/seller/api'
import { SellerProfileStatus } from '@/types/enums'
import { buildLoginRedirect } from '@/utils/returnTo'
import type { AxiosError } from 'axios'

export function SellerGuard() {
  const { isAuthenticated } = useAuth()
  const { data: sellerProfile, isLoading, isError, error } = useMySellerProfile()
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate
        to={buildLoginRedirect(location.pathname, location.search, location.hash)}
        replace
      />
    )
  }

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 400 }}>
        <Spin size="large" />
      </Flex>
    )
  }

  // Distinguish "profile not found" (404) from transient errors (401/500/network).
  // Only redirect to register when the API confirms no seller profile exists.
  if (isError) {
    const status = (error as AxiosError)?.response?.status
    if (status === 404 || status === 403) {
      return <Navigate to="/seller/register" replace />
    }
    // For 401, 500, network errors — show a recoverable error instead of
    // trapping the user in a /seller/register redirect loop.
    return (
      <Flex align="center" justify="center" style={{ minHeight: 400 }}>
        <Result
          status="error"
          title="Unable to load seller profile"
          subTitle="Please check your connection and try again."
          extra={<Button onClick={() => window.location.reload()}>Retry</Button>}
        />
      </Flex>
    )
  }

  if (!sellerProfile) {
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
