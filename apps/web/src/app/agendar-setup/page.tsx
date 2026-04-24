'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AgendarSetupPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/app/settings/integrations?agendar=true')
  }, [router])

  return (
    <div className="min-h-screen bg-[#0d0d16] flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Redirecionando para o painel...</p>
      </div>
    </div>
  )
}
