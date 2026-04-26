import type { ThemeConfig } from 'antd';

export const lightColors: ThemeConfig['token'] = {
  colorPrimary: '#137fec',
  colorBgBase: '#ccdbe8',
  colorBgContainer: 'rgba(255, 255, 255, 0.7)',
  colorBgLayout: '#ccdbe8',
  colorBgElevated: 'rgba(255, 255, 255, 0.85)',
  colorTextBase: '#1c1c1c',
  colorTextSecondary: '#64748B',
  colorBorder: '#E8E5DF',
  colorBorderSecondary: '#F7F5F0',
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
  colorBgBase: '#0d1b2e',
  colorBgContainer: 'rgba(17, 20, 27, 0.7)',
  colorBgLayout: '#0d1b2e',
  colorBgElevated: 'rgba(26, 31, 41, 0.85)',
  colorTextBase: '#F1F5F9',
  colorTextSecondary: '#94A3B8',
  colorBorder: '#1f242f',
  colorBorderSecondary: '#11141b',
  colorSuccess: '#5A9C6B',
  colorError: '#D4634E',
  colorLink: '#3494f8',
  colorLinkHover: '#137fec',
};
