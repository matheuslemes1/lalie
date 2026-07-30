import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Laliê Papelaria — Painel Administrativo',
    template: '%s | Laliê Admin',
  },
  description: 'Painel administrativo interno da Laliê Papelaria para controle de gastos, estoque e geração de orçamentos.',
  robots: { index: false, follow: false }, // Painel interno — não indexar
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
