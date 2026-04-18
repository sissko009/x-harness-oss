import type { Metadata } from 'next'
import './globals.css'
import AppShell from '@/components/app-shell'

export const metadata: Metadata = {
  title: 'X Harness',
  description: 'X account automation dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="bg-[var(--khq-bg)] text-[color:var(--khq-text)] antialiased">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  )
}
