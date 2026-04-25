'use client'

import { UpgradeProModal } from '@/components/v2/UpgradeProModal'
import { TopSteps } from './components/WizardChrome'
import { StepTipo } from './components/StepTipo'
import { StepModo } from './components/StepModo'
import { StepFormato } from './components/StepFormato'
import { StepBriefing } from './components/StepBriefing'
import { StepCriar } from './components/StepCriar'
import { IdeiaDialog } from './components/IdeiaDialog'
import { InspiracaoModal } from './components/InspiracaoModal'
import { GeracaoLoading } from './components/GeracaoLoading'
import { useCriarWizard } from './hooks/useCriarWizard'

export default function CriarV2Page() {
  const w = useCriarWizard()

  return (
    <div className="mx-auto max-w-5xl">
      <TopSteps step={w.step} onGoTo={(s) => w.setStep(s)} />

      {w.step === 'tipo' && <StepTipo w={w} />}
      {w.step === 'modo' && <StepModo w={w} />}
      {w.step === 'formato' && <StepFormato w={w} />}
      {w.step === 'briefing' && <StepBriefing w={w} />}
      {w.step === 'criar' && <StepCriar w={w} />}

      <IdeiaDialog w={w} />
      <InspiracaoModal w={w} />

      <UpgradeProModal
        open={w.showUpgrade}
        onClose={() => w.setShowUpgrade(false)}
      />

      <GeracaoLoading visible={w.gerandoImagem} />
    </div>
  )
}
