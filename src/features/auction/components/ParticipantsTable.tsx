import React from 'react'
import { Card, Space, Typography, Badge, Tag } from 'antd'
import { TeamOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuctionParticipants } from '../auctionApi'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { AuctionParticipantListItemDto } from '@/types'

const { Text } = Typography

interface Props {
  auctionId: string
  currency: string
}

export function ParticipantsTable({ auctionId, currency }: Props) {
  const { t } = useTranslation('auction')
  const { isMobile } = useBreakpoint()

  const [pageNumber, setPageNumber] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  const { data, isLoading } = useAuctionParticipants(auctionId, {
    pageNumber,
    pageSize,
  })

  const renderJoinStatus = (status: string) => {
    switch (status) {
      case 'joined':
        return <Tag color="blue">{t(`joinStatus.${status}`, 'Joined')}</Tag>
      case 'banned':
        return <Tag color="red">{t(`joinStatus.${status}`, 'Banned')}</Tag>
      case 'left':
        return <Tag color="default">{t(`joinStatus.${status}`, 'Left')}</Tag>
      default:
        return <Tag>{status}</Tag>
    }
  }

  const renderQualStatus = (status: string) => {
    switch (status) {
      case 'qualified':
        return <Tag color="success">{t(`qualStatus.${status}`, 'Qualified')}</Tag>
      case 'pending':
        return <Tag color="warning">{t(`qualStatus.${status}`, 'Pending')}</Tag>
      case 'rejected':
        return <Tag color="error">{t(`qualStatus.${status}`, 'Rejected')}</Tag>
      case 'not_required':
        return <Text type="secondary">-</Text>
      default:
        return <Tag>{status}</Tag>
    }
  }

  const columns = [
    {
      title: t('participant', 'Participant'),
      dataIndex: 'displayName',
      key: 'DisplayName',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: t('registeredAt', 'Registered At'),
      dataIndex: 'registeredAt',
      key: 'RegisteredAt',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('qualification', 'Qualification'),
      dataIndex: 'qualificationStatus',
      key: 'QualificationStatus',
      render: (status: string) => renderQualStatus(status),
    },
    {
      title: t('joinStatus', 'Status'),
      dataIndex: 'joinStatus',
      key: 'JoinStatus',
      render: (status: string) => renderJoinStatus(status),
    },
    {
      title: t('deposit', 'Deposit'),
      dataIndex: 'depositAmount',
      key: 'DepositAmount',
      render: (amount: number, record: AuctionParticipantListItemDto) => {
        if (!amount) return <Text type="secondary">-</Text>
        return formatCurrency(amount, record.depositCurrency || currency)
      },
    },
  ]

  return (
    <Card
      title={
        <Space>
          <TeamOutlined style={{ color: 'var(--color-accent)' }} />
          {t('participants', 'Participants')}
          <Badge
            count={data?.metadata.totalCount || 0}
            style={{ backgroundColor: 'var(--color-accent)' }}
          />
        </Space>
      }
      bordered={false}
      style={{ borderRadius: 20, boxShadow: 'var(--shadow-sm)' }}
    >
      <ResponsiveTable
        mobileMode="card"
        dataSource={data?.items}
        columns={columns}
        rowKey="userId"
        loading={isLoading}
        size={isMobile ? 'small' : 'middle'}
        pagination={{
          current: pageNumber,
          pageSize,
          total: data?.metadata.totalCount ?? 0,
          showSizeChanger: true,
          onChange: (page, size) => {
            setPageNumber(page)
            setPageSize(size)
          },
        }}
      />
    </Card>
  )
}
