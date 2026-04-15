import React from 'react';
import { Flex, Typography } from 'antd';

const { Title, Text } = Typography;

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  extra?: React.ReactNode;
}

/**
 * Component chuẩn hóa phần Header cho tất cả các trang Admin / User Dashboard.
 * Đảm bảo các trang luôn có chung cấu trúc "Tiêu đề nằm trái, Nút thao tác nằm phải".
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, extra }) => {
  return (
    <Flex justify="space-between" align="flex-start" style={{ marginBottom: 24 }}>
      <Flex vertical gap={4}>
        <Title level={4} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a' }}>
          {title}
        </Title>
        {subtitle && <Text type="secondary" style={{ fontSize: 14, color: '#64748b' }}>{subtitle}</Text>}
      </Flex>
      {extra && (
        <Flex gap={12} align="center">
          {extra}
        </Flex>
      )}
    </Flex>
  );
};
