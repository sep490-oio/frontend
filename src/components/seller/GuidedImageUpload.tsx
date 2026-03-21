/**
 * GuidedImageUpload — Camera-guided image upload matching Figma design.
 *
 * Shows labeled upload slots for specific photo angles:
 * - Góc chính diện (Front view)
 * - Góc nghiêng 45° (45-degree angle)
 * - Mặt sau (Back view)
 * - Chi tiết / Seri (Detail / Serial number)
 * - + Additional images
 *
 * Uses existing mediaService.uploadMedia() for Cloudinary signed upload.
 * First uploaded image becomes isPrimary.
 */

import { useState } from 'react';
import {
  Typography,
  Upload,
  Button,
  Flex,
  Image,
  message,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CameraOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { mediaService } from '@/services/mediaService';
import type { MediaUploadResult } from '@/services/mediaService';

const { Text } = Typography;

/** Tracks each uploaded image with its BE metadata and slot assignment */
export interface UploadedImage {
  mediaUploadId: string;
  publicId: string;
  secureUrl: string;
  slotId: string; // which slot this image belongs to ('front', 'angle', 'back', 'detail', 'extra-N')
}

/** Predefined photo slots matching Figma design */
const GUIDED_SLOTS = [
  { id: 'front', labelKey: 'sell.guideFront' },
  { id: 'angle', labelKey: 'sell.guideAngle' },
  { id: 'back', labelKey: 'sell.guideBack' },
  { id: 'detail', labelKey: 'sell.guideDetail' },
] as const;

interface GuidedImageUploadProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
}

export function GuidedImageUpload({ images, onChange }: GuidedImageUploadProps) {
  const { t } = useTranslation();
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  const handleUpload = async (file: File, slotId: string) => {
    setUploadingSlot(slotId);
    try {
      const result: MediaUploadResult = await mediaService.uploadMedia(file, 'item_image');
      const newImage: UploadedImage = {
        mediaUploadId: result.mediaUploadId,
        publicId: result.publicId,
        secureUrl: result.secureUrl,
        slotId,
      };
      // Replace existing image in slot, or add new
      const existing = images.filter((img) => img.slotId !== slotId);
      onChange([...existing, newImage]);
      message.success(t('sell.uploadSuccess'));
    } catch {
      message.error(t('sell.uploadFailed'));
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleRemove = (slotId: string) => {
    onChange(images.filter((img) => img.slotId !== slotId));
  };

  const handleAddExtra = async (file: File) => {
    const extraCount = images.filter((img) => img.slotId.startsWith('extra-')).length;
    const slotId = `extra-${extraCount}`;
    await handleUpload(file, slotId);
  };

  const getImageForSlot = (slotId: string) =>
    images.find((img) => img.slotId === slotId);

  const extraImages = images.filter((img) => img.slotId.startsWith('extra-'));

  return (
    <div>
      {/* Guided slots grid — 2x2 */}
      <Flex wrap="wrap" gap={12} style={{ marginBottom: 16 }}>
        {GUIDED_SLOTS.map((slot) => {
          const img = getImageForSlot(slot.id);
          const isUploading = uploadingSlot === slot.id;

          return (
            <div
              key={slot.id}
              style={{
                width: 'calc(50% - 6px)',
                minWidth: 140,
                aspectRatio: '1',
                border: img ? '2px solid #1677ff' : '2px dashed #404040',
                borderRadius: 8,
                overflow: 'hidden',
                position: 'relative',
                background: '#141414',
              }}
            >
              {img ? (
                <>
                  <Image
                    src={img.secureUrl}
                    width="100%"
                    height="100%"
                    style={{ objectFit: 'cover' }}
                    preview={{ mask: false }}
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemove(slot.id)}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      textAlign: 'center',
                      fontSize: 12,
                      padding: '2px 0',
                    }}
                  >
                    {t(slot.labelKey)}
                  </div>
                </>
              ) : (
                <Upload
                  beforeUpload={(file) => {
                    handleUpload(file, slot.id);
                    return false;
                  }}
                  showUploadList={false}
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isUploading}
                >
                  <Flex
                    vertical
                    align="center"
                    justify="center"
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: 120,
                      cursor: 'pointer',
                      padding: 8,
                    }}
                  >
                    {isUploading ? (
                      <Spin />
                    ) : (
                      <>
                        <CameraOutlined style={{ fontSize: 24, color: '#666', marginBottom: 4 }} />
                        <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
                          {t(slot.labelKey)}
                        </Text>
                      </>
                    )}
                  </Flex>
                </Upload>
              )}
            </div>
          );
        })}
      </Flex>

      {/* Extra images row */}
      {extraImages.length > 0 && (
        <Flex wrap="wrap" gap={8} style={{ marginBottom: 12 }}>
          {extraImages.map((img) => (
            <div
              key={img.slotId}
              style={{
                position: 'relative',
                width: 80,
                height: 80,
                border: '1px solid #404040',
                borderRadius: 6,
                overflow: 'hidden',
              }}
            >
              <Image
                src={img.secureUrl}
                width={80}
                height={80}
                style={{ objectFit: 'cover' }}
                preview={{ mask: false }}
              />
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemove(img.slotId)}
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  padding: '0 4px',
                }}
              />
            </div>
          ))}
        </Flex>
      )}

      {/* Add more button */}
      <Upload
        beforeUpload={(file) => {
          handleAddExtra(file);
          return false;
        }}
        showUploadList={false}
        accept="image/jpeg,image/png,image/webp"
        multiple
      >
        <Button
          icon={<PlusOutlined />}
          loading={uploadingSlot?.startsWith('extra-')}
        >
          {t('sell.addMoreImages')}
        </Button>
      </Upload>

      <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
        {t('sell.imageHint')}
      </Text>
    </div>
  );
}
