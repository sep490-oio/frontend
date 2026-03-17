/**
 * Application Entry Point.
 *
 * Initializes i18n before rendering the app.
 * StrictMode helps catch potential issues during development
 * (double-renders in dev to detect side effects).
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import "./styles/index.scss";

// Initialize i18n — must be imported before any component that uses useTranslation()
import './services/i18n';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
