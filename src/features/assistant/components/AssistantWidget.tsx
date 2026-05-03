import { useState } from 'react'
import { FloatButton } from 'antd'
import { CommentOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { AssistantDrawer } from './AssistantDrawer'

/**
 * Global floating chatbot button + drawer. Mounted once per layout.
 * The drawer manages its own conversation lifecycle via localStorage.
 */
export function AssistantWidget() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <>
      <FloatButton
        icon={<CommentOutlined />}
        type="primary"
        tooltip={t('assistant:openTooltip', 'Hỏi trợ lý OIO') as string}
        onClick={() => setOpen(true)}
        style={{ right: 24, bottom: 24 }}
      />
      <AssistantDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}
