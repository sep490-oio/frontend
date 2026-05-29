import { Button, Popconfirm, Flex, Tooltip } from 'antd'
import {
  EditOutlined,
  SendOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  StopOutlined,
  TruckOutlined,
  UserSwitchOutlined,
  ReloadOutlined,
  CloseCircleOutlined,
  PlusSquareOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { getSellerActions, isSubmitDisabled, type SellerAction } from '@/features/auction/utils/sellerActions'

interface SellerActionBarProps {
  status: string
  verifyByPlatform?: boolean
  itemStatus?: string
  hasOrder?: boolean
  isMobile?: boolean
  // Action handlers
  onEdit?: () => void
  onSubmit?: () => void
  onSetTiming?: () => void
  onViewDetail?: () => void
  onCancel?: () => void
  onConfigureShipping?: () => void
  onOfferRunnerUp?: () => void
  onRelist?: () => void
  onClose?: () => void
  onProvisionOrder?: () => void
  canOfferRunnerUp?: boolean
  // Loading states
  isSubmitLoading?: boolean
  isCancelLoading?: boolean
  isOfferRunnerUpLoading?: boolean
  isRelistLoading?: boolean
  isCloseLoading?: boolean
  isProvisionOrderLoading?: boolean
}

const actionConfig: Record<SellerAction, {
  icon: React.ReactNode
  labelKey: string
  labelFallback: string
  type?: 'primary' | 'default' | 'dashed'
  danger?: boolean
}> = {
  edit: { icon: <EditOutlined />, labelKey: 'editAuction', labelFallback: 'Edit', type: 'default' },
  submit: { icon: <SendOutlined />, labelKey: 'submitAuction', labelFallback: 'Submit', type: 'primary' },
  setTiming: { icon: <ClockCircleOutlined />, labelKey: 'setTiming', labelFallback: 'Set Timing', type: 'primary' },
  viewDetail: { icon: <EyeOutlined />, labelKey: 'viewDetail', labelFallback: 'View Detail', type: 'default' },
  cancel: { icon: <StopOutlined />, labelKey: 'cancelAuction', labelFallback: 'Cancel', danger: true },
  configureShipping: { icon: <TruckOutlined />, labelKey: 'configureShipping', labelFallback: 'Shipping', type: 'default' },
  offerRunnerUp: { icon: <UserSwitchOutlined />, labelKey: 'offerRunnerUp', labelFallback: 'Offer Runner-Up', type: 'default' },
  relist: { icon: <ReloadOutlined />, labelKey: 'relistAuction', labelFallback: 'Relist', type: 'primary' },
  close: { icon: <CloseCircleOutlined />, labelKey: 'closeAuction', labelFallback: 'Close', danger: true },
  provisionOrder: { icon: <PlusSquareOutlined />, labelKey: 'provisionOrder', labelFallback: 'Create Order', type: 'primary' },
}

export function SellerActionBar({
  status,
  verifyByPlatform,
  itemStatus,
  hasOrder,
  isMobile,
  onEdit,
  onSubmit,
  onSetTiming,
  onViewDetail,
  onCancel,
  onConfigureShipping,
  onOfferRunnerUp,
  onRelist,
  onClose,
  onProvisionOrder,
  canOfferRunnerUp,
  isSubmitLoading,
  isCancelLoading,
  isOfferRunnerUpLoading,
  isRelistLoading,
  isCloseLoading,
  isProvisionOrderLoading,
}: SellerActionBarProps) {
  const { t } = useTranslation('auction')

  const actions = getSellerActions({ status, verifyByPlatform, canOfferRunnerUp, itemStatus, hasOrder })
  if (actions.length === 0) return null

  const handlers: Record<SellerAction, (() => void) | undefined> = {
    edit: onEdit,
    submit: onSubmit,
    setTiming: onSetTiming,
    viewDetail: onViewDetail,
    cancel: onCancel,
    configureShipping: onConfigureShipping,
    offerRunnerUp: onOfferRunnerUp,
    relist: onRelist,
    close: onClose,
    provisionOrder: onProvisionOrder,
  }

  const loadingMap: Partial<Record<SellerAction, boolean>> = {
    submit: isSubmitLoading,
    cancel: isCancelLoading,
    offerRunnerUp: isOfferRunnerUpLoading,
    relist: isRelistLoading,
    close: isCloseLoading,
    provisionOrder: isProvisionOrderLoading,
  }

  const submitDisabled = isSubmitDisabled(itemStatus)

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 8,
        background: 'rgba(196, 147, 61, 0.08)',
        border: '1px solid rgba(196, 147, 61, 0.2)',
        marginBottom: 16,
      }}
    >
      <Flex wrap="wrap" gap={8} justify={isMobile ? 'center' : 'flex-start'}>
        {actions.map((action) => {
          const config = actionConfig[action]
          const handler = handlers[action]
          const loading = loadingMap[action] ?? false
          const disabled = action === 'submit' && submitDisabled

          if (!handler) return null

          if (action === 'cancel') {
            return null // Cancel is handled separately via modal — caller renders it
          }

          if (action === 'offerRunnerUp') {
            return (
              <Popconfirm
                key={action}
                title={t('offerRunnerUpConfirm', 'Offer to the next highest bidder?')}
                onConfirm={handler}
                okText={t('confirm', 'Confirm')}
                cancelText={t('cancel', 'Cancel')}
              >
                <Button
                  icon={config.icon}
                  loading={loading}
                  size="middle"
                >
                  {t(config.labelKey, config.labelFallback)}
                </Button>
              </Popconfirm>
            )
          }

          if (action === 'close') {
            return (
              <Popconfirm
                key={action}
                title={t('closeAuctionConfirm', 'Are you sure you want to close this auction? This will end the auction process.')}
                onConfirm={handler}
                okText={t('confirm', 'Confirm')}
                cancelText={t('cancel', 'Cancel')}
                okButtonProps={{ danger: true }}
              >
                <Button
                  danger
                  icon={config.icon}
                  loading={loading}
                  size="middle"
                >
                  {t(config.labelKey, config.labelFallback)}
                </Button>
              </Popconfirm>
            )
          }

          return (
            <Tooltip
              key={action}
              title={disabled ? t('itemMustBeApproved', 'Item must be approved first') : undefined}
            >
              <Button
                type={config.type as any}
                danger={config.danger}
                icon={config.icon}
                onClick={handler}
                loading={loading}
                disabled={disabled}
                size="middle"
                style={config.type === 'primary' && !config.danger ? {
                  background: 'var(--color-accent)',
                  borderColor: 'var(--color-accent)',
                } : undefined}
              >
                {t(config.labelKey, config.labelFallback)}
              </Button>
            </Tooltip>
          )
        })}

        {actions.includes('cancel') && handlers.cancel && (
          <Button
            danger
            icon={<StopOutlined />}
            onClick={handlers.cancel}
            loading={isCancelLoading}
          >
            {t('cancelAuction', 'Cancel')}
          </Button>
        )}
      </Flex>
    </div>
  )
}
