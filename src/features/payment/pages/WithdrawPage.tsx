import { useState } from 'react'
import {
  Typography,
  Card,
  Button,
  Space,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  App,
} from 'antd'
const { Text } = Typography
import { ArrowLeftOutlined, DeleteOutlined, BankOutlined } from '@ant-design/icons'
import { MONO_FONT } from '@/styles/tokens'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useNavigate } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useWallet, useMyWithdrawals, useCreateWithdrawal, useCancelWithdrawal } from '@/features/payment/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { WithdrawalStatus } from '@/types/enums'
import { formatDateTime, formatCurrency } from '@/utils/format'
import type { WithdrawalRequestDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const withdrawSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  accountHolder: z.string().min(1, 'Account holder is required'),
})

type WithdrawFormData = z.infer<typeof withdrawSchema>

export default function WithdrawPage() {
  const { t } = useTranslation('payment')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const { message } = App.useApp()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data: wallet } = useWallet()
  const { data: withdrawals, isLoading: wdLoading } = useMyWithdrawals({
    pageNumber: page,
    pageSize,
  })
  const createWithdrawal = useCreateWithdrawal()
  const cancelWithdrawal = useCancelWithdrawal()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WithdrawFormData>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      amount: 0,
      bankName: '',
      accountNumber: '',
      accountHolder: '',
    },
  })

  const onSubmit = (data: WithdrawFormData) => {
    if (data.amount > (wallet?.availableBalance ?? 0)) {
      message.error(t('insufficientBalance', 'Withdrawal amount exceeds available balance'))
      return
    }
    createWithdrawal.mutate(data, {
      onSuccess: () => {
        message.success(t('withdrawalCreated', 'Withdrawal request submitted'))
        reset()
      },
      onError: () => {
        message.error(t('withdrawalError', 'Failed to submit withdrawal request'))
      },
    })
  }

  const handleCancel = (id: string) => {
    cancelWithdrawal.mutate(id, {
      onSuccess: () => message.success(t('withdrawalCancelled', 'Withdrawal cancelled')),
      onError: () => message.error(t('withdrawalCancelError', 'Failed to cancel withdrawal')),
    })
  }

  const columns: ColumnsType<WithdrawalRequestDto> = [
    {
      title: t('wdAmount', 'Amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: t('wdStatus', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('wdBank', 'Bank'),
      dataIndex: 'bankName',
      key: 'bankName',
      width: 120,
      render: (bankName: string | undefined) => bankName ?? '-',
    },
    {
      title: t('wdAccount', 'Account'),
      dataIndex: 'accountNumberMasked',
      key: 'accountNumberMasked',
      render: (accountNumberMasked: string | undefined) => accountNumberMasked ?? '-',
    },
    {
      title: t('wdDate', 'Date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: tc('action.view', 'Actions'),
      key: 'actions',
      width: 100,
      render: (_: unknown, record: WithdrawalRequestDto) => {
        if (record.status === WithdrawalStatus.Pending) {
          return (
            <Popconfirm
              title={t('confirmCancelWithdrawal', 'Cancel this withdrawal?')}
              onConfirm={() => handleCancel(record.id)}
              okText={tc('action.confirm', 'Confirm')}
              cancelText={tc('action.cancel', 'Cancel')}
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />}>
                {tc('action.cancel', 'Cancel')}
              </Button>
            </Popconfirm>
          )
        }
        return null
      },
    },
  ]

  const { isMobile } = useBreakpoint()

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '24px 16px 80px' : '32px 24px 80px' }}>
      <Space style={{ marginBottom: 24 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(`${prefix}/wallet`)}
          style={{ borderRadius: 10, fontWeight: 600 }}
        >
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <div style={{ marginBottom: isMobile ? 24 : 40 }}>
        <h1
          className="oio-serif"
          style={{
            fontWeight: 400,
            fontSize: isMobile ? 28 : 36,
            color: 'var(--color-text-primary)',
            marginBottom: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <BankOutlined style={{ fontSize: isMobile ? 24 : 28, color: 'var(--color-accent)' }} />
          {t('withdraw', 'Withdraw Funds')}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 16, margin: 0 }}>
          {t('withdrawSubtitle', 'Request a withdrawal to your bank account')}
        </p>
      </div>

      {/* Balance display */}
      <Card 
        style={{ 
          marginBottom: 32,
          background: 'var(--color-bg-container)',
          backdropFilter: 'var(--oio-blur)',
          WebkitBackdropFilter: 'var(--oio-blur)',
          border: '1px solid var(--color-border)',
          borderRadius: 24,
          boxShadow: 'var(--shadow-sm)',
          maxWidth: 400
        }}
        styles={{ body: { padding: 24 } }}
      >
        <Text style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
          {t('availableBalance', 'Available Balance')}
        </Text>
        <div style={{ fontFamily: MONO_FONT, fontSize: isMobile ? 24 : 30, fontWeight: 700, color: 'var(--color-success)', marginTop: 4 }}>
           {wallet ? formatCurrency(wallet.availableBalance, wallet.currency) : '--'}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 32, alignItems: 'start' }}>
        {/* Withdraw form */}
        <Card 
          title={<span className="oio-serif" style={{ fontWeight: 400, fontSize: 20 }}>{t('withdrawForm', 'Withdrawal Request')}</span>}
          style={{ 
            background: 'var(--color-bg-container)',
            backdropFilter: 'var(--oio-blur)',
            WebkitBackdropFilter: 'var(--oio-blur)',
            border: '1px solid var(--color-border)',
            borderRadius: 24,
            boxShadow: 'var(--shadow-sm)',
          }}
          styles={{ 
            header: { borderBottom: '1px solid var(--color-border)', padding: '16px 24px' },
            body: { padding: 24 }
          }}
        >
          <Form layout="vertical" onFinish={handleSubmit(onSubmit)} requiredMark="optional">
            <Form.Item
              label={<span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>{t('amount', 'Amount')}</span>}
              validateStatus={errors.amount ? 'error' : undefined}
              help={errors.amount?.message}
            >
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    style={{ width: '100%', height: 48, borderRadius: 12, display: 'flex', alignItems: 'center' }}
                    size="large"
                    min={1}
                    max={wallet?.availableBalance ?? 0}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => {
                      const parsed = (value ?? '').replace(/\$\s?|(,*)/g, '')
                      return parsed ? Number(parsed) : null as any
                    }}
                    addonAfter={wallet?.currency ?? 'VND'}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>{t('bankName', 'Bank Name')}</span>}
              validateStatus={errors.bankName ? 'error' : undefined}
              help={errors.bankName?.message}
            >
              <Controller
                name="bankName"
                control={control}
                render={({ field }) => (
                  <Input 
                    {...field} 
                    placeholder={t('bankNamePlaceholder', 'e.g. Vietcombank, Techcombank')} 
                    style={{ height: 48, borderRadius: 12 }}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>{t('accountNumber', 'Account Number')}</span>}
              validateStatus={errors.accountNumber ? 'error' : undefined}
              help={errors.accountNumber?.message}
            >
              <Controller
                name="accountNumber"
                control={control}
                render={({ field }) => (
                  <Input 
                    {...field} 
                    placeholder={t('accountNumberPlaceholder', 'Enter your bank account number')} 
                    style={{ height: 48, borderRadius: 12, fontFamily: MONO_FONT }}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>{t('accountHolder', 'Account Holder')}</span>}
              validateStatus={errors.accountHolder ? 'error' : undefined}
              help={errors.accountHolder?.message}
            >
              <Controller
                name="accountHolder"
                control={control}
                render={({ field }) => (
                  <Input 
                    {...field} 
                    placeholder={t('accountHolderPlaceholder', 'Full name on bank account')} 
                    style={{ height: 48, borderRadius: 12, textTransform: 'uppercase' }}
                  />
                )}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={createWithdrawal.isPending}
                size="large"
                block
                style={{ height: 52, borderRadius: 12, fontWeight: 700, background: 'var(--color-accent)', border: 'none' }}
              >
                {tc('action.submit', 'Submit Request')}
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Recent withdrawals */}
        <Card 
          title={<span className="oio-serif" style={{ fontWeight: 400, fontSize: 20 }}>{t('recentWithdrawals', 'Recent Withdrawals')}</span>}
          style={{ 
            background: 'var(--color-bg-container)',
            backdropFilter: 'var(--oio-blur)',
            WebkitBackdropFilter: 'var(--oio-blur)',
            border: '1px solid var(--color-border)',
            borderRadius: 24,
            boxShadow: 'var(--shadow-sm)',
          }}
          styles={{ 
            header: { borderBottom: '1px solid var(--color-border)', padding: '16px 24px' },
            body: { padding: 0 }
          }}
        >
          <ResponsiveTable<WithdrawalRequestDto>
            mobileMode="list"
            rowKey="id"
            columns={columns}
            dataSource={withdrawals?.items ?? []}
            loading={wdLoading}
            pagination={{
              current: withdrawals?.metadata?.currentPage ?? page,
              pageSize: withdrawals?.metadata?.pageSize ?? pageSize,
              total: withdrawals?.metadata?.totalCount ?? 0,
              showSizeChanger: true,
              showTotal: isMobile ? undefined : (total) => tc('pagination.total', { total }),
              size: 'small',
              onChange: (p, ps) => {
                setPage(p)
                setPageSize(ps)
              },
            }}
          />
        </Card>
      </div>
    </div>
  )
}
