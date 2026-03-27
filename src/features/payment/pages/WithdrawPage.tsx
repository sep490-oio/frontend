import { useState } from 'react'
import {
  Typography,
  Card,
  Button,
  Space,
  Form,
  Input,
  InputNumber,
  Statistic,
  Popconfirm,
  App,
} from 'antd'
import { ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons'
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

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`${prefix}/wallet`)}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        {t('withdraw', 'Withdraw')}
      </Typography.Title>

      {/* Balance display */}
      <Card style={{ marginBottom: 24 }}>
        <Statistic
          title={t('availableBalance', 'Available Balance')}
          value={wallet?.availableBalance ?? 0}
          formatter={(val) => formatCurrency(val as number, wallet?.currency)}
          valueStyle={{ color: '#3f8600' }}
        />
      </Card>

      {/* Withdraw form */}
      <Card title={t('withdrawForm', 'Withdrawal Request')} style={{ marginBottom: 24, maxWidth: 600 }}>
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item
            label={t('amount', 'Amount')}
            validateStatus={errors.amount ? 'error' : undefined}
            help={errors.amount?.message}
            required
          >
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <InputNumber
                  {...field}
                  style={{ width: '100%' }}
                  min={1}
                  max={wallet?.availableBalance ?? 0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => Number(value?.replace(/,/g, '') ?? 0)}
                  addonAfter="VND"
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label={t('bankName', 'Bank Name')}
            validateStatus={errors.bankName ? 'error' : undefined}
            help={errors.bankName?.message}
            required
          >
            <Controller
              name="bankName"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder={t('bankNamePlaceholder', 'e.g. Vietcombank, Techcombank')} />
              )}
            />
          </Form.Item>

          <Form.Item
            label={t('accountNumber', 'Account Number')}
            validateStatus={errors.accountNumber ? 'error' : undefined}
            help={errors.accountNumber?.message}
            required
          >
            <Controller
              name="accountNumber"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder={t('accountNumberPlaceholder', 'Enter your bank account number')} />
              )}
            />
          </Form.Item>

          <Form.Item
            label={t('accountHolder', 'Account Holder')}
            validateStatus={errors.accountHolder ? 'error' : undefined}
            help={errors.accountHolder?.message}
            required
          >
            <Controller
              name="accountHolder"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder={t('accountHolderPlaceholder', 'Full name on bank account')} />
              )}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createWithdrawal.isPending}>
              {tc('action.submit', 'Submit')}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Recent withdrawals */}
      <Card title={t('recentWithdrawals', 'Recent Withdrawals')}>
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
            showTotal: (total) => tc('pagination.total', { total }),
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
        />
      </Card>
    </div>
  )
}
