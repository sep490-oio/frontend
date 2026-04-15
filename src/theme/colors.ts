import type { ThemeConfig } from 'antd';

export const lightColors: ThemeConfig['token'] = {
  colorPrimary: '#137fec',
  colorBgBase: '#F8FAFC',
  colorBgContainer: '#FFFFFF',
  colorBgLayout: '#F8FAFC',
  colorBgElevated: '#FFFFFF',
  colorTextBase: '#0F172A',
  colorTextSecondary: '#64748B',
  colorBorder: '#E2E8F0',
  colorBorderSecondary: '#F1F5F9',
  colorSuccess: '#4A7C59',
  colorError: '#C4513D',
  colorWarning: '#C4923D',
  colorInfo: '#137fec',
  colorLink: '#137fec',
  colorLinkHover: '#106bc7',
  colorLinkActive: '#0c5299',
};

export const darkColors: ThemeConfig['token'] = {
  ...lightColors,
  colorPrimary: '#3494f8',
  colorBgBase: '#05070a',
  colorBgContainer: '#11141b',
  colorBgLayout: '#05070a',
  colorBgElevated: '#1a1f29',
  colorTextBase: '#F1F5F9',
  colorTextSecondary: '#94A3B8',
  colorBorder: '#1f242f',
  colorBorderSecondary: '#11141b',
  colorSuccess: '#5A9C6B',
  colorError: '#D4634E',
  colorLink: '#3494f8',
  colorLinkHover: '#137fec',
};
