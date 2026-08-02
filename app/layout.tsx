import "@/lib/server-polyfill"
import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { getSiteUrl } from './site-url'
import './globals.css'

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: '--font-poppins'
})

const siteUrl = getSiteUrl()
const siteName = 'HIMA D3 Sistem Informasi UPNVJ - Kabinet Vidyakatra'
const siteDescription =
  'Website resmi Himpunan Mahasiswa D3 Sistem Informasi UPN "Veteran" Jakarta Kabinet Vidyakatra.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    'HIMA D3 Sistem Informasi UPNVJ',
    'Kabinet Vidyakatra',
    'Himpunan Mahasiswa D3 Sistem Informasi',
    'UPN Veteran Jakarta',
    'D3 Sistem Informasi',
    'organisasi mahasiswa teknologi',
  ],
  authors: [{ name: 'HIMA D3 Sistem Informasi UPNVJ' }],
  creator: 'HIMA D3 Sistem Informasi UPNVJ',
  publisher: 'HIMA D3 Sistem Informasi UPNVJ',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: '/',
    siteName,
    title: siteName,
    description: siteDescription,
  },
  twitter: {
    card: 'summary',
    title: siteName,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className="bg-background">
      <body className={`${poppins.variable} font-sans font-medium antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
