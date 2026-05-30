import { Modal, Form, message } from 'antd'
import { useTranslation } from 'react-i18next'
import { useSetAuctionTiming } from '@/features/auction/auctionApi'
import { queryClient, queryKeys } from '@/lib/queryClient'
import { AuctionTimingSection } from '@/features/auction/components/AuctionTimingSection'

export interface SetAuctionTimingModalProps {
  open: boolean
  auctionId: string
  onClose: () => void
}

export function SetAuctionTimingModal({ open, auctionId, onClose }: SetAuctionTimingModalProps) {
  const [form] = Form.useForm()
  const { t: tc } = useTranslation('common')
  const { mutate, isPending } = useSetAuctionTiming()

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      mutate(
        {
          auctionId,
          startTime: values.startTime.toISOString(),
          endTime: values.endTime.toISOString(),
          qualificationStartAt: values.qualificationStartAt.toISOString(),
          qualificationEndAt: values.qualificationEndAt.toISOString(),
          autoExtend: values.autoExtend,
          extensionMinutes: values.extensionMinutes,
        },
        {
          onSuccess: () => {
            message.success(tc('success.saved', 'Thành công'))
            queryClient.invalidateQueries({ queryKey: queryKeys.auctions.detailFor(auctionId, null) })
            onClose()
            form.resetFields()
          },
        }
      )
    } catch {
      // Validate failed
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={isPending}
      destroyOnClose
      width={1000}
      okText={tc('action.confirm', 'Xác nhận')}
      cancelText={tc('action.cancel', 'Hủy')}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          autoExtend: true,
          extensionMinutes: 5,
        }}
      >
        <AuctionTimingSection form={form} itemApproved={true} />
      </Form>
    </Modal>
  )
}
