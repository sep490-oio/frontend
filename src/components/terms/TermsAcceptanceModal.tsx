import { Modal, Button, Alert, Typography, Tag, Space, Spin } from 'antd'
import { FilePdfOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useActiveTermsByType, useAcceptTerm } from '@/features/user/api'

export type TermType = 'platform' | 'bidder' | 'seller'

interface TermsAcceptanceModalProps {
  open: boolean
  onClose: () => void
  termType: TermType
  onAccepted?: () => void
}

/**
 * Reusable preview + accept modal. Never redirects. On accept: fires onAccepted
 * then closes. Parent remains responsible for any pending action (bid, etc).
 */
export function TermsAcceptanceModal({ open, onClose, termType, onAccepted }: TermsAcceptanceModalProps) {
  const { t } = useTranslation('common')
  // BE /terms/{type}/active returns a single TermsDocumentDto, or null when
  // no active document is configured (the hook maps 404 → null).
  const { data: term, isLoading, error } = useActiveTermsByType(termType)
  const acceptMutation = useAcceptTerm()

  const titleByType: Record<TermType, string> = {
    platform: t('terms.type.platform', 'Platform Terms'),
    bidder: t('terms.type.bidder', 'Bidder Terms'),
    seller: t('terms.type.seller', 'Seller Agreement'),
  }

  const handleAccept = async () => {
    if (!term?.id) return
    try {
      await acceptMutation.mutateAsync(term.id)
      onAccepted?.()
      onClose()
    } catch {
      // mutation surfaces error via toast in caller flows; modal stays open
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={720}
      title={titleByType[termType]}
      centered
      styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('cancel', 'Cancel')}
        </Button>,
        <Button
          key="accept"
          type="primary"
          loading={acceptMutation.isPending}
          disabled={!term?.id}
          onClick={handleAccept}
          style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
        >
          {t('terms.accept', 'I Accept')}
        </Button>,
      ]}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : error ? (
        <Alert
          type="warning"
          showIcon
          message={t('terms.notAvailable', 'Terms document is temporarily unavailable.')}
          description={t('terms.tryAgain', 'Please try again in a moment.')}
        />
      ) : !term ? (
        <Alert
          type="info"
          showIcon
          message={t('terms.none', 'No terms require your acceptance right now.')}
        />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Space>
            <Tag>{titleByType[termType]}</Tag>
            <Tag color="blue">v{term.version}</Tag>
          </Space>
          {term.contentUrl ? (
            <object
              data={`${term.contentUrl}#toolbar=0&navpanes=0&statusbar=0&scrollbar=1&view=FitH`}
              type="application/pdf"
              style={{ width: '100%', height: '55vh', minHeight: 400, border: '1px solid var(--color-border)', borderRadius: 6 }}
            >
              <Alert
                type="info"
                showIcon
                icon={<FilePdfOutlined />}
                message={t('terms.previewUnavailable', 'Preview unavailable')}
                description={
                  <a href={term.contentUrl} target="_blank" rel="noopener noreferrer">
                    {t('terms.openInNewTab', 'Open in new tab')}
                  </a>
                }
              />
            </object>
          ) : (
            <Alert
              type="warning"
              showIcon
              message={t('terms.noDocument', 'Document not available')}
            />
          )}
          {term.contentUrl && (
            <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
              <a href={term.contentUrl} target="_blank" rel="noopener noreferrer">
                {t('terms.openInNewTab', 'Open in new tab')}
              </a>
              {' · '}
              <a href={term.contentUrl} download>
                {t('terms.download', 'Download')}
              </a>
            </Typography.Paragraph>
          )}
        </Space>
      )}
    </Modal>
  )
}
