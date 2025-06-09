import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import PasswordProtection from '@/components/PasswordProtection'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BidBoard Test Harness',
  description: 'Excel-driven prototype for testing project requirements',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <PasswordProtection>
          {children}
        </PasswordProtection>
      </body>
    </html>
  )
} 