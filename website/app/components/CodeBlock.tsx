import { codeToHtml } from 'shiki'

interface Props {
  code: string
  lang?: string
  style?: React.CSSProperties
  wrap?: boolean
}

export async function CodeBlock({ code, lang = 'typescript', style, wrap }: Props) {
  const html = await codeToHtml(code.trim(), {
    lang,
    theme: 'tokyo-night',
    transformers: [],
  })

  // tokyo-night outputs <pre style="background-color:#1a1b26">
  // Override background to match our design token
  let patched = html.replace(
    /background-color:[^;"]*/,
    'background-color:var(--code-bg, #0e0e1c)',
  )

  if (wrap) {
    patched = patched.replace(
      /(<pre [^>]*?)style="([^"]*)"([^>]*>)/,
      (_, before, existing, after) =>
        `${before}style="${existing};white-space:pre-wrap;word-break:break-word"${after}`,
    )
  }

  return (
    <div
      className="shiki-wrapper"
      style={{ borderRadius: 12, overflow: 'hidden', ...style }}
      dangerouslySetInnerHTML={{ __html: patched }}
    />
  )
}
