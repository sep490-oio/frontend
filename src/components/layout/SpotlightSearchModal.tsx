import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Modal, Input } from 'antd'
import { 
  SearchOutlined, 
  HistoryOutlined, 
  EnterOutlined, 
  AppstoreOutlined,
  UserOutlined,
  WalletOutlined,
  BookOutlined,
  HeartOutlined,
  ShoppingOutlined,
  CarOutlined,
  CommentOutlined,
  ShopOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CreditCardOutlined,
  InfoCircleOutlined,
  TagsOutlined,
  TeamOutlined,
  FileTextOutlined,
  DollarOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/app/store'
import { useBreakpoint } from '@/hooks/useBreakpoint'

export type RecentItemV2 = {
  id: string
  type: 'static' | 'dynamic'
  path: string
  title?: string
  desc?: string
}

export const addSpotlightRecent = (userId: string | null, item: RecentItemV2) => {
  try {
    const storageKey = `spotlight_recents_v2_${userId || 'guest'}`
    const existing = localStorage.getItem(storageKey)
    let recents: RecentItemV2[] = existing ? JSON.parse(existing) : []
    recents = [item, ...recents.filter(x => x.id !== item.id)].slice(0, 5)
    localStorage.setItem(storageKey, JSON.stringify(recents))
    window.dispatchEvent(new Event('spotlight-recents-updated'))
  } catch (e) {
    console.error(e)
  }
}

function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub || payload.id || null
  } catch {
    return null
  }
}

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

export const SpotlightSearchModal: React.FC = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()
  
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentsTick, setRecentsTick] = useState(0)
  
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const currentUserId = useMemo(() => getUserIdFromToken(accessToken), [accessToken])
  const roles = useMemo(() => getRolesFromToken(accessToken), [accessToken])

  const inputRef = useRef<any>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  interface SpotlightItem {
    id: string
    path: string
    icon: React.ReactNode
    title: string
    desc: string
    keywords: string[]
    auth: string[]
    isRecent?: boolean
  }

  const SPOTLIGHT_DATA: SpotlightItem[] = useMemo(() => [
    // --- PUBLIC ---
    {
      id: 'browse_auctions', path: '/auctions', icon: <SearchOutlined />,
      title: t('common:spotlight.title.browseAuctions', 'Browse Auctions'),
      desc: t('common:spotlight.desc.browseAuctions', 'Explore ongoing live auctions'),
      keywords: ['auctions', 'đấu giá', 'khám phá', 'browse'], auth: []
    },
    {
      id: 'browse_items', path: '/items', icon: <AppstoreOutlined />,
      title: t('common:spotlight.title.browseItems', 'Browse Items'),
      desc: t('common:spotlight.desc.browseItems', 'Discover available items for sale'),
      keywords: ['items', 'sản phẩm', 'hàng hóa'], auth: []
    },
    {
      id: 'browse_sellers', path: '/sellers', icon: <TeamOutlined />,
      title: t('common:spotlight.title.browseSellers', 'Browse Sellers'),
      desc: t('common:spotlight.desc.browseSellers', 'Find trusted sellers and stores'),
      keywords: ['sellers', 'người bán', 'store', 'cửa hàng'], auth: []
    },
    {
      id: 'about_us', path: '/about', icon: <InfoCircleOutlined />,
      title: t('common:spotlight.title.aboutUs', 'About Us'),
      desc: t('common:spotlight.desc.aboutUs', 'Learn more about OIO story'),
      keywords: ['about', 'giới thiệu', 'thông tin'], auth: []
    },
    {
      id: 'categories', path: '/categories', icon: <TagsOutlined />,
      title: t('common:spotlight.title.categories', 'Categories'),
      desc: t('common:spotlight.desc.categories', 'Explore item categories'),
      keywords: ['categories', 'danh mục', 'phân loại'], auth: []
    },

    // --- USER ---
    {
      id: 'dashboard', path: '/me/dashboard', icon: <AppstoreOutlined />,
      title: t('common:spotlight.title.dashboard', 'Dashboard'),
      desc: t('common:spotlight.desc.dashboard', 'Your activity overview'),
      keywords: ['dashboard', 'home', 'tổng quan', 'trang chủ'], auth: ['user']
    },
    {
      id: 'profile', path: '/me/profile', icon: <UserOutlined />,
      title: t('common:spotlight.title.profile', 'Profile'),
      desc: t('common:spotlight.desc.profile', 'Update your personal information'),
      keywords: ['profile', 'hồ sơ', 'thông tin', 'cá nhân', 'account', 'tài khoản'], auth: ['user']
    },
    {
      id: 'wallet', path: '/me/wallet', icon: <WalletOutlined />,
      title: t('common:spotlight.title.wallet', 'Wallet'),
      desc: t('common:spotlight.desc.wallet', 'Manage balance, deposit, withdraw'),
      keywords: ['wallet', 'ví', 'nạp tiền', 'rút tiền', 'deposit', 'withdraw', 'balance', 'số dư'], auth: ['user']
    },
    {
      id: 'payment_methods', path: '/me/payment-methods', icon: <CreditCardOutlined />,
      title: t('common:spotlight.title.paymentMethods', 'Payment Methods'),
      desc: t('common:spotlight.desc.paymentMethods', 'Manage credit cards and methods'),
      keywords: ['payment', 'thanh toán', 'card', 'thẻ', 'bank', 'ngân hàng'], auth: ['user']
    },
    {
      id: 'verification', path: '/me/verification', icon: <SafetyCertificateOutlined />,
      title: t('common:spotlight.title.verification', 'Identity Verification'),
      desc: t('common:spotlight.desc.verification', 'KYC identity verification'),
      keywords: ['kyc', 'xác minh', 'identity', 'định danh', 'cmnd'], auth: ['user']
    },
    {
      id: 'security', path: '/me/security', icon: <SettingOutlined />,
      title: t('common:spotlight.title.security', 'Account Security'),
      desc: t('common:spotlight.desc.security', 'Password and security settings'),
      keywords: ['security', 'bảo mật', 'password', 'mật khẩu', '2fa'], auth: ['user']
    },
    {
      id: 'bids', path: '/me/bids', icon: <BookOutlined />,
      title: t('common:spotlight.title.myBids', 'My Bids'),
      desc: t('common:spotlight.desc.myBids', 'Track your participating auctions'),
      keywords: ['bids', 'đấu giá', 'đặt giá', 'lịch sử', 'history'], auth: ['user']
    },
    {
      id: 'watchlist', path: '/me/watchlist', icon: <HeartOutlined />,
      title: t('common:spotlight.title.watchlist', 'Watchlist'),
      desc: t('common:spotlight.desc.watchlist', 'Items you are watching'),
      keywords: ['watchlist', 'theo dõi', 'yêu thích', 'favorite', 'heart', 'tim'], auth: ['user']
    },
    {
      id: 'orders', path: '/me/orders', icon: <ShoppingOutlined />,
      title: t('common:spotlight.title.myOrders', 'My Orders'),
      desc: t('common:spotlight.desc.myOrders', 'Track your purchase status'),
      keywords: ['orders', 'đơn hàng', 'mua hàng', 'purchase', 'shopping'], auth: ['user']
    },
    {
      id: 'shipments', path: '/me/shipments', icon: <CarOutlined />,
      title: t('common:spotlight.title.myShipments', 'My Shipments'),
      desc: t('common:spotlight.desc.myShipments', 'Track shipping and delivery'),
      keywords: ['shipments', 'vận chuyển', 'giao hàng', 'delivery', 'shipping', 'vận đơn'], auth: ['user']
    },
    {
      id: 'disputes', path: '/me/disputes', icon: <CommentOutlined />,
      title: t('common:spotlight.title.disputes', 'Disputes Center'),
      desc: t('common:spotlight.desc.disputes', 'Resolve issues and refunds'),
      keywords: ['disputes', 'tranh chấp', 'bồi hoàn', 'refund', 'khiếu nại', 'issue'], auth: ['user']
    },

    // --- SELLER ---
    {
      id: 'seller_dashboard', path: '/seller', icon: <ShopOutlined />,
      title: t('common:spotlight.title.sellerDashboard', 'Seller Center'),
      desc: t('common:spotlight.desc.sellerDashboard', 'Business activity analysis'),
      keywords: ['seller', 'người bán', 'center', 'dashboard', 'doanh thu'], auth: ['seller']
    },
    {
      id: 'seller_products', path: '/seller/items', icon: <AppstoreOutlined />,
      title: t('common:spotlight.title.sellerProducts', 'Manage Products'),
      desc: t('common:spotlight.desc.sellerProducts', 'Post and track products'),
      keywords: ['products', 'items', 'sản phẩm', 'quản lý', 'hàng hóa'], auth: ['seller']
    },
    {
      id: 'seller_auctions', path: '/seller/auctions', icon: <BookOutlined />,
      title: t('common:spotlight.title.sellerAuctions', 'Manage Auctions'),
      desc: t('common:spotlight.desc.sellerAuctions', 'Control store auctions'),
      keywords: ['auctions', 'phiên', 'đấu giá', 'tổ chức'], auth: ['seller']
    },
    {
      id: 'seller_wallet', path: '/seller/wallet', icon: <WalletOutlined />,
      title: t('common:spotlight.title.sellerWallet', 'Seller Revenue Wallet'),
      desc: t('common:spotlight.desc.sellerWallet', 'Withdraw revenue'),
      keywords: ['revenue', 'doanh thu', 'wallet', 'ví', 'rút tiền', 'payouts', 'finance'], auth: ['seller']
    },
    {
      id: 'seller_profile', path: '/seller/profile', icon: <UserOutlined />,
      title: t('common:spotlight.title.sellerProfile', 'Business Profile'),
      desc: t('common:spotlight.desc.sellerProfile', 'Update store information'),
      keywords: ['profile', 'cửa hàng', 'thông tin', 'gian hàng'], auth: ['seller']
    },

    // --- ADMIN ---
    {
      id: 'admin_dashboard', path: '/admin', icon: <SettingOutlined />,
      title: t('common:spotlight.title.adminDashboard', 'Platform Administration'),
      desc: t('common:spotlight.desc.adminDashboard', 'Overall system monitoring'),
      keywords: ['admin', 'quản trị', 'system', 'hệ thống', 'monitor'], auth: ['admin']
    },
    {
      id: 'admin_users', path: '/admin/users', icon: <TeamOutlined />,
      title: t('common:spotlight.title.adminUsers', 'Manage Users'),
      desc: t('common:spotlight.desc.adminUsers', 'Control access and ban users'),
      keywords: ['users', 'người dùng', 'ban', 'tài khoản'], auth: ['admin']
    },
    {
      id: 'admin_roles', path: '/admin/roles', icon: <SafetyCertificateOutlined />,
      title: t('common:spotlight.title.adminRoles', 'Manage Roles'),
      desc: t('common:spotlight.desc.adminRoles', 'Configure moderator permissions'),
      keywords: ['roles', 'quyền', 'permission', 'phân quyền'], auth: ['admin']
    },
    {
      id: 'admin_kyc', path: '/admin/verifications', icon: <SafetyCertificateOutlined />,
      title: t('common:spotlight.title.adminKyc', 'KYC/KYB Verification'),
      desc: t('common:spotlight.desc.adminKyc', 'User identity approval'),
      keywords: ['kyc', 'kyb', 'verify', 'xác minh', 'định danh', 'duyệt', 'approval'], auth: ['admin']
    },
    {
      id: 'admin_terms', path: '/admin/terms', icon: <FileTextOutlined />,
      title: t('common:spotlight.title.adminTerms', 'Terms & Policies'),
      desc: t('common:spotlight.desc.adminTerms', 'Review and update TOS'),
      keywords: ['terms', 'chính sách', 'điều khoản', 'policy', 'tos'], auth: ['admin']
    },
    {
      id: 'admin_auctions', path: '/admin/auctions', icon: <BookOutlined />,
      title: t('common:spotlight.title.adminAuctions', 'Manage Auctions'),
      desc: t('common:spotlight.desc.adminAuctions', 'Intervene in violation auctions'),
      keywords: ['auctions', 'phiên', 'đấu giá', 'violation', 'vi phạm'], auth: ['admin']
    },
    {
      id: 'admin_items', path: '/admin/items', icon: <AppstoreOutlined />,
      title: t('common:spotlight.title.adminItems', 'Manage Items'),
      desc: t('common:spotlight.desc.adminItems', 'Control flagged items'),
      keywords: ['items', 'sản phẩm', 'kiểm duyệt', 'flagged'], auth: ['admin']
    },
    {
      id: 'admin_disputes', path: '/admin/disputes', icon: <CommentOutlined />,
      title: t('common:spotlight.title.adminDisputes', 'Resolve Disputes'),
      desc: t('common:spotlight.desc.adminDisputes', 'Handle escalated complaints'),
      keywords: ['disputes', 'tranh chấp', 'khiếu nại', 'escalated', 'cấp cao'], auth: ['admin']
    },
    {
      id: 'admin_payments', path: '/admin/payments', icon: <DollarOutlined />,
      title: t('common:spotlight.title.adminPayments', 'Platform Transactions'),
      desc: t('common:spotlight.desc.adminPayments', 'Monitor transaction flows'),
      keywords: ['payments', 'giao dịch', 'tiền', 'finance', 'dòng tiền', 'transaction'], auth: ['admin']
    },

    // --- INSPECTOR ---
    {
      id: 'inspector_dashboard', path: '/inspector', icon: <SearchOutlined />,
      title: t('common:spotlight.title.inspectorDashboard', 'Inspector Dashboard'),
      desc: t('common:spotlight.desc.inspectorDashboard', 'Quality inspection central'),
      keywords: ['inspector', 'kiểm định', 'chuyên gia', 'quality', 'chất lượng'], auth: ['inspector', 'warehousemanager']
    },

    // --- WAREHOUSE ---
    {
      id: 'warehouse_dashboard', path: '/warehouse-staff', icon: <AppstoreOutlined />,
      title: t('common:spotlight.title.warehouseDashboard', 'Warehouse Dashboard'),
      desc: t('common:spotlight.desc.warehouseDashboard', 'Inbound and outbound logistics'),
      keywords: ['warehouse', 'kho vận', 'logistics', 'kho', 'vận chuyển'], auth: ['warehouse_staff', 'warehousemanager', 'admin']
    }
  ], [i18n.language, t])

  const results = useMemo(() => {
    // 1. RBAC Filter
    let items = SPOTLIGHT_DATA.filter(item => {
      // If user has no roles, they can only see things without auth required
      if (!currentUserId && item.auth && item.auth.length > 0) return false
      // If item requires specific auth
      if (item.auth && item.auth.length > 0) {
        if (!accessToken) return false
        // Add basic generic 'user' role implicitly for logged in users
        const effectiveRoles = [...roles, 'user']
        const hasRole = item.auth.some(r => effectiveRoles.includes(r.toLowerCase()))
        if (!hasRole) return false
      }
      return true
    })

    let resultRecents: SpotlightItem[] = []
    try {
      const recentStorage = localStorage.getItem(`spotlight_recents_v2_${currentUserId || 'guest'}`)
      if (recentStorage) {
        const recentData = JSON.parse(recentStorage) as RecentItemV2[]
        
        const dynamicRecents = recentData.map(r => {
           if (r.type === 'static') {
              const found = items.find(i => i.id === r.id)
              return found ? { ...found, isRecent: true } : null
           } else {
              return {
                 id: r.id,
                 path: r.path,
                 title: r.title || 'Dynamic Item',
                 desc: r.desc || '',
                 icon: <HistoryOutlined />,
                 keywords: [],
                 auth: [],
                 isRecent: true
              }
           }
        }).filter(Boolean) as SpotlightItem[]
        
        if (dynamicRecents.length > 0) {
          resultRecents = dynamicRecents
        }
      }
    } catch (e) {
      console.error(e)
    }

    if (!query) {
      if (!currentUserId && resultRecents.length === 0) return items // Fallback fully 

      // Append all other available static items that are not in recents
      const recentIds = resultRecents.map(r => r.id)
      const others = items.filter(i => !recentIds.includes(i.id))
      return [...resultRecents, ...others]
    }

    const safeQuery = query.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(safeQuery, 'i')

    // Combine static items and purely dynamic items for search
    const purelyDynamicRecents = resultRecents.filter(r => !items.some(i => i.id === r.id))
    const searchableItems = [...purelyDynamicRecents, ...items]

    return searchableItems.filter(item => {
      return regex.test(item.title) || 
             regex.test(item.desc) || 
             regex.test(item.path) ||
             item.keywords.some(k => regex.test(k))
    })
  }, [query, SPOTLIGHT_DATA, roles, currentUserId, isOpen, accessToken, recentsTick])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query, results])

  useEffect(() => {
    const handleRecentsUpdated = () => {
      setRecentsTick(t => t + 1)
    }
    window.addEventListener('spotlight-recents-updated', handleRecentsUpdated)
    return () => {
      window.removeEventListener('spotlight-recents-updated', handleRecentsUpdated)
    }
  }, [])

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true)
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && e.ctrlKey) {
        // Prevent opening if user is typing in form exactly
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA' ||
          (document.activeElement as HTMLElement)?.isContentEditable
        ) {
          return
        }
        e.preventDefault()
        handleOpen()
      }
    }

    window.addEventListener('open-spotlight', handleOpen)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('open-spotlight', handleOpen)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const addRecent = (id: string, path: string) => {
    addSpotlightRecent(currentUserId, { id, type: 'static', path })
  }

  const handleNavigate = (path: string, id: string) => {
    // If it's a dynamic id, it might already be saved when visited
    // But we still track clicks
    if (id.startsWith('auction-')) {
       // Find the item to save its title & desc
       const found = results.find(r => r.id === id)
       addSpotlightRecent(currentUserId, { id, type: 'dynamic', path, title: found?.title, desc: found?.desc })
    } else {
       addRecent(id, path)
    }
    navigate(path)
    setIsOpen(false)
  }

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => {
        const next = Math.min(prev + 1, results.length - 1)
        itemRefs.current[next]?.scrollIntoView({ block: 'nearest' })
        return next
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => {
        const next = Math.max(prev - 1, 0)
        itemRefs.current[next]?.scrollIntoView({ block: 'nearest' })
        return next
      })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        handleNavigate(results[selectedIndex].path, results[selectedIndex].id)
      }
    }
  }

  const highlightMatch = (text: string, highlight: string) => {
    if (!highlight) return text
    const safeQuery = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${safeQuery})`, 'gi')
    return Math.abs(text.search(regex)) !== -1 ? (
      text.split(regex).map((part, i) => 
        regex.test(part) ? <span key={i} style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{part}</span> : part
      )
    ) : text
  }

  return (
    <Modal
      open={isOpen}
      onCancel={() => setIsOpen(false)}
      closable={false}
      footer={null}
      width={600}
      className="spotlight-modal"
      maskStyle={{ backdropFilter: 'blur(4px)', background: 'rgba(0, 0, 0, 0.45)' }}
      styles={{
        content: { padding: 0, borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-xl)' },
        body: { padding: 0, overflow: 'hidden' }
      }}
      destroyOnClose
    >
      <div style={{ display: 'flex', flexDirection: 'column' }} onKeyDown={handleModalKeyDown}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center' }}>
          <SearchOutlined style={{ fontSize: 20, color: 'var(--color-text-secondary)', marginRight: 12 }} />
          <Input 
            ref={inputRef}
            variant="borderless"
            placeholder={t('common:spotlight.placeholder', 'What are you looking for? (Ctrl + Space)...')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ fontSize: 18, padding: 0 }}
            autoFocus
          />
        </div>

        <div ref={listRef} style={{ maxHeight: '60vh', overflowY: 'auto' }} className="hide-scrollbar">
          {query && results.length > 0 && (
            <div style={{ padding: '12px 20px 4px', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('common:spotlight.navigation', 'Navigation')}
            </div>
          )}

          {results.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              {t('common:spotlight.noResult', 'No matching results found')}
            </div>
          ) : (
            <div style={{ padding: '8px' }}>
              {results.map((item, index) => {
                const isActive = index === selectedIndex
                const isFirstRecent = !query && item.isRecent && index === 0
                const isFirstNonRecent = !query && !item.isRecent && (index === 0 || results[index - 1].isRecent)
                
                return (
                  <React.Fragment key={item.id}>
                    {isFirstRecent && (
                      <div style={{ padding: '4px 12px 8px', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {t('common:spotlight.recent', 'Recent')}
                      </div>
                    )}
                    {isFirstNonRecent && (
                      <div style={{ padding: index === 0 ? '4px 12px 8px' : '16px 12px 8px', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {t('common:spotlight.navigation', 'Navigation')}
                      </div>
                    )}
                    <div
                      ref={el => { itemRefs.current[index] = el }}
                      onClick={() => handleNavigate(item.path, item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: isMobile ? '12px 20px' : '12px 16px',
                      cursor: 'pointer',
                      borderRadius: 8,
                      background: isActive ? 'var(--color-accent-light)' : 'transparent',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div style={{ 
                      width: 32, 
                      height: 32, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      background: item.isRecent ? 'var(--color-accent)' : 'var(--color-bg-surface)',
                      color: item.isRecent ? '#fff' : 'var(--color-text-primary)',
                      borderRadius: 6,
                      fontSize: 16,
                      marginRight: 16
                    }}>
                      {item.isRecent ? <HistoryOutlined /> : item.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: 15, 
                        fontWeight: item.isRecent ? 600 : 500, 
                        color: isActive && !item.isRecent ? 'var(--color-accent)' : 'var(--color-text-primary)', 
                        marginBottom: 2 
                      }}>
                        {highlightMatch(item.title, query)}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {highlightMatch(item.desc, query)}
                        <span style={{ margin: '0 8px', opacity: 0.5 }}>•</span>
                        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{item.path}</span>
                      </div>
                    </div>
                  </div>
                  </React.Fragment>
                )
              })}
            </div>
          )}
        </div>
        
        {!isMobile && (
          <div style={{ 
            padding: '12px 20px', 
            borderTop: '1px solid var(--color-border)', 
            display: 'flex', 
            alignItems: 'center', 
            background: 'var(--color-bg-surface)', 
            fontSize: 12, 
            color: 'var(--color-text-secondary)',
            gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ background: 'var(--color-bg-card)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--color-border)' }}><ArrowUpOutlined /> <ArrowDownOutlined /></span>
              <span>{t('common:spotlight.instructionNavigate', 'to nav')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ background: 'var(--color-bg-card)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--color-border)' }}><EnterOutlined /></span>
              <span>{t('common:spotlight.instructionEnter', 'to open')}</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
