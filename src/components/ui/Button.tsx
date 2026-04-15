import React from 'react';
import type { ButtonProps as AntButtonProps } from 'antd';
import { Button as AntButton } from 'antd';

export interface ButtonProps extends AntButtonProps {
  // Bạn có thể mở rộng các props tùy chỉnh ở đây.
  // Ví dụ: trackedEventName?: string;
}

/**
 * Custom Wrapper cho Ant Design Button.
 * Sử dụng component này thay vì import trực tiếp từ 'antd' để đảm bảo
 * tính đồng nhất của hệ thống và dễ dàng thay đổi thư viện UI trong tương lai nếu cần.
 */
export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (props, ref) => {
    return <AntButton ref={ref} {...props} />;
  }
);

Button.displayName = 'Button';
