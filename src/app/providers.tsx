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

// ─── Ant Design Theme ────────────────────────────────────────────────
// Custom theme tokens to give the platform a branded look.
// These can be adjusted later to match the Figma design more closely.
const antdTheme = {
  token: {
    // Primary brand color — used for buttons, links, active states
    colorPrimary: '#1677ff',
    // Border radius — slightly rounded for modern feel
    borderRadius: 6,
    // Font family — system fonts for performance
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
};

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