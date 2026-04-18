import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'gengen', template: '%s — gengen' },
  description: 'Schema-driven rendering for LLM Markdown output',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
