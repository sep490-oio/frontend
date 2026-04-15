import type { ThemeConfig } from 'antd';

export const baseTokens: ThemeConfig['token'] = {
  // Shape
  borderRadius: 8,
  borderRadiusLG: 12,
  borderRadiusSM: 4,

  // Sizing
  controlHeight: 44,
  controlHeightLG: 52,
  controlHeightSM: 32,

  // Spacing
  padding: 16,
  paddingLG: 24,
  paddingXL: 32,
  margin: 16,
  marginLG: 24,
  marginXL: 32,

  // Shadows
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
  boxShadowSecondary: '0 4px 12px rgba(15, 23, 42, 0.06)',
};
