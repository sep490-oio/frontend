/**
 * AdminTermsPage — /admin/terms
 *
 * Manages legal terms documents (ToS, Privacy Policy, etc.)
 *   - List all versions grouped by type
 *   - Create a new version (via mediaUploadId referencing an uploaded PDF)
 *   - Activate a specific version (only one can be active per type)
 */
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table, Tag, Button, Select, App, Typography, Flex,
  Tooltip, Modal, Input, Form, Space, Badge, Card,
  Tabs, Empty, Alert, Statistic, Row, Col, Divider,
} from 'antd';
import type { TableProps } from 'antd';
import {
  FileTextOutlined, PlusOutlined, CheckCircleOutlined,
  ReloadOutlined, CloudUploadOutlined, HistoryOutlined,
  SafetyCertificateOutlined, FilterOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAdminTerms, useCreateTermsDocument, useActivateTermsDocument } from '@/hooks/useAdmin';
import type { TermsDocumentDto, CreateTermsDocumentRequest } from '@/services/adminService';

const { Text, Title } = Typography;
const { Option } = Select;

// ─── Known terms types ────────────────────────────────────────────────────────
const TERMS_TYPES = ['TermsOfService', 'PrivacyPolicy', 'SellerAgreement', 'BuyerAgreement', 'CookiePolicy'] as const;
type TermsType = typeof TERMS_TYPES[number];

const TYPE_COLOR: Record<string, string> = {
  TermsOfService: 'blue',
  PrivacyPolicy: 'purple',
  SellerAgreement: 'green',
  BuyerAgreement: 'teal',
  CookiePolicy: 'cyan',
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  TermsOfService: <FileTextOutlined />,
  PrivacyPolicy: <SafetyCertificateOutlined />,
  SellerAgreement: <SafetyCertificateOutlined />,
  BuyerAgreement: <SafetyCertificateOutlined />,
  CookiePolicy: <FileTextOutlined />,
};

// ─── Create modal ─────────────────────────────────────────────────────────────
interface CreateModalProps {
  open: boolean;
  onClose: () => void;
}

function CreateModal({ open, onClose }: CreateModalProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateTermsDocumentRequest>();

  const createMutation = useCreateTermsDocument();

  const handleOk = () => {
    form.validateFields().then((values) => {
      createMutation.mutate(values, {
        onSuccess: () => {
          message.success(t('admin.terms.created'));
          form.resetFields();
          onClose();
        },
        onError: () => message.error(t('common.error.generic')),
      });
    });
  };

  return (
    <Modal
      title={
        <Flex align="center" gap={8}>
          <PlusOutlined style={{ color: '#378ADD' }} />
          <span>{t('admin.terms.createModal.title')}</span>
        </Flex>
      }
      open={open}
      onCancel={() => { form.resetFields(); onClose(); }}
      onOk={handleOk}
      okText={t('admin.terms.createModal.confirm')}
      okButtonProps={{ loading: createMutation.isPending }}
      cancelText={t('common.cancel')}
      width={520}
    >
      <Alert
        type="info"
        showIcon
        icon={<CloudUploadOutlined />}
        message={t('admin.terms.createModal.uploadHint')}
        description={t('admin.terms.createModal.uploadHintDesc')}
        style={{ marginBottom: 20, marginTop: 12 }}
      />
      <Form form={form} layout="vertical">
        <Form.Item
          name="type"
          label={t('admin.terms.createModal.typeLabel')}
          rules={[{ required: true, message: t('admin.terms.createModal.typeRequired') }]}
        >
          <Select placeholder={t('admin.terms.createModal.typePlaceholder')}>
            {TERMS_TYPES.map((type) => (
              <Option key={type} value={type}>
                <Flex align="center" gap={6}>
                  {TYPE_ICON[type]}
                  <span>{t(`admin.terms.types.${type}`, { defaultValue: type })}</span>
                </Flex>
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="mediaUploadId"
          label={t('admin.terms.createModal.mediaUploadId')}
          rules={[{ required: true, message: t('admin.terms.createModal.mediaRequired') }]}
          extra={t('admin.terms.createModal.mediaHint')}
        >
          <Input
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            prefix={<CloudUploadOutlined style={{ color: 'var(--ant-color-text-tertiary)' }} />}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ─── Terms table for a given type ─────────────────────────────────────────────
interface TermsTableProps {
  documents: TermsDocumentDto[];
  isFetching: boolean;
}

function TermsTable({ documents, isFetching }: TermsTableProps) {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();

  const activateMutation = useActivateTermsDocument();

  const columns: TableProps<TermsDocumentDto>['columns'] = [
    {
      title: t('admin.terms.columns.version'), dataIndex: 'version', key: 'version', width: 120,
      render: (v: string, r: TermsDocumentDto) => (
        <Flex align="center" gap={6}>
          <Text strong style={{ fontFamily: 'var(--ant-font-family-code)' }}>{v ?? '—'}</Text>
          {r.isActive && <Badge status="success" text={t('admin.terms.columns.active')} />}
        </Flex>
      ),
    },
    {
      title: t('admin.terms.columns.file'), key: 'file',
      render: (_, r: TermsDocumentDto) => (
        <Flex align="center" gap={8}>
          <FileTextOutlined style={{ color: 'var(--ant-color-text-tertiary)', fontSize: 16 }} />
          <Flex vertical gap={0}>
            <Text style={{ fontSize: 13 }}>{r.fileName ?? t('admin.terms.noFileName')}</Text>
            {r.fileSize && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {(r.fileSize / 1024).toFixed(1)} KB
              </Text>
            )}
          </Flex>
        </Flex>
      ),
    },
    {
      title: t('admin.terms.columns.status'), dataIndex: 'isActive', key: 'isActive', width: 110,
      render: (active: boolean) => active
        ? <Tag color="success" icon={<CheckCircleOutlined />}>{t('admin.terms.columns.active')}</Tag>
        : <Tag>{t('admin.terms.columns.inactive')}</Tag>,
    },
    {
      title: t('admin.terms.columns.publishedAt'), dataIndex: 'publishedAt', key: 'publishedAt', width: 130,
      render: (d: string | null) => d
        ? <Text style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM/YYYY HH:mm')}</Text>
        : <Text type="secondary">—</Text>,
    },
    {
      title: t('admin.terms.columns.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 120,
      render: (d: string) => (
        <Tooltip title={dayjs(d).format('DD/MM/YYYY HH:mm')}>
          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(d).format('DD/MM/YYYY')}</Text>
        </Tooltip>
      ),
    },
    {
      title: t('admin.terms.columns.actions'), key: 'actions', width: 130, fixed: 'right',
      render: (_, record: TermsDocumentDto) => (
        <Space size={4}>
          {record.contentUrl && (
            <Tooltip title={t('admin.terms.viewFile')}>
              <Button size="small" icon={<FileTextOutlined />}
                onClick={() => window.open(record.contentUrl!, '_blank')}>
                {t('admin.terms.view')}
              </Button>
            </Tooltip>
          )}
          {!record.isActive && (
            <Tooltip title={t('admin.terms.activate')}>
              <Button
                size="small" type="primary" icon={<CheckCircleOutlined />}
                loading={activateMutation.isPending}
                onClick={() => modal.confirm({
                  title: t('admin.terms.activateConfirm.title'),
                  content: t('admin.terms.activateConfirm.content', { version: record.version }),
                  okText: t('admin.terms.activate'),
                  cancelText: t('common.cancel'),
                  onOk: () => activateMutation.mutateAsync(record.id, {
                    onSuccess: () => message.success(t('admin.terms.activated', { version: record.version })),
                    onError: () => message.error(t('common.error.generic')),
                  }),
                })}
              >
                {t('admin.terms.activate')}
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={documents}
      loading={isFetching}
      size="small"
      pagination={documents.length > 10 ? { pageSize: 10, showSizeChanger: false } : false}
      rowClassName={(r: TermsDocumentDto) => r.isActive ? 'ant-table-row-selected' : ''}
    />
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function AdminTermsPage() {
  const { t } = useTranslation();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: allDocuments = [], isLoading, isFetching, refetch } = useAdminTerms(
    typeFilter ? { type: typeFilter } : {}
  );

  // Group documents by type
  const grouped = useMemo(() => {
    const g: Record<string, TermsDocumentDto[]> = {};
    for (const doc of allDocuments) {
      const type = doc.type ?? 'Other';
      (g[type] ??= []).push(doc);
    }
    // Sort within each group: active first, then by createdAt desc
    for (const type of Object.keys(g)) {
      g[type].sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix();
      });
    }
    return g;
  }, [allDocuments]);

  const activeCount    = allDocuments.filter((d) => d.isActive).length;
  const totalTypes     = Object.keys(grouped).length;
  const latestModified = allDocuments.reduce<string | null>((latest, d) => {
    if (!latest) return d.createdAt;
    return dayjs(d.createdAt).isAfter(latest) ? d.createdAt : latest;
  }, null);

  // Tab items per type
  const tabItems = Object.entries(grouped).map(([type, docs]) => ({
    key: type,
    label: (
      <Flex align="center" gap={6}>
        {TYPE_ICON[type] ?? <FileTextOutlined />}
        <span>{t(`admin.terms.types.${type}`, { defaultValue: type })}</span>
        <Badge
          count={docs.filter((d) => d.isActive).length}
          color="#1D9E75"
          size="small"
          overflowCount={9}
          showZero={false}
        />
        <Badge count={docs.length} color="#888780" size="small" overflowCount={99} />
      </Flex>
    ),
    children: <TermsTable documents={docs} isFetching={isFetching} />,
  }));

  return (
    <div style={{ padding: 24 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{t('admin.terms.title')}</Title>
          <Text type="secondary">{t('admin.terms.subtitle', { count: allDocuments.length, types: totalTypes })}</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
            {t('common.refresh')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            {t('admin.terms.createNew')}
          </Button>
        </Space>
      </Flex>

      {/* Summary cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t('admin.terms.stats.totalVersions')}
              value={allDocuments.length}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t('admin.terms.stats.activeVersions')}
              value={activeCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1D9E75' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t('admin.terms.stats.lastUpdated')}
              value={latestModified ? dayjs(latestModified).format('DD/MM/YYYY') : '—'}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter */}
      <Flex gap={8} style={{ marginBottom: 16 }}>
        <Select
          placeholder={t('admin.terms.filterType')} allowClear style={{ width: 200 }}
          suffixIcon={<FilterOutlined />}
          onChange={(val) => setTypeFilter(val as string | undefined)}
        >
          {TERMS_TYPES.map((type) => (
            <Option key={type} value={type}>
              <Flex align="center" gap={6}>
                {TYPE_ICON[type]}
                <span>{t(`admin.terms.types.${type}`, { defaultValue: type })}</span>
              </Flex>
            </Option>
          ))}
        </Select>
      </Flex>

      {isLoading ? null : Object.keys(grouped).length === 0 ? (
        <Empty
          description={
            <Flex vertical align="center" gap={12}>
              <Text type="secondary">{t('admin.terms.empty')}</Text>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                {t('admin.terms.createNew')}
              </Button>
            </Flex>
          }
          image={<FileTextOutlined style={{ fontSize: 48, color: 'var(--ant-color-text-quaternary)' }} />}
          imageStyle={{ height: 60 }}
        />
      ) : tabItems.length === 1 ? (
        // Single type result — show plain table without tabs
        <Card
          title={
            <Flex align="center" gap={8}>
              {TYPE_ICON[tabItems[0].key] ?? <FileTextOutlined />}
              <Text strong>{t(`admin.terms.types.${tabItems[0].key}`, { defaultValue: tabItems[0].key })}</Text>
              <Tag color={TYPE_COLOR[tabItems[0].key] ?? 'default'}>
                {grouped[tabItems[0].key].length} {t('admin.terms.stats.versionsUnit')}
              </Tag>
            </Flex>
          }
        >
          <TermsTable documents={grouped[tabItems[0].key]} isFetching={isFetching} />
        </Card>
      ) : (
        <Tabs
          type="card"
          items={tabItems}
          tabBarStyle={{ marginBottom: 0 }}
        />
      )}

      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
