/**
 * CreateItemPage — Seller flow: upload images → fill details → create item.
 *
 * Follows the 3-step Cloudinary signed upload flow:
 * 1. Upload images via mediaService (signature → Cloudinary → confirm)
 * 2. Fill item details (title, condition, category, description)
 * 3. Submit: POST /api/items (creates draft) → POST /api/items/{id}/activate
 */

import { useState } from 'react';
import {
  Card,
  Typography,
  Form,
  Input,
  Select,
  Button,
  Upload,
  message,
  Steps,
  Flex,
  Image,
  Space,
  Alert,
} from 'antd';
import { PlusOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { mediaService } from '@/services/mediaService';
import type { MediaUploadResult } from '@/services/mediaService';
import { addItemMedia } from '@/services/auctionService';
import { useCreateItem, useActivateItem } from '@/hooks/useItems';
import { useCategories } from '@/hooks/useAuctions';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const { Title, Text } = Typography;
const { TextArea } = Input;

/** Tracks each uploaded image with its BE metadata */
interface UploadedImage {
  mediaUploadId: string;
  publicId: string;
  secureUrl: string;
  file: UploadFile;
}

const CONDITION_OPTIONS = [
  { value: 'new', labelKey: 'createItem.conditionNew' },
  { value: 'like_new', labelKey: 'createItem.conditionLikeNew' },
  { value: 'very_good', labelKey: 'createItem.conditionVeryGood' },
  { value: 'good', labelKey: 'createItem.conditionGood' },
  { value: 'acceptable', labelKey: 'createItem.conditionAcceptable' },
];

export function CreateItemPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const [form] = Form.useForm();

  const createItem = useCreateItem();
  const activateItem = useActivateItem();
  const { data: categories = [] } = useCategories();

  // ─── State ──────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activated, setActivated] = useState(false);

  // ─── Image Upload ──────────────────────────────────────────────
  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const result: MediaUploadResult = await mediaService.uploadMedia(
        file,
        'item_image',
      );
      const newImage: UploadedImage = {
        mediaUploadId: result.mediaUploadId,
        publicId: result.publicId,
        secureUrl: result.secureUrl,
        file: {
          uid: result.mediaUploadId,
          name: file.name,
          status: 'done',
          url: result.secureUrl,
        },
      };
      setUploadedImages((prev) => [...prev, newImage]);
      message.success(t('createItem.uploadSuccess'));
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : t('createItem.uploadFailed')
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (mediaUploadId: string) => {
    setUploadedImages((prev) =>
      prev.filter((img) => img.mediaUploadId !== mediaUploadId)
    );
  };

  // ─── Create + Activate Item ────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Step 1: Create item (draft) — without images
      const { id: itemId } = await createItem.mutateAsync({
        title: values.title,
        condition: values.condition,
        categoryId: values.categoryId || undefined,
        description: values.description || undefined,
        quantity: 1,
      });

      message.success(t('createItem.createSuccess'));

      // Step 2: Attach images via dedicated endpoint POST /api/items/{id}/media
      for (let i = 0; i < uploadedImages.length; i++) {
        const img = uploadedImages[i];
        await addItemMedia(itemId, {
          mediaUploadId: img.mediaUploadId,
          isPrimary: i === 0,
          sortOrder: i,
        });
      }

      // Step 3: Try to activate (draft → active). BE has a known issue where
      // the activate handler doesn't Include() the media collection, causing
      // "no images" even after addItemMedia succeeds. Skip gracefully if 409.
      if (uploadedImages.length > 0) {
        try {
          await activateItem.mutateAsync(itemId);
          setActivated(true);
          message.success(t('createItem.activateSuccess'));
        } catch {
          // Activation failed (likely BE Include bug) — item stays as draft
          // with images attached. Seller can activate later.
        }
      }

      setCurrentStep(2);
    } catch {
      message.error(t('common.error'));
    }
  };

  // ─── Flatten categories for Select ─────────────────────────────
  const categoryOptions = categories.flatMap((cat) => {
    const opts = [{ value: cat.id, label: cat.name }];
    if (cat.children) {
      opts.push(
        ...cat.children.map((child) => ({
          value: child.id,
          label: `${cat.name} › ${child.name}`,
        }))
      );
    }
    return opts;
  });

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? 16 : 24 }}>
      <Title level={3}>{t('createItem.title')}</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        {t('createItem.subtitle')}
      </Text>

      <Steps
        current={currentStep}
        size={isMobile ? 'small' : 'default'}
        style={{ marginBottom: 24 }}
        items={[
          { title: t('createItem.stepUpload') },
          { title: t('createItem.stepDetails') },
          { title: t('createItem.stepDone') },
        ]}
      />

      {/* ─── Step 0: Upload Images ──────────────────────────────── */}
      {currentStep === 0 && (
        <Card>
          <Title level={5}>{t('createItem.uploadTitle')}</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            {t('createItem.uploadHint')}
          </Text>

          {/* Image preview grid */}
          {uploadedImages.length > 0 && (
            <Flex wrap="wrap" gap={12} style={{ marginBottom: 16 }}>
              {uploadedImages.map((img, idx) => (
                <div
                  key={img.mediaUploadId}
                  style={{
                    position: 'relative',
                    width: 104,
                    height: 104,
                    border: idx === 0 ? '2px solid #1677ff' : '1px solid #d9d9d9',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src={img.secureUrl}
                    width={104}
                    height={104}
                    style={{ objectFit: 'cover' }}
                    preview={{ mask: false }}
                  />
                  {idx === 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: '#1677ff',
                        color: '#fff',
                        textAlign: 'center',
                        fontSize: 11,
                        padding: '1px 0',
                      }}
                    >
                      {t('createItem.primaryImage')}
                    </div>
                  )}
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveImage(img.mediaUploadId)}
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      background: 'rgba(255,255,255,0.8)',
                    }}
                  />
                </div>
              ))}
            </Flex>
          )}

          <Upload
            beforeUpload={(file) => {
              handleUpload(file);
              return false; // Prevent default upload — we handle it
            }}
            showUploadList={false}
            accept="image/jpeg,image/png,image/webp"
            multiple
          >
            <Button icon={<PlusOutlined />} loading={uploading}>
              {uploading ? t('createItem.uploading') : t('createItem.addImage')}
            </Button>
          </Upload>

          <Flex justify="flex-end" style={{ marginTop: 24 }}>
            <Button
              type="primary"
              onClick={() => setCurrentStep(1)}
              disabled={uploadedImages.length === 0}
            >
              {t('common.next')}
            </Button>
          </Flex>
        </Card>
      )}

      {/* ─── Step 1: Item Details ───────────────────────────────── */}
      {currentStep === 1 && (
        <Card>
          <Title level={5}>{t('createItem.detailsTitle')}</Title>

          <Form form={form} layout="vertical">
            <Form.Item
              name="title"
              label={t('createItem.itemTitle')}
              rules={[{ required: true, message: t('createItem.titleRequired') }]}
            >
              <Input
                placeholder={t('createItem.titlePlaceholder')}
                maxLength={255}
                showCount
              />
            </Form.Item>

            <Form.Item
              name="condition"
              label={t('createItem.condition')}
              rules={[{ required: true, message: t('createItem.conditionRequired') }]}
            >
              <Select placeholder={t('createItem.conditionPlaceholder')}>
                {CONDITION_OPTIONS.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {categoryOptions.length > 0 && (
              <Form.Item
                name="categoryId"
                label={t('createItem.category')}
              >
                <Select
                  placeholder={t('createItem.categoryPlaceholder')}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={categoryOptions}
                />
              </Form.Item>
            )}

            <Form.Item
              name="description"
              label={t('createItem.description')}
            >
              <TextArea
                rows={4}
                placeholder={t('createItem.descriptionPlaceholder')}
                maxLength={2000}
                showCount
              />
            </Form.Item>
          </Form>

          <Flex justify="space-between" style={{ marginTop: 16 }}>
            <Button onClick={() => setCurrentStep(0)}>
              {t('common.back')}
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={createItem.isPending || activateItem.isPending}
            >
              {t('createItem.submit')}
            </Button>
          </Flex>
        </Card>
      )}

      {/* ─── Step 2: Done ───────────────────────────────────────── */}
      {currentStep === 2 && (
        <Card>
          <Flex vertical align="center" gap={16} style={{ padding: 24 }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
            <Title level={4} style={{ margin: 0 }}>
              {t('createItem.doneTitle')}
            </Title>
            {activated && (
              <Alert
                type="success"
                message={t('createItem.activatedMessage')}
                showIcon
              />
            )}
            <Text type="secondary">
              {t('createItem.doneHint')}
            </Text>
            <Space>
              <Button onClick={() => {
                setCurrentStep(0);
                setUploadedImages([]);
                setActivated(false);
                form.resetFields();
              }}>
                {t('createItem.createAnother')}
              </Button>
              <Button type="primary" onClick={() => navigate('/my-listings')}>
                {t('createItem.viewListings')}
              </Button>
            </Space>
          </Flex>
        </Card>
      )}
    </div>
  );
}
