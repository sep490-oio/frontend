import { Provider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ConfigProvider, App as AntApp } from 'antd'
import viVN from 'antd/locale/vi_VN'
import enUS from 'antd/locale/en_US'
import { useTranslation } from 'react-i18next'
import { store } from './store'
import { queryClient } from '@/lib/queryClient'
import { ThemeContext, useThemeProvider } from '@/hooks/useTheme'
import { UserHubProvider } from '@/features/user/contexts/UserHubContext'
import { lightTheme, darkTheme } from '@/theme'
import { useTimeSync } from '@/hooks/useTimeSync'
import '@/app/i18n'
import '@/styles/global.css'

function TimeSyncInitializer() {
  useTimeSync()
  return null
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const themeValue = useThemeProvider()
  const currentTheme = themeValue.isDark ? darkTheme : lightTheme
  const { i18n } = useTranslation()
  const antLocale = i18n.language === 'en' ? enUS : viVN

  return (
    <ThemeContext.Provider value={themeValue}>
      <Provider store={store}>
        <TimeSyncInitializer />
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
