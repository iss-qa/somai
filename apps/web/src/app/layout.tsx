import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { SITE } from '@/lib/utils'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['200', '300', '400', '500', '600', '700', '800'],
})

export const viewport: Viewport = {
  themeColor: '#07070c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'dark',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} · ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    'marketing digital com IA',
    'automação de redes sociais',
    'Instagram automático',
    'Facebook automático',
    'gerador de posts com IA',
    'agência de marketing automatizada',
    'marketing para pequenas empresas',
    'WhatsApp marketing',
    'Meta Ads automático',
    'Soma.AI',
  ],
  authors: [{ name: 'Soma.AI' }],
  creator: 'Soma.AI',
  publisher: 'Soma.AI',
  applicationName: SITE.name,
  category: 'Marketing',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  icons: { icon: '/favicon.svg' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
      logo: `${SITE.url}/favicon.svg`,
    },
    {
      '@type': 'SoftwareApplication',
      name: SITE.name,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: [
        { '@type': 'Offer', name: 'Starter', price: '29.90', priceCurrency: 'BRL' },
        { '@type': 'Offer', name: 'Pro', price: '50.00', priceCurrency: 'BRL' },
        { '@type': 'Offer', name: 'Enterprise', price: '69.90', priceCurrency: 'BRL' },
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '128',
      },
    },
    {
      '@type': 'WebSite',
      url: SITE.url,
      name: SITE.name,
      inLanguage: 'pt-BR',
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} dark`}>
      <body className="font-sans antialiased bg-brand-dark text-foreground">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#111119',
              color: '#fafafa',
              border: '1px solid #27272a',
              borderRadius: '0.75rem',
            },
            success: {
              iconTheme: {
                primary: '#8B5CF6',
                secondary: '#fafafa',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fafafa',
              },
            },
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  )
}
