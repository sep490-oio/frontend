import { Button, Flex, Modal, QRCode, Typography } from 'antd'
import { PrinterOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

/**
 * Displays a signed return-shipment QR token and offers a "Print label"
 * action. Used by buyer (OrderReturn) and warehouse-staff (WarehouseReturn)
 * flows after MarkShipped succeeds.
 *
 * The print stylesheet mirrors `PrintShipmentLabelModal` — only the label
 * block is visible in the print view.
 */
export interface ReturnQrDisplayModalProps {
  open: boolean
  onClose: () => void
  qrToken: string
  title: string
  subtitle?: string
  /** Additional context lines (e.g. tracking number, recipient). */
  lines?: { label: string; value: string }[]
}

export function ReturnQrDisplayModal({
  open,
  onClose,
  qrToken,
  title,
  subtitle,
  lines = [],
}: ReturnQrDisplayModalProps) {
  const { t } = useTranslation('order')
  const { t: tc } = useTranslation('common')

  const handlePrint = () => {
    window.print()
  }

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          {tc('action.close', 'Close')}
        </Button>,
        <Button
          key="print"
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          disabled={!qrToken}
        >
          {t('returnQr.print', 'Print label')}
        </Button>,
      ]}
      width={420}
      centered
      destroyOnClose
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .oio-return-qr-label, .oio-return-qr-label * { visibility: visible !important; }
          .oio-return-qr-label {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 24px !important;
            background: #fff !important;
          }
          .ant-modal-header, .ant-modal-footer, .ant-modal-close { display: none !important; }
        }
      `}</style>
      <div className="oio-return-qr-label">
        <Flex
          vertical
          align="center"
          gap={12}
          style={{ padding: 12, border: '1px dashed #999', borderRadius: 8 }}
        >
          {qrToken ? (
            <QRCode value={qrToken} size={200} bordered={false} />
          ) : (
            <Typography.Text type="secondary">
              {t('returnQr.noToken', 'QR token not available yet')}
            </Typography.Text>
          )}
          <Typography.Title level={5} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          {subtitle && (
            <Typography.Text type="secondary" style={{ textAlign: 'center' }}>
              {subtitle}
            </Typography.Text>
          )}
          {lines.length > 0 && (
            <Flex vertical gap={4} style={{ alignItems: 'center', marginTop: 4 }}>
              {lines.map((line) => (
                <Typography.Text
                  key={line.label}
                  style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}
                >
                  {line.label}: {line.value}
                </Typography.Text>
              ))}
            </Flex>
          )}
        </Flex>
      </div>
    </Modal>
  )
}
