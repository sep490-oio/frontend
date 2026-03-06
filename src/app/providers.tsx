/**
 * App Providers — wraps the entire application with all required providers.
 *
 * Provider order matters — each provider wraps the ones below it:
 * 1. Redux Provider (state management — outermost because everything uses state)
 * 2. QueryClientProvider (TanStack Query — data fetching and caching)
 * 3. ConfigProvider (Ant Design — theme tokens and locale)
 * 4. App (Ant Design — enables static methods like message.success())
 * 5. BrowserRouter (React Router — routing)
 *
 * This pattern keeps main.tsx and App.tsx clean by centralizing
 * all provider setup in one file.
 */
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App as AntdApp } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import viVN from 'antd/locale/vi_VN';
import { store } from './store';
import { queryClient } from './queryClient';
import { antdTheme } from '../design-system/theme';


interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={antdTheme} locale={viVN}>
          <AntdApp>
            <BrowserRouter>{children}</BrowserRouter>
          </AntdApp>
        </ConfigProvider>
      </QueryClientProvider>
    </Provider>
  );
}
