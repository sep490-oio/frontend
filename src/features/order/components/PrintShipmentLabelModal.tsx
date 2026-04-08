import { Modal, QRCode, Typography, Flex, Button } from 'antd'
import { PrinterOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { SellerDirectShipmentDto, OrderDto } from '@/types'

/**
 * Print-friendly shipment label modal. Renders a QR code, the shipment
 * display id, internal tracking code, recipient short name (from the
 * linked order), and the order number. `window.print()` triggers the
 * scoped `@media print` stylesheet below so only the label block is
 * printed and the rest of the app is hidden.
 */
interface PrintShipmentLabelModalProps {
  open: boolean
  onClose: () => void
  shipment: SellerDirectShipmentDto
  order?: OrderDto | null
}

export function PrintShipmentLabelModal({ open, onClose, shipment, order }: PrintShipmentLabelModalProps) {
  const { t } = useTranslation(['order', 'common'])
  const qrPayload = shipment.qrPayload || shipment.qrCodeUrl || shipment.internalTrackingCode
  const buyerShortName = order?.shipping?.recipientName ?? order?.buyerDisplayName ?? '—'

  const handlePrint = () => {
    window.print()
  }

  return (
    <Modal
      title={t('directShipment.printLabel', 'Print Shipment Label')}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('common:action.close', 'Close')}
        </Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          {t('directShipment.print', 'Print')}
        </Button>,
      ]}
      width={420}
      centered
    >
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .oio-print-label, .oio-print-label * { visibility: visible !important; }
          .oio-print-label {
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
      <div className="oio-print-label">
        <Flex vertical align="center" gap={12} style={{ padding: 12, border: '1px dashed #999', borderRadius: 8 }}>
          <QRCode value={qrPayload} size={300} bordered={false} />
          <Typography.Title level={4} style={{ margin: 0 }}>
            #{shipment.shipmentIdDisplay}
          </Typography.Title>
          <Typography.Text style={{ fontFamily: 'monospace', fontSize: 13 }}>
            {shipment.internalTrackingCode}
          </Typography.Text>
          <div style={{ textAlign: 'center' }}>
            <Typography.Text strong>{buyerShortName}</Typography.Text>
            {order?.orderNumber && (
              <div>
                <Typography.Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                  {order.orderNumber}
                </Typography.Text>
              </div>
            )}
          </div>
        </Flex>
      </div>
    </Modal>
  )
}
