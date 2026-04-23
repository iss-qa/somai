import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { Navbar } from '@/components/site/navbar'
import { Hero } from '@/components/site/hero'
import { Trusted } from '@/components/site/trusted'
import { Features } from '@/components/site/features'
import { HowItWorks } from '@/components/site/how-it-works'
import { AIShowcase } from '@/components/site/ai-showcase'
import { Plans } from '@/components/site/plans'
import { Testimonials } from '@/components/site/testimonials'
import { Faq } from '@/components/site/faq'
import { Cta } from '@/components/site/cta'
import { Footer } from '@/components/site/footer'
import { WhatsAppFab } from '@/components/site/whatsapp-fab'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'soma_ai_secret_key_2026',
)

export default async function HomePage() {
  const token = cookies().get('soma-token')?.value
  let authed = false
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET)
      authed = true
    } catch {
      // token invalido — segue para a landing
    }
  }
  // Importante: redirect() lanca NEXT_REDIRECT; nao pode ficar dentro do try/catch
  if (authed) redirect('/app/dashboard')

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only fixed top-3 left-3 z-[100] rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white"
      >
        Pular para o conteúdo
      </a>
      <Navbar />
      <main id="conteudo" className="relative">
        <Hero />
        <Trusted />
        <Features />
        <HowItWorks />
        <AIShowcase />
        <Plans />
        <Testimonials />
        <Faq />
        <Cta />
      </main>
      <Footer />
      <WhatsAppFab />
    </>
  )
}
