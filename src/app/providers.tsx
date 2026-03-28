import { Provider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ConfigProvider, App as AntApp, theme as antTheme } from 'antd'
import viVN from 'antd/locale/vi_VN'
import enUS from 'antd/locale/en_US'
import { useTranslation } from 'react-i18next'
import { store } from './store'
import { queryClient } from '@/lib/queryClient'
import { ThemeContext, useThemeProvider } from '@/hooks/useTheme'
import { UserHubProvider } from '@/features/user/contexts/UserHubContext'
import '@/app/i18n'
import '@/styles/global.css'

const lightTheme = {
  token: {
    // Colors — Blue Slate palette
    colorPrimary: '#2563EB',
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
    colorInfo: '#2563EB',

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
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
    boxShadowSecondary: '0 4px 12px rgba(15, 23, 42, 0.06)',

    // Link
    colorLink: '#2563EB',
    colorLinkHover: '#1D4ED8',
    colorLinkActive: '#1E40AF',
  },
  components: {
    Button: {
      borderRadius: 2,
      borderRadiusLG: 2,
      primaryShadow: 'none',
      defaultBorderColor: '#E2E8F0',
      fontWeight: 500,
    },
    Card: {
      borderRadiusLG: 4,
      paddingLG: 24,
      boxShadowTertiary: '0 1px 2px rgba(15, 23, 42, 0.04)',
    },
    Input: {
      borderRadius: 2,
      activeBorderColor: '#2563EB',
      hoverBorderColor: '#2563EB',
      activeShadow: '0 0 0 2px rgba(37, 99, 235, 0.1)',
    },
    InputNumber: {
      borderRadius: 2,
      activeBorderColor: '#2563EB',
      hoverBorderColor: '#2563EB',
    },
    Select: {
      borderRadius: 2,
    },
    Table: {
      borderRadius: 4,
      headerBg: '#F1F5F9',
      headerColor: '#64748B',
      rowHoverBg: '#F8FAFC',
      borderColor: '#F1F5F9',
    },
    Tabs: {
      inkBarColor: '#2563EB',
      itemSelectedColor: '#0F172A',
      itemHoverColor: '#2563EB',
    },
    Tag: {
      borderRadiusSM: 100,
    },
    Modal: {
      borderRadiusLG: 4,
    },
    Menu: {
      itemSelectedBg: 'rgba(37, 99, 235, 0.08)',
      itemSelectedColor: '#2563EB',
      itemHoverBg: 'rgba(37, 99, 235, 0.04)',
    },
    Pagination: {
      borderRadius: 2,
      itemActiveBg: '#2563EB',
    },
    Steps: {
      colorPrimary: '#2563EB',
    },
    Descriptions: {
      labelBg: '#F1F5F9',
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
    colorPrimary: '#3B82F6',
    colorBgBase: '#0F172A',
    colorBgContainer: '#1E293B',
    colorBgLayout: '#0F172A',
    colorBgElevated: '#334155',
    colorTextBase: '#F1F5F9',
    colorTextSecondary: '#94A3B8',
    colorBorder: '#334155',
    colorBorderSecondary: '#1E293B',
    colorSuccess: '#5A9C6B',
    colorError: '#D4634E',
    colorLink: '#3B82F6',
    colorLinkHover: '#2563EB',
  },
  components: {
    ...lightTheme.components,
    Table: {
      ...lightTheme.components.Table,
      headerBg: '#1E293B',
      headerColor: '#94A3B8',
      rowHoverBg: '#1E293B',
      borderColor: '#334155',
    },
    Button: {
      ...lightTheme.components.Button,
      defaultBorderColor: '#334155',
    },
    Tabs: {
      ...lightTheme.components.Tabs,
      itemColor: '#94A3B8',
      itemSelectedColor: '#F1F5F9',
      itemHoverColor: '#3B82F6',
    },
    Descriptions: {
      labelBg: '#1E293B',
    },
  },
  algorithm: antTheme.darkAlgorithm,
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const themeValue = useThemeProvider()
  const currentTheme = themeValue.isDark ? darkTheme : lightTheme
  const { i18n } = useTranslation()
  const antLocale = i18n.language === 'en' ? enUS : viVN

  return (
    <ThemeContext.Provider value={themeValue}>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider locale={antLocale} theme={currentTheme}>
            <AntApp>
              <UserHubProvider>
                {children}
              </UserHubProvider>
            </AntApp>
          </ConfigProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </Provider>
    </ThemeContext.Provider>
  )
}
