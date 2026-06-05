import React from 'react'
import { Drawer, Timeline, Typography, Tag, Space, Button, Image, Descriptions, Divider } from 'antd'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, BankOutlined, CopyOutlined } from '@ant-design/icons'
import type { AdminWithdrawalDto } from '@/types'
import { WithdrawalStatus } from '@/types/enums'

const { Text, Title } = Typography

interface WithdrawalDetailDrawerProps {
  open: boolean
  onClose: () => void
  withdrawal: AdminWithdrawalDto | null
}

export const WithdrawalDetailDrawer: React.FC<WithdrawalDetailDrawerProps> = ({ open, onClose, withdrawal }) => {
  const { t } = useTranslation('admin')

  if (!withdrawal) return null

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Drawer
      title={t('payments.withdrawalDetails', 'Withdrawal Details & Audit')}
      placement="right"
      width={480}
      onClose={onClose}
      open={open}
    >
      <div className="flex flex-col gap-6">
        {/* Header Summary */}
        <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between border border-gray-100">
          <div>
            <Text type="secondary" className="block mb-1">{t('payments.amount', 'Amount')}</Text>
            <Title level={3} className="!mb-0 !mt-0 text-blue-600">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(withdrawal.amount)}
            </Title>
          </div>
          <div>
            {withdrawal.status === WithdrawalStatus.Pending && <Tag icon={<ClockCircleOutlined />} color="warning">{t('payments.withdrawalStatus.pending', 'Pending')}</Tag>}
            {withdrawal.status === WithdrawalStatus.Completed && <Tag icon={<CheckCircleOutlined />} color="success">{t('payments.withdrawalStatus.completed', 'Completed')}</Tag>}
            {withdrawal.status === WithdrawalStatus.Rejected && <Tag icon={<CloseCircleOutlined />} color="error">{t('payments.withdrawalStatus.rejected', 'Rejected')}</Tag>}
          </div>
        </div>

        {/* Audit Timeline */}
        <div>
          <Title level={5} className="!mb-4">{t('payments.auditTimeline', 'Audit Timeline')}</Title>
          <Timeline
            items={[
              {
                color: 'blue',
                dot: <ClockCircleOutlined className="text-base" />,
                children: (
                  <div className="flex flex-col">
                    <Text strong>{t('payments.withdrawalTimeline.requested', 'Withdrawal Requested')}</Text>
                    <Text type="secondary" className="text-xs">{dayjs(withdrawal.createdAt).format('DD MMM YYYY, HH:mm')}</Text>
                    <Text className="text-sm mt-1">
                      {t('payments.withdrawalTimeline.byUser', 'By User')}: <Text strong>{withdrawal.userDisplayName || t('payments.withdrawalTimeline.unknown', 'Unknown')}</Text>
                    </Text>
                  </div>
                ),
              },
              ...(withdrawal.status === WithdrawalStatus.Completed
                ? [
                    {
                      color: 'green',
                      dot: <CheckCircleOutlined className="text-base" />,
                      children: (
                        <div className="flex flex-col">
                          <Text strong>{t('payments.withdrawalTimeline.completed', 'Completed')}</Text>
                          <Text type="secondary" className="text-xs">{withdrawal.processedAt ? dayjs(withdrawal.processedAt).format('DD MMM YYYY, HH:mm') : t('payments.withdrawalTimeline.unknownTime', 'Unknown Time')}</Text>
                          <Text className="text-sm mt-1">
                            {t('payments.withdrawalTimeline.processedBy', 'Processed By')}: <Text strong>{withdrawal.processedByDisplayName || t('payments.withdrawalTimeline.systemAdmin', 'System/Admin')}</Text>
                          </Text>
                          {withdrawal.transferNote && (
                            <div className="mt-2 bg-green-50 border border-green-200 p-2 rounded text-sm text-green-800">
                              <span className="font-semibold">{t('payments.withdrawalTimeline.note', 'Note')}:</span> {withdrawal.transferNote}
                            </div>
                          )}
                          {withdrawal.transferProofUrl && (
                            <div className="mt-2">
                              <Image src={withdrawal.transferProofUrl} alt="Transfer Proof" width={120} className="rounded border border-gray-200" />
                            </div>
                          )}
                        </div>
                      ),
                    },
                  ]
                : []),
              ...(withdrawal.status === WithdrawalStatus.Rejected
                ? [
                    {
                      color: 'red',
                      dot: <CloseCircleOutlined className="text-base" />,
                      children: (
                        <div className="flex flex-col">
                          <Text strong>{t('payments.withdrawalTimeline.rejected', 'Rejected')}</Text>
                          <Text type="secondary" className="text-xs">{withdrawal.processedAt ? dayjs(withdrawal.processedAt).format('DD MMM YYYY, HH:mm') : t('payments.withdrawalTimeline.unknownTime', 'Unknown Time')}</Text>
                          <Text className="text-sm mt-1">
                            {t('payments.withdrawalTimeline.rejectedBy', 'Rejected By')}: <Text strong>{withdrawal.processedByDisplayName || t('payments.withdrawalTimeline.systemAdmin', 'System/Admin')}</Text>
                          </Text>
                          {withdrawal.rejectionReason && (
                            <div className="mt-2 bg-red-50 border border-red-200 p-2 rounded text-sm text-red-800">
                              <span className="font-semibold">{t('payments.withdrawalTimeline.reason', 'Reason')}:</span> {withdrawal.rejectionReason}
                            </div>
                          )}
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>

        <Divider className="!my-0" />

        {/* Bank Information */}
        <div>
          <Title level={5} className="!mb-4 flex items-center gap-2">
            <BankOutlined /> {t('payments.bankDetails', 'Bank Information')}
          </Title>
          <Descriptions column={1} size="small" bordered className="bg-white">
            <Descriptions.Item label="Bank Name">{withdrawal.bankName}</Descriptions.Item>
            <Descriptions.Item label="Account Holder">{withdrawal.accountHolder}</Descriptions.Item>
            <Descriptions.Item label="Account Number">
              <Space>
                {withdrawal.accountNumber || '********'}
                {withdrawal.accountNumber && (
                  <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleCopy(withdrawal.accountNumber!)} />
                )}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Reference ID">
              <Text copyable className="text-xs text-gray-500">{withdrawal.id}</Text>
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>
    </Drawer>
  )
}
