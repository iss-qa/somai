'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { WifiOff } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

export default function SetupRequiredModal({ open, onClose }: Props) {
  const router = useRouter()

  function handleSetup() {
    onClose()
    router.push('/app/settings/integrations')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-[#0d0d1a] border border-white/10">
        <div className="p-2 space-y-5 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto">
            <WifiOff className="w-6 h-6 text-amber-400" />
          </div>

          <div>
            <h2 className="text-base font-bold text-white">Conta não conectada</h2>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
              Para agendar publicações, você precisa primeiro realizar o setup e conectar sua conta do Instagram/Facebook.
            </p>
          </div>

          <div className="space-y-2">
            <Button className="w-full bg-violet-600 hover:bg-violet-700" onClick={handleSetup}>
              Realizar setup e conectar
            </Button>
            <Button variant="outline" className="w-full" onClick={onClose}>
              Agora não
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
