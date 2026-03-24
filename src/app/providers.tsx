import { Provider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ConfigProvider, App as AntApp, theme as antTheme } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { store } from './store'
import { queryClient } from '@/lib/queryClient'
import { ThemeContext, useThemeProvider } from '@/hooks/useTheme'
import '@/app/i18n'
import '@/styles/global.css'

const lightTheme = {
  token: {
    // Colors — Warm Ivory palette
    colorPrimary: '#8B7355',
    colorBgBase: '#FAFAF7',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#FAFAF7',
    colorBgElevated: '#FFFFFF',
    colorTextBase: '#1A1A1A',
    colorTextSecondary: '#6B6560',
    colorBorder: '#E8E5DF',
    colorBorderSecondary: '#F0EFEB',
    colorSuccess: '#4A7C59',
    colorError: '#C4513D',
    colorWarning: '#C4923D',
    colorInfo: '#8B7355',

    // Typography
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    fontSizeHeading1: 36,
    fontSizeHeading2: 28,
    fontSizeHeading3: 22,
    fontSizeHeading4: 18,
    fontSizeHeading5: 16,

    // Shape — minimal radius
    borderRadius: 2,
    borderRadiusLG: 4,
    borderRadiusSM: 2,

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
    boxShadow: '0 1px 2px rgba(26, 26, 26, 0.04)',
    boxShadowSecondary: '0 4px 12px rgba(26, 26, 26, 0.06)',

    // Link
    colorLink: '#8B7355',
    colorLinkHover: '#7A6548',
    colorLinkActive: '#6A5638',
  },
  components: {
    Button: {
      borderRadius: 2,
      borderRadiusLG: 2,
      primaryShadow: 'none',
      defaultBorderColor: '#E8E5DF',
      fontWeight: 500,
    },
    Card: {
      borderRadiusLG: 4,
      paddingLG: 24,
      boxShadowTertiary: '0 1px 2px rgba(26, 26, 26, 0.04)',
    },
    Input: {
      borderRadius: 2,
      activeBorderColor: '#8B7355',
      hoverBorderColor: '#8B7355',
      activeShadow: '0 0 0 2px rgba(139, 115, 85, 0.1)',
    },
    InputNumber: {
      borderRadius: 2,
      activeBorderColor: '#8B7355',
      hoverBorderColor: '#8B7355',
    },
    Select: {
      borderRadius: 2,
    },
    Table: {
      borderRadius: 4,
      headerBg: '#F5F4F0',
      headerColor: '#6B6560',
      rowHoverBg: '#FAFAF7',
      borderColor: '#F0EFEB',
    },
    Tabs: {
      inkBarColor: '#8B7355',
      itemSelectedColor: '#1A1A1A',
      itemHoverColor: '#8B7355',
    },
    Tag: {
      borderRadiusSM: 100,
    },
    Modal: {
      borderRadiusLG: 4,
    },
    Menu: {
      itemSelectedBg: 'rgba(139, 115, 85, 0.08)',
      itemSelectedColor: '#8B7355',
      itemHoverBg: 'rgba(139, 115, 85, 0.04)',
    },
    Pagination: {
      borderRadius: 2,
      itemActiveBg: '#8B7355',
    },
    Steps: {
      colorPrimary: '#8B7355',
    },
    Descriptions: {
      labelBg: '#F5F4F0',
    },
    Notification: {
      borderRadiusLG: 4,
    },
    Message: {
      borderRadiusLG: 4,
    },
  },
  algorithm: antTheme.defaultAlgorithm,
}

const darkTheme = {
  ...lightTheme,
  token: {
    ...lightTheme.token,
    colorPrimary: '#C5A572',
    colorBgBase: '#0F0F0F',
    colorBgContainer: '#242424',
    colorBgLayout: '#0F0F0F',
    colorBgElevated: '#2A2A2A',
    colorTextBase: '#F5F0EB',
    colorTextSecondary: '#9A9590',
    colorBorder: '#2E2E2E',
    colorBorderSecondary: '#363636',
    colorSuccess: '#5A9C6B',
    colorError: '#D4634E',
    colorLink: '#C5A572',
    colorLinkHover: '#B89560',
  },
  components: {
    ...lightTheme.components,
    Table: {
      ...lightTheme.components.Table,
      headerBg: '#1A1A1A',
      headerColor: '#9A9590',
      rowHoverBg: '#1A1A1A',
      borderColor: '#2E2E2E',
    },
    Button: {
      ...lightTheme.components.Button,
      defaultBorderColor: '#2E2E2E',
    },
    Descriptions: {
      labelBg: '#1A1A1A',
    },
  },
  algorithm: antTheme.darkAlgorithm,
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const themeValue = useThemeProvider()
  const currentTheme = themeValue.isDark ? darkTheme : lightTheme

  return (
    <ThemeContext.Provider value={themeValue}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider locale={viVN} theme={currentTheme}>
            <AntApp>
              {children}
            </AntApp>
          </ConfigProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </Provider>
    </ThemeContext.Provider>
  )
}
