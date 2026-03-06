import type { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#000',
    borderRadius: 0,
    borderRadiusLG: 0,

    fontFamily:
      "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",

    colorBgLayout: '#F5F5F5',
    colorBgContainer: '#FFFFFF',

    colorText: '#000',
    colorTextSecondary: '#8c8c8c',

    controlHeight: 52,
  },

  components: {
    Button: {
      borderRadius: 0,
      controlHeight: 52,
    },
    Card: {
      borderRadiusLG: 0,
    },
    Input: {
      borderRadius: 0,
    },
  },
};