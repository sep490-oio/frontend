import type { ThemeConfig } from 'antd';

export const lightComponents: ThemeConfig['components'] = {
  Button: {
    borderRadius: 8,
    borderRadiusLG: 8,
    primaryShadow: 'none',
    defaultBorderColor: '#E2E8F0',
    fontWeight: 500,
  },
  Card: {
    borderRadiusLG: 12,
    paddingLG: 24,
    // Note: If TypeScript complains about boxShadowTertiary, it usually lacks definition in some antd versions, 
    // casting to any if necessary, but leaving as is for pure layout
    boxShadowTertiary: '0 1px 2px rgba(15, 23, 42, 0.04)' as any,
  },
  Input: {
    borderRadius: 8,
    activeBorderColor: '#137fec',
    hoverBorderColor: '#137fec',
    activeShadow: '0 0 0 2px rgba(19, 127, 236, 0.1)',
  },
  InputNumber: {
    borderRadius: 8,
    activeBorderColor: '#137fec',
    hoverBorderColor: '#137fec',
  },
  Select: {
    borderRadius: 8,
  },
  Table: {
    borderRadius: 12,
    headerBg: '#F1F5F9',
    headerColor: '#64748B',
    rowHoverBg: '#F8FAFC',
    borderColor: '#F1F5F9',
  },
  Tabs: {
    inkBarColor: '#137fec',
    itemSelectedColor: '#0F172A',
    itemHoverColor: '#137fec',
  },
  Tag: {
    borderRadiusSM: 100,
  },
  Modal: {
    borderRadiusLG: 12,
  },
  Menu: {
    itemSelectedBg: 'rgba(19, 127, 236, 0.08)',
    itemSelectedColor: '#137fec',
    itemHoverBg: 'rgba(19, 127, 236, 0.04)',
  },
  Pagination: {
    borderRadius: 8,
    itemActiveBg: '#137fec',
  },
  Steps: {
    colorPrimary: '#137fec',
  },
  Descriptions: {
    labelBg: '#F1F5F9',
  },
  Notification: {
    borderRadiusLG: 12,
  },
  Message: {
    borderRadiusLG: 12,
  },
};

export const darkComponents: ThemeConfig['components'] = {
  ...lightComponents,
  Table: {
    ...(lightComponents.Table || {}),
    headerBg: '#1E293B',
    headerColor: '#94A3B8',
    rowHoverBg: '#1E293B',
    borderColor: '#334155',
  },
  Button: {
    ...(lightComponents.Button || {}),
    defaultBorderColor: '#334155',
  },
  Tabs: {
    ...(lightComponents.Tabs || {}),
    itemColor: '#94A3B8',
    itemSelectedColor: '#F1F5F9',
    itemHoverColor: '#3494f8',
  },
  Descriptions: {
    ...(lightComponents.Descriptions || {}),
    labelBg: '#1E293B',
  },
};
