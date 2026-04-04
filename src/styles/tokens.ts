/**
 * Design tokens — TypeScript enforcement layer for CSS custom properties.
 * Source of truth: src/styles/global.css
 *
 * Use these constants instead of redeclaring font/color strings locally.
 */

// ── Fonts ────────────────────────────────────────────────────────────
export const SERIF_FONT = "'Noto Serif', Georgia, 'Times New Roman', serif"
export const SANS_FONT = "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
export const MONO_FONT = "'JetBrains Mono', 'Fira Code', monospace"

// ── Content Width Tiers ──────────────────────────────────────────────
export const CONTENT_SM = 600
export const CONTENT_MD = 800
export const CONTENT_LG = 1200
