import Link from 'next/link'

const NAV = [
  {
    group: 'Guide',
    items: [
      { label: 'Getting started', href: '/docs' },
    ],
  },
  {
    group: 'Reference',
    items: [
      { label: 'API reference', href: '/docs/api' },
    ],
  },
]

function Header() {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      height: 52,
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        maxWidth: 1100, width: '100%', margin: '0 auto', padding: '0 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Link href="/" style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', letterSpacing: '-0.02em', textDecoration: 'none' }}>
            gengen
          </Link>
          <span style={{ color: 'var(--border)', fontSize: '1.25rem', lineHeight: 1 }}>/</span>
          <Link href="/docs" style={{ fontSize: '0.875rem', color: 'var(--muted)', textDecoration: 'none' }}>docs</Link>
        </div>
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/docs/api" style={{ fontSize: '0.875rem', color: 'var(--muted)', textDecoration: 'none' }}>API</Link>
          <a href="https://github.com/moeki0/gengen" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '0.875rem', color: 'var(--muted)', textDecoration: 'none' }}>
            GitHub
          </a>
        </nav>
      </div>
    </header>
  )
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="docs-layout" style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 2rem',
        display: 'flex', gap: '3.5rem', alignItems: 'flex-start',
      }}>
        {/* Sidebar */}
        <aside className="docs-sidebar" style={{
          width: 190, flexShrink: 0,
          position: 'sticky', top: 72,
          paddingTop: '2.5rem', paddingBottom: '2rem',
        }}>
          {NAV.map(section => (
            <div key={section.group} style={{ marginBottom: '1.75rem' }}>
              <div style={{
                fontSize: '0.625rem', fontWeight: 800, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--muted)',
                marginBottom: '0.5rem',
              }}>
                {section.group}
              </div>
              <ul style={{ listStyle: 'none' }}>
                {section.items.map(item => (
                  <li key={item.href}>
                    <Link href={item.href} style={{
                      display: 'block',
                      fontSize: '0.875rem', fontWeight: 500,
                      color: 'var(--text)',
                      padding: '0.3rem 0',
                      textDecoration: 'none',
                    }}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0, paddingTop: '2.5rem', paddingBottom: '5rem' }}>
          {children}
        </main>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .docs-layout { flex-direction: column !important; gap: 0 !important; padding: 0 1.25rem !important; }
          .docs-sidebar { position: static !important; width: 100% !important; padding-top: 1.5rem !important; padding-bottom: 0.5rem !important; border-bottom: 1px solid var(--border); }
          .docs-sidebar ul { display: flex; flex-wrap: wrap; gap: 0.25rem 1.25rem; }
        }
      `}</style>
    </>
  )
}
