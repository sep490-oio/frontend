import { useParams, useNavigate } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { Typography, Card, Button, Form, Input, Select, Space, App } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateReturn } from '@/features/order/api'

const RETURN_REASONS = [
  'defective',
  'not_as_described',
  'wrong_item',
  'damaged_in_shipping',
  'changed_mind',
  'other',
] as const

const returnSchema = z.object({
  reasonCode: z.string().min(1, 'Reason is required'),
  description: z.string().optional(),
})

type ReturnFormData = z.infer<typeof returnSchema>

export default function OrderReturnPage() {
  const { id: orderId = '' } = useParams<{ id: string }>()
  const { t } = useTranslation('order')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const { message } = App.useApp()

  const createReturn = useCreateReturn()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReturnFormData>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      reasonCode: '',
      description: '',
    },
  })

  const onSubmit = (data: ReturnFormData) => {
    createReturn.mutate(
      { orderId, ...data },
      {
        onSuccess: () => {
          message.success(t('returnCreated', 'Return request submitted successfully'))
          navigate(`${prefix}/orders/${orderId}`)
        },
        onError: () => {
          message.error(t('returnError', 'Failed to submit return request'))
        },
      },
    )
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`${prefix}/orders/${orderId}`)}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        {t('requestReturn', 'Request Return')}
      </Typography.Title>

      <Card style={{ maxWidth: 600 }}>
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item
            label={t('returnReason', 'Reason')}
            validateStatus={errors.reasonCode ? 'error' : undefined}
            help={errors.reasonCode?.message}
            required
          >
            <Controller
              name="reasonCode"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder={t('selectReason', 'Select a reason')}
                  options={RETURN_REASONS.map((reason) => ({
                    value: reason,
                    label: t(`returnReasons.${reason}`, reason.replace(/_/g, ' ')),
                  }))}
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label={t('returnDescription', 'Description')}
            validateStatus={errors.description ? 'error' : undefined}
            help={errors.description?.message}
          >
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  rows={4}
                  placeholder={t('descriptionPlaceholder', 'Provide additional details...')}
                />
              )}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createReturn.isPending}>
                {tc('action.submit', 'Submit')}
              </Button>
              <Button onClick={() => navigate(`${prefix}/orders/${orderId}`)}>
                {tc('action.cancel', 'Cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
