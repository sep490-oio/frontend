/**
 * AdminItemsPage — /admin/items
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Table, Tag, Button, Select, App, Typography, Flex,
  Tooltip, Modal, Input, Form, Avatar, Space,
} from 'antd';
import type { TableProps } from 'antd';
import { CheckOutlined, CloseOutlined, ReloadOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getItemReviewQueue, approveItem, rejectItem } from '@/services/adminService';
import type { ItemReviewQueueParams } from '@/services/adminService';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const PAGE_SIZE = 15;

export default function AdminItemsPage() {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const [params, setParams] = useState<ItemReviewQueueParams>({ PageNumber: 1, PageSize: PAGE_SIZE });
  const [rejectModal, setRejectModal] = useState<{ open: boolean; itemId: string | null }>({ open: false, itemId: null });
  const [rejectReason, setRejectReason] = useState('');

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'items', 'review-queue', params],
    queryFn: () => getItemReviewQueue(params),
    placeholderData: (prev) => prev,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'items', 'review-queue'] });

  const approveMutation = useMutation({
    mutationFn: (itemId: string) => approveItem(itemId),
    onSuccess: () => { message.success(t('admin.items.approved')); invalidate(); },
    onError: () => message.error(t('common.error.generic')),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ itemId, reason }: { itemId: string; reason: string }) => rejectItem(itemId, { reason }),
    onSuccess: () => {
      message.success(t('admin.items.rejected'));
      setRejectModal({ open: false, itemId: null });
      setRejectReason('');
      invalidate();
    },
    onError: () => message.error(t('common.error.generic')),
  });

  const items = (data?.items ?? []) as Record<string, unknown>[];
  const metadata = data?.metadata;

  const columns: TableProps<Record<string, unknown>>['columns'] = [
    {
      title: t('admin.items.columns.item'),
      key: 'item',
      render: (_: unknown, record: Record<string, unknown>) => (
        <Flex align="center" gap={10}>
          <Avatar src={record.primaryImageUrl as string} shape="square" size={40} style={{ borderRadius: 6 }} />
          <div>
            <Text strong style={{ display: 'block' }}>{record.title as string ?? '—'}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.condition as string} · {record.categoryId as string}
            </Text>
          </div>
        </Flex>
      ),
    },
    {
      title: t('admin.items.columns.status'),
      dataIndex: 'status', key: 'status', width: 140,
      render: (status: string) => {
        const color = status === 'pending' ? 'orange' : status === 'approved' ? 'green' : 'red';
        return <Tag color={color}>{t(`admin.items.status.${status}`, { defaultValue: status })}</Tag>;
      },
    },
    {
      title: t('admin.items.columns.reviewer'),
      dataIndex: 'assignedAdminId', key: 'assignedAdminId', width: 160,
      render: (id: string | null) =>
        id ? <Text code style={{ fontSize: 11 }}>{id}</Text> : <Text type="secondary">{t('admin.items.noReviewer')}</Text>,
    },
    {
      title: t('admin.items.columns.createdAt'),
      dataIndex: 'createdAt', key: 'createdAt', width: 130,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('DD/MM/YYYY HH:mm')}>
          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(date).format('DD/MM/YYYY')}</Text>
        </Tooltip>
      ),
    },
    {
      title: t('admin.items.columns.actions'),
      key: 'actions', width: 160, fixed: 'right',
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space size={4}>
          <Tooltip title={t('admin.items.approve')}>
            <Button size="small" type="primary" icon={<CheckOutlined />}
              loading={approveMutation.isPending}
              onClick={() => modal.confirm({
                title: t('admin.items.approveConfirm'),
                okText: t('admin.items.approve'),
                cancelText: t('common.cancel'),
                onOk: () => approveMutation.mutateAsync(record.id as string),
              })}
            />
          </Tooltip>
          <Tooltip title={t('admin.items.reject')}>
            <Button size="small" danger icon={<CloseOutlined />}
              onClick={() => setRejectModal({ open: true, itemId: record.id as string })}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{t('admin.items.title')}</Title>
          <Text type="secondary">{t('admin.items.subtitle', { count: metadata?.totalCount ?? 0 })}</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
          {t('common.refresh')}
        </Button>
      </Flex>

      <Flex gap={8} style={{ marginBottom: 16 }}>
        <Select
          placeholder={t('admin.items.filterStatus')}
          allowClear style={{ width: 200 }} suffixIcon={<FilterOutlined />}
          onChange={(val) => setParams((p: ItemReviewQueueParams) => ({ ...p, Status: val, PageNumber: 1 }))}
        >
          <Option value="pending">{t('admin.items.status.pending')}</Option>
          <Option value="approved">{t('admin.items.status.approved')}</Option>
          <Option value="rejected">{t('admin.items.status.rejected')}</Option>
        </Select>
      </Flex>

      <Table
        rowKey="id" columns={columns} dataSource={items}
        loading={isFetching} scroll={{ x: 800 }}
        pagination={{
          current: metadata?.currentPage ?? 1, pageSize: PAGE_SIZE,
          total: metadata?.totalCount ?? 0, showSizeChanger: false,
          showTotal: (total) => t('common.pagination.total', { total }),
          onChange: (page) => setParams((p: ItemReviewQueueParams) => ({ ...p, PageNumber: page })),
        }}
        size="middle"
      />

      <Modal
        title={t('admin.items.rejectModal.title')}
        open={rejectModal.open}
        onCancel={() => { setRejectModal({ open: false, itemId: null }); setRejectReason(''); }}
        onOk={() => {
          if (!rejectModal.itemId) return;
          if (!rejectReason.trim()) { message.warning(t('admin.items.rejectModal.reasonRequired')); return; }
          rejectMutation.mutate({ itemId: rejectModal.itemId, reason: rejectReason });
        }}
        okText={t('admin.items.rejectModal.confirm')}
        okButtonProps={{ danger: true, loading: rejectMutation.isPending }}
        cancelText={t('common.cancel')}
      >
        <Form layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item label={t('admin.items.rejectModal.reasonLabel')} required>
            <TextArea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('admin.items.rejectModal.reasonPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}