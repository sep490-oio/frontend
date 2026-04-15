import React from 'react';
import type { CardProps as AntCardProps } from 'antd';
import { Card as AntCard } from 'antd';

export interface CardProps extends AntCardProps {
  // Bạn có thể mở rộng các props tùy chỉnh ở đây.
}

/**
 * Custom Wrapper cho Ant Design Card.
 * Bạn có thể định nghĩa shadow hoặc padding mặc định mà không cần truyền vào mỗi lần gọi.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ bordered = false, ...props }, ref) => {
    // Định nghĩa bordered = false mặc định vì hệ thống thiết kế hiện đại thường dùng shadow thay vì border.
    return <AntCard ref={ref} bordered={bordered} {...props} />;
  }
);

Card.displayName = 'Card';
