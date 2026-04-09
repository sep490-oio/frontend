import DOMPurify, { type Config } from 'dompurify'

/**
 * Extract plain-text excerpt from an HTML string for use in compact previews.
 * Use only for compact previews; full descriptions must go through `SafeHtmlRenderer`.
 */
export function htmlToPlainTextExcerpt(
  html: string | null | undefined,
  maxLength = 160,
): string {
  if (!html) return ''
  let text: string
  if (typeof window === 'undefined') {
    // SSR / non-browser fallback: strip tags with regex
    text = html.replace(/<[^>]*>/g, ' ')
  } else {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    text = doc.body.textContent ?? ''
  }
  text = text.replace(/\s+/g, ' ').trim()
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + '\u2026'
  }
  return text
}

/**
 * Canonical renderer for HTML description fields.
 * Never `{item.description}` directly in JSX — use this for full content or
 * `htmlToPlainTextExcerpt` for previews.
 */
interface SafeHtmlRendererProps {
  html: string
  className?: string
  style?: React.CSSProperties
}

const PURIFY_CONFIG: Config = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'blockquote', 'pre', 'code', 'img', 'span', 'div', 'sub', 'sup'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'width', 'height', 'style', 'class'],
  ALLOW_DATA_ATTR: false,
}

export function SafeHtmlRenderer({ html, className, style }: SafeHtmlRendererProps) {
  const clean = DOMPurify.sanitize(html, PURIFY_CONFIG)

  return (
    <div
      className={`oio-safe-html ${className ?? ''}`}
      style={{
        fontSize: 14,
        lineHeight: 1.8,
        color: 'var(--color-text-secondary)',
        overflow: 'hidden',
        wordBreak: 'break-word',
        ...style,
      }}
    >
      <style>{`
        .oio-safe-html img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          display: block;
          margin: 8px 0;
        }
        .oio-safe-html pre,
        .oio-safe-html code {
          max-width: 100%;
          overflow-x: auto;
          word-break: break-all;
        }
        .oio-safe-html blockquote {
          margin: 8px 0;
          padding: 8px 16px;
          border-left: 3px solid var(--color-border);
          color: var(--color-text-secondary);
        }
        .oio-safe-html a {
          color: var(--color-accent);
          word-break: break-all;
        }
        .oio-safe-html p {
          margin: 0 0 8px;
        }
        .oio-safe-html h1, .oio-safe-html h2, .oio-safe-html h3, .oio-safe-html h4 {
          margin: 16px 0 8px;
          color: var(--color-text-primary);
        }
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: clean }} />
    </div>
  )
}
