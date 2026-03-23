import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import {
  Card, Typography, Flex, Input, Button, Space,
  Spin, Empty, App, Tag, Tooltip, Form,
} from 'antd';
import {
  SearchOutlined, EditOutlined, SaveOutlined,
  CloseOutlined, ReloadOutlined, InfoCircleOutlined,
  ClockCircleOutlined, UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAdminSettings, useUpdateSetting } from '@/hooks/useAdmin';
import type { SystemSettingDto } from '@/services/adminService';

const { Title, Text } = Typography;

const updateSchema = z.object({
  value: z.string().min(1, 'Không được để trống'),
});
type UpdateForm = z.infer<typeof updateSchema>;

function valueTypeColor(type: string | null | undefined): string {
  switch (type?.toLowerCase()) {
    case 'boolean': return 'purple';
    case 'number':
    case 'integer': return 'blue';
    case 'string':  return 'cyan';
    case 'json':    return 'orange';
    default:        return 'default';
  }
}

interface SettingRowProps {
  setting: SystemSettingDto;
}

function SettingRow({ setting }: SettingRowProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [editing, setEditing] = useState(false);

  const displayValue = setting.value != null
    ? typeof setting.value === 'object'
      ? JSON.stringify(setting.value)
      : String(setting.value)
    : '';

  const { control, handleSubmit, reset, formState: { errors } } = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    defaultValues: { value: displayValue },
  });

  // ─── Hook ─────────────────────────────────────────────────────────
  const updateSetting = useUpdateSetting();

  const onSubmit = (form: UpdateForm) => {
    updateSetting.mutate(
      { key: setting.key!, data: { key: setting.key, value: form.value } },
      {
        onSuccess: () => {
          message.success(t('admin.settings.updated', { key: setting.key }));
          setEditing(false);
        },
        onError: () => message.error(t('common.error.generic')),
      }
    );
  };

  const handleCancel = () => {
    reset({ value: displayValue });
    setEditing(false);
  };

  return (
    <div
      style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--ant-color-border-secondary)',
        background: editing ? 'var(--ant-color-primary-bg)' : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      <Flex justify="space-between" align="flex-start" gap={16}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Flex align="center" gap={8} style={{ marginBottom: 4 }} wrap>
            <Text strong code style={{ fontSize: 13 }}>{setting.key}</Text>
            {setting.valueType && (
              <Tag color={valueTypeColor(setting.valueType)} style={{ margin: 0 }}>
                {setting.valueType}
              </Tag>
            )}
            {setting.description && (
              <Tooltip title={setting.description}>
                <InfoCircleOutlined style={{ color: 'var(--ant-color-text-tertiary)', fontSize: 13 }} />
              </Tooltip>
            )}
          </Flex>

          {editing ? (
            <Form layout="inline" onFinish={handleSubmit(onSubmit)} style={{ marginTop: 8 }}>
              <Controller
                name="value"
                control={control}
                render={({ field }) => (
                  <Form.Item
                    validateStatus={errors.value ? 'error' : undefined}
                    help={errors.value?.message}
                    style={{ marginBottom: 0, flex: 1 }}
                  >
                    <Input
                      {...field}
                      autoFocus
                      size="small"
                      style={{ maxWidth: 420 }}
                      onKeyDown={(e) => { if (e.key === 'Escape') handleCancel(); }}
                    />
                  </Form.Item>
                )}
              />
              <Form.Item style={{ marginBottom: 0 }}>
                <Space size={4}>
                  <Button
                    size="small" type="primary"
                    icon={<SaveOutlined />}
                    htmlType="submit"
                    loading={updateSetting.isPending}
                  >
                    {t('common.save')}
                  </Button>
                  <Button size="small" icon={<CloseOutlined />} onClick={handleCancel}>
                    {t('common.cancel')}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          ) : (
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'var(--ant-font-family-code)',
                wordBreak: 'break-all',
                color: displayValue
                  ? 'var(--ant-color-text)'
                  : 'var(--ant-color-text-quaternary)',
              }}
            >
              {displayValue || <em>{t('admin.settings.emptyValue')}</em>}
            </Text>
          )}

          {(setting.modifiedBy || setting.modifiedAt) && !editing && (
            <Flex gap={12} style={{ marginTop: 6 }} wrap>
              {setting.modifiedBy && (
                <Space size={4}>
                  <UserOutlined style={{ fontSize: 11, color: 'var(--ant-color-text-tertiary)' }} />
                  <Text type="secondary" style={{ fontSize: 11 }}>{setting.modifiedBy}</Text>
                </Space>
              )}
              {setting.modifiedAt && (
                <Space size={4}>
                  <ClockCircleOutlined style={{ fontSize: 11, color: 'var(--ant-color-text-tertiary)' }} />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {dayjs(setting.modifiedAt).format('DD/MM/YYYY HH:mm')}
                  </Text>
                </Space>
              )}
            </Flex>
          )}
        </div>

        {!editing && (
          <Tooltip title={t('common.edit')}>
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => setEditing(true)} />
          </Tooltip>
        )}
      </Flex>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  // ─── Hooks ───────────────────────────────────────────────────────
  const { data: settings = [], isLoading, isFetching, refetch } = useAdminSettings();

  const filtered = useMemo(
    () => search
      ? settings.filter(
          (s) =>
            s.key?.toLowerCase().includes(search.toLowerCase()) ||
            s.description?.toLowerCase().includes(search.toLowerCase())
        )
      : settings,
    [settings, search]
  );

  const grouped = useMemo(() => {
    const groups: Record<string, SystemSettingDto[]> = {};
    for (const s of filtered) {
      const dot = s.key?.indexOf('.');
      const group = s.key && dot !== undefined && dot > 0 ? s.key.slice(0, dot) : 'General';
      (groups[group] ??= []).push(s);
    }
    return groups;
  }, [filtered]);

  return (
    <div style={{ padding: 24 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{t('admin.settings.title')}</Title>
          <Text type="secondary">
            {t('admin.settings.subtitle', { count: settings.length })}
          </Text>
        </div>
        <Space>
          <Input
            placeholder={t('admin.settings.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 240 }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
            {t('common.refresh')}
          </Button>
        </Space>
      </Flex>

      {isLoading ? (
        <Flex justify="center" align="center" style={{ height: 300 }}><Spin size="large" /></Flex>
      ) : Object.keys(grouped).length === 0 ? (
        <Empty description={search ? t('common.noResults') : t('admin.settings.empty')} />
      ) : (
        Object.entries(grouped).map(([group, items]) => (
          <Card
            key={group}
            title={<Flex align="center" gap={8}><Text strong>{group}</Text><Tag>{items.length}</Tag></Flex>}
            style={{ marginBottom: 16 }}
            styles={{ body: { padding: 0 } }}
          >
            {items.map((setting) => (
              <SettingRow key={setting.key} setting={setting} />
            ))}
          </Card>
        ))
      )}
    </div>
  );
}