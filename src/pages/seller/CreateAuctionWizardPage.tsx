/**
 * CreateAuctionWizardPage — Single-page form for creating item + auction.
 *
 * Uses the all-in-one POST /api/auctions endpoint which creates both
 * item and auction in one call. All fields on one page, no wizard steps.
 *
 * Sections:
 * 1. Thông tin vật phẩm (Item Info) — title, condition, category, description
 * 2. Hình ảnh vật phẩm (Images)    — guided photo upload
 * 3. Giá & Thời gian (Pricing)     — pricing, platform verification toggle
 *
 * Submit flow:
 * 1. POST /api/auctions (all-in-one) → creates Item (draft) + Auction (draft)
 * 2. POST /api/items/{itemId}/submit → submits item for review
 */

import { useState } from 'react';
import {
  Card,
  Typography,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Flex,
  Alert,
  Result,
  Divider,
  Collapse,
  message,
} from 'antd';
import {
  ShopOutlined,
  CheckCircleOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAppSelector } from '@/app/hooks';
import { useCreateAuctionAllInOne } from '@/hooks/useSellerManagement';
import { submitItemForReview } from '@/services/auctionService';
import { useCategories } from '@/hooks/useAuctions';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { GuidedImageUpload } from '@/components/seller/GuidedImageUpload';
import type { UploadedImage } from '@/components/seller/GuidedImageUpload';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CONDITION_OPTIONS = [
  { value: 'new', labelKey: 'createItem.conditionNew' },
  { value: 'like_new', labelKey: 'createItem.conditionLikeNew' },
  { value: 'very_good', labelKey: 'createItem.conditionVeryGood' },
  { value: 'good', labelKey: 'createItem.conditionGood' },
  { value: 'acceptable', labelKey: 'createItem.conditionAcceptable' },
];

interface FormValues {
  // Item fields
  title: string;
  condition: string;
  categoryId?: string;
  description?: string;
  // Pricing fields
  startingPrice: number;
  bidIncrement: number;
  reservePrice?: number;
  buyNowPrice?: number;
  verifyByPlatform: boolean;
  autoExtend: boolean;
  extensionMinutes: number;
}

export function CreateAuctionWizardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const user = useAppSelector((state) => state.auth.user);

  const [form] = Form.useForm<FormValues>();
  const createAuction = useCreateAuctionAllInOne();
  const { data: categories = [] } = useCategories();

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    auctionId: string;
    itemId: string;
  } | null>(null);

  // ─── Seller role check ──────────────────────────────────────────
  if (!user?.hasSellerPermission) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: isMobile ? 16 : 24 }}>
        <Result
          icon={<ShopOutlined />}
          title={t('sell.sellerRequired')}
          subTitle={t('sell.sellerRequiredHint')}
          extra={
            <Button type="primary" onClick={() => navigate('/profile')}>
              {t('createAuction.goToProfile')}
            </Button>
          }
        />
      </div>
    );
  }

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

  // ─── Build media array from uploaded images ─────────────────────
  const buildMediaArray = () => {
    const slotOrder = ['front', 'angle', 'back', 'detail'];
    const sorted = [...uploadedImages].sort((a, b) => {
      const aIdx = slotOrder.indexOf(a.slotId);
      const bIdx = slotOrder.indexOf(b.slotId);
      const aOrder = aIdx >= 0 ? aIdx : 100 + parseInt(a.slotId.split('-')[1] ?? '0');
      const bOrder = bIdx >= 0 ? bIdx : 100 + parseInt(b.slotId.split('-')[1] ?? '0');
      return aOrder - bOrder;
    });

    return sorted.map((img, idx) => ({
      mediaUploadId: img.mediaUploadId,
      isPrimary: idx === 0,
      sortOrder: idx,
    }));
  };

  // ─── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (uploadedImages.length === 0) {
      message.warning(t('sell.imagesRequired'));
      return;
    }

    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const response = await createAuction.mutateAsync({
        title: values.title,
        condition: values.condition,
        categoryId: values.categoryId || undefined,
        description: values.description || undefined,
        quantity: 1,
        media: buildMediaArray(),
        startingPrice: values.startingPrice,
        bidIncrement: values.bidIncrement,
        reservePrice: values.reservePrice || undefined,
        buyNowPrice: values.buyNowPrice || undefined,
        extensionMinutes: values.extensionMinutes ?? 5,
        currency: 'VND',
        auctionType: 'regular',
      });

      try {
        await submitItemForReview(response.itemId, values.verifyByPlatform);
      } catch {
        message.warning(t('sell.submitItemFailed'));
      }

      setResult({ auctionId: response.id, itemId: response.itemId });
      message.success(t('sell.submitSuccess'));
    } catch (err) {
      const errorMsg = axios.isAxiosError(err)
        ? (err.response?.data?.detail ?? err.response?.data?.title ?? t('common.error'))
        : t('common.error');
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── VND formatter/parser ─────────────────────────────────────────
  const vndFormatter = (value: number | undefined) =>
    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const vndParser = (value: string | undefined) =>
    Number(value?.replace(/\./g, '') ?? 0) as unknown as 0;

  // ─── Success screen ───────────────────────────────────────────────
  if (result) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? 16 : 24 }}>
        <Card>
          <Flex vertical align="center" gap={16} style={{ padding: 24 }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
            <Title level={4} style={{ margin: 0 }}>
              {t('sell.submittedTitle')}
            </Title>
            <Alert
              type="info"
              showIcon
              message={t('sell.submittedMessage')}
              description={t('sell.submittedHint')}
            />
            <Flex gap={12} wrap="wrap" justify="center">
              <Button type="primary" onClick={() => navigate('/my-listings')}>
                {t('sell.goToListings')}
              </Button>
              <Button
                onClick={() => {
                  setUploadedImages([]);
                  setResult(null);
                  form.resetFields();
                }}
              >
                {t('sell.createAnother')}
              </Button>
            </Flex>
          </Flex>
        </Card>
      </div>
    );
  }

  // ─── Main form ────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? 16 : 24 }}>
      <Button type="link" onClick={() => navigate('/my-listings')} style={{ padding: 0, marginBottom: 8 }}>
        ← {t('sell.backToDashboard')}
      </Button>
      <Title level={3}>{t('sell.title')}</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        {t('sell.subtitle')}
      </Text>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          autoExtend: true,
          extensionMinutes: 5,
          bidIncrement: 100_000,
          verifyByPlatform: false,
        }}
      >
        {/* ─── Section 1: Item Info ─────────────────────────────── */}
        <Card style={{ marginBottom: 24 }}>
          <Title level={5}>{t('sell.stepItemInfo')}</Title>

          <Form.Item
            name="title"
            label={t('sell.itemTitle')}
            rules={[{ required: true, message: t('createItem.titleRequired') }]}
          >
            <Input
              placeholder={t('createItem.titlePlaceholder')}
              maxLength={255}
              showCount
            />
          </Form.Item>

          <Flex gap={16} wrap="wrap">
            {categoryOptions.length > 0 && (
              <Form.Item
                name="categoryId"
                label={t('sell.category')}
                style={{ flex: 1, minWidth: 200 }}
              >
                <Select
                  placeholder={t('sell.categoryPlaceholder')}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={categoryOptions}
                />
              </Form.Item>
            )}

            <Form.Item
              name="condition"
              label={t('sell.condition')}
              rules={[{ required: true, message: t('createItem.conditionRequired') }]}
              style={{ flex: 1, minWidth: 200 }}
            >
              <Select placeholder={t('createItem.conditionPlaceholder')}>
                {CONDITION_OPTIONS.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Flex>

          <Form.Item
            name="description"
            label={t('sell.description')}
          >
            <TextArea
              rows={4}
              placeholder={t('createItem.descriptionPlaceholder')}
              maxLength={2000}
              showCount
            />
          </Form.Item>
        </Card>

        {/* ─── Section 2: Images ───────────────────────────────── */}
        <Card style={{ marginBottom: 24 }}>
          <Title level={5}>{t('sell.stepImages')}</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            {t('sell.imageGuideHint')}
          </Text>
          <GuidedImageUpload
            images={uploadedImages}
            onChange={setUploadedImages}
          />
        </Card>

        {/* ─── Section 3: Pricing ──────────────────────────────── */}
        <Card style={{ marginBottom: 24 }}>
          <Title level={5}>{t('sell.stepPricing')}</Title>

          <Flex gap={16} wrap="wrap">
            <Form.Item
              name="startingPrice"
              label={t('sell.startingPrice')}
              rules={[
                { required: true, message: t('createAuction.startingPriceRequired') },
                { type: 'number', min: 1000, message: t('createAuction.priceMinimum') },
              ]}
              style={{ flex: 1, minWidth: 200 }}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={100_000}
                formatter={vndFormatter}
                parser={vndParser}
                addonAfter="₫"
                placeholder="0"
              />
            </Form.Item>

            <Form.Item
              name="buyNowPrice"
              label={t('sell.buyNowPrice')}
              tooltip={t('createAuction.buyNowPriceHint')}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value) return Promise.resolve();
                    const starting = getFieldValue('startingPrice') as number;
                    if (starting && value < starting) {
                      return Promise.reject(t('createAuction.buyNowPriceTooLow'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
              style={{ flex: 1, minWidth: 200 }}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={100_000}
                formatter={vndFormatter}
                parser={vndParser}
                addonAfter="₫"
                placeholder="0"
              />
            </Form.Item>
          </Flex>

          <Flex gap={16} wrap="wrap">
            <Form.Item
              name="bidIncrement"
              label={t('sell.bidIncrement')}
              rules={[
                { required: true, message: t('createAuction.bidIncrementRequired') },
                { type: 'number', min: 1000, message: t('createAuction.priceMinimum') },
              ]}
              style={{ flex: 1, minWidth: 200 }}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={50_000}
                formatter={vndFormatter}
                parser={vndParser}
                addonAfter="₫"
                placeholder="100.000"
              />
            </Form.Item>

            <Form.Item
              name="reservePrice"
              label={t('sell.reservePrice')}
              tooltip={t('createAuction.reservePriceHint')}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value) return Promise.resolve();
                    const starting = getFieldValue('startingPrice') as number;
                    if (starting && value < starting) {
                      return Promise.reject(t('createAuction.reservePriceTooLow'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
              style={{ flex: 1, minWidth: 200 }}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={100_000}
                formatter={vndFormatter}
                parser={vndParser}
                addonAfter="₫"
                placeholder={t('createAuction.optional')}
              />
            </Form.Item>
          </Flex>

          <Divider style={{ margin: '12px 0' }} />

          {/* Platform Verification toggle */}
          <Card
            size="small"
            style={{ marginBottom: 16, background: '#141414', border: '1px solid #303030' }}
          >
            <Flex justify="space-between" align="center">
              <div>
                <Text strong>{t('sell.platformVerification')}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('sell.platformVerificationHint')}
                </Text>
              </div>
              <Form.Item name="verifyByPlatform" valuePropName="checked" style={{ margin: 0 }}>
                <Switch />
              </Form.Item>
            </Flex>
          </Card>

          {/* Anti-sniping */}
          <Collapse
            ghost
            items={[
              {
                key: 'advanced',
                label: t('sell.advancedSettings'),
                children: (
                  <>
                    <Flex gap={16} align="center" style={{ marginBottom: 16 }}>
                      <Form.Item name="autoExtend" valuePropName="checked" style={{ margin: 0 }}>
                        <Switch />
                      </Form.Item>
                      <div>
                        <Text strong>{t('createAuction.autoExtend')}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t('createAuction.autoExtendHint')}
                        </Text>
                      </div>
                    </Flex>

                    <Form.Item
                      noStyle
                      shouldUpdate={(prev, cur) => prev.autoExtend !== cur.autoExtend}
                    >
                      {({ getFieldValue }) =>
                        getFieldValue('autoExtend') ? (
                          <Form.Item
                            name="extensionMinutes"
                            label={t('createAuction.extensionMinutes')}
                            rules={[
                              { required: true, message: t('createAuction.extensionMinutesRequired') },
                              { type: 'number', min: 1, max: 30, message: t('createAuction.extensionMinutesRange') },
                            ]}
                          >
                            <InputNumber
                              min={1}
                              max={30}
                              style={{ width: 200 }}
                              addonAfter={t('createAuction.minutes')}
                            />
                          </Form.Item>
                        ) : null
                      }
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />
        </Card>
      </Form>

      {/* ─── Submit button ───────────────────────────────────────── */}
      <Flex justify="flex-end">
        <Button
          type="primary"
          size="large"
          icon={<RocketOutlined />}
          onClick={handleSubmit}
          loading={submitting}
        >
          {t('sell.submitForAuction')}
        </Button>
      </Flex>
    </div>
  );
}
