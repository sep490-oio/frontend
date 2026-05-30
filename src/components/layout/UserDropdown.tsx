import { useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { Dropdown } from 'antd'
import { useTranslation } from 'react-i18next'
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  WalletOutlined,
  ShoppingOutlined,
  SafetyCertificateOutlined,
  DashboardOutlined,
  TagOutlined,
  CreditCardOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
  IdcardOutlined,
} from '@ant-design/icons'
import { useAuth } from '@/hooks/useAuth'
import { useAppSelector } from '@/app/store'

function getRolesFromToken(token: string | null): string[] {
  if (!token) return []
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const roles: string[] = Array.isArray(payload.role) ? payload.role : payload.role ? [payload.role] : []
    return roles.map((r) => r.toLowerCase())
  } catch {
    return []
  }
}

interface Props {
  children: React.ReactNode
  mode?: 'app' | 'portal'
}

export function UserDropdown({ children, mode = 'app' }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { logout: handleLogout } = useAuth()
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const roles = getRolesFromToken(accessToken)

  const userMenuItems = useMemo(() => {
    const items: any[] = []

    // Personal Account
    const personal = []
    if (mode === 'app') {
      personal.push({ key: 'dashboard', icon: <DashboardOutlined />, label: t('common:menu.home', 'Dashboard') })
    }
    personal.push({ key: 'profile', icon: <UserOutlined />, label: t('common:menu.profile', 'Profile') })
    items.push({ type: 'group', label: t('common:menu.group.personal', 'Personal Account'), children: personal })

    // Buyer specific links - clearly separated
    items.push({
      type: 'group',
      label: mode === 'portal' ? t('common:menu.group.buyer', 'Buyer Account') : t('common:menu.group.buying', 'Buying & Auctions'),
      children: [
        { key: 'auctions', icon: <TagOutlined />, label: t('common:menu.bids', 'My Bids & Wins') },
        { key: 'orders', icon: <ShoppingOutlined />, label: t('common:menu.myPurchases', 'My Purchases') },
      ]
    })

    items.push({
      type: 'group',
      label: t('common:menu.group.account', 'Account & Wallet'),
      children: [
        { key: 'wallet', icon: <WalletOutlined />, label: t('common:menu.wallet', 'Wallet') },
        { key: 'paymentMethods', icon: <CreditCardOutlined />, label: t('common:menu.paymentMethods', 'Payment Methods') },
        { key: 'shipments', icon: <InboxOutlined />, label: t('common:menu.myShipments', 'Shipments') },
        { key: 'disputes', icon: <ExclamationCircleOutlined />, label: t('common:menu.disputes', 'Disputes') },
      ]
    })

    items.push({
      type: 'group',
      label: t('common:menu.group.settings', 'Security & Settings'),
      children: [
        { key: 'verification', icon: <IdcardOutlined />, label: t('common:menu.verification', 'Verification') },
        { key: 'settings', icon: <SettingOutlined />, label: t('common:menu.settings', 'Settings') },
      ]
    })

    items.push({ type: 'divider' })

    // Portals
    const portals = []
    const isSellerPortal = location.pathname === '/seller' || location.pathname.startsWith('/seller/');
    if (roles.includes('seller') && !isSellerPortal) {
      portals.push({ key: 'portal_seller', icon: <ShoppingOutlined />, label: t('common:menu.seller', 'Seller Center') })
    }
    if (roles.includes('admin') && !location.pathname.startsWith('/admin')) {
      portals.push({ key: 'portal_admin', icon: <SettingOutlined />, label: t('common:menu.admin', 'Admin Panel') })
    }
    if ((roles.includes('inspector') || roles.includes('warehousemanager')) && !location.pathname.startsWith('/inspector')) {
      portals.push({ key: 'portal_inspector', icon: <SafetyCertificateOutlined />, label: t('common:menu.inspector', 'Inspector') })
    }
    if ((roles.includes('warehouse_staff') || roles.includes('warehousemanager') || roles.includes('admin')) && !location.pathname.startsWith('/warehouse-staff')) {
      portals.push({ key: 'portal_warehouse', icon: <ShoppingOutlined />, label: t('common:menu.warehouse', 'Warehouse') })
    }

    if (portals.length > 0) {
      items.push({ type: 'group', label: t('common:menu.group.portals', 'Portals'), children: portals })
      items.push({ type: 'divider' })
    }

    items.push({ key: 'logout', icon: <LogoutOutlined />, label: t('common:menu.logout', 'Sign Out'), danger: true })

    return items
  }, [roles, t, mode, location.pathname])

  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      // Portals
      case 'portal_seller': navigate('/seller'); break
      case 'portal_admin': navigate('/admin'); break
      case 'portal_inspector': navigate('/inspector'); break
      case 'portal_warehouse': navigate('/warehouse-staff'); break
      
      // User menus
      case 'dashboard': navigate('/me/dashboard'); break
      case 'profile': navigate('/me/profile'); break
      case 'auctions': navigate('/me/auctions'); break
      case 'orders': navigate('/me/orders'); break
      case 'shipments': navigate('/me/shipments'); break
      case 'wallet': navigate('/me/wallet'); break
      case 'paymentMethods': navigate('/me/payment-methods'); break
      case 'disputes': navigate('/me/disputes'); break
      case 'settings': navigate('/me/settings'); break
      case 'verification': navigate('/me/verification'); break
      case 'logout': handleLogout().then(() => navigate('/')); break
    }
  }

  return (
    <Dropdown
      menu={{ 
        items: userMenuItems, 
        onClick: handleUserMenuClick,
        style: { maxHeight: '80vh', overflowY: 'auto' }
      }}
      trigger={['click']}
      placement="bottomRight"
    >
      <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
        {children}
      </div>
    </Dropdown>
  )
}
