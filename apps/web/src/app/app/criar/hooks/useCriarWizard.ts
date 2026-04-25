'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import {
  ABORDAGENS,
  CUSTO_SLIDE,
  FORMATOS,
  type Abordagem,
  type Formato,
  type FonteIdeia,
  type ModoGeracao,
  type Objetivo,
  type StepKey,
  type TipoConteudo,
} from '../types'

export function useCriarWizard() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step state
  const [step, setStep] = useState<StepKey>('tipo')

  // Selections
  const [tipo, setTipo] = useState<TipoConteudo>('imagem')
  const [modo, setModo] = useState<ModoGeracao>('estatica')
  const [formato, setFormato] = useState<Formato | null>(null)
  const [filtroPlataforma, setFiltroPlataforma] = useState<
    'todos' | 'instagram' | 'facebook'
  >('todos')
  const [objetivo, setObjetivo] = useState<Objetivo | null>(null)
  const [abordagem, setAbordagem] = useState<Abordagem | null>(null)
  const [verMaisAbordagens, setVerMaisAbordagens] = useState(false)
  const [fonte, setFonte] = useState<FonteIdeia>('zero')
  const [ideia, setIdeia] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [showIdeiaDialog, setShowIdeiaDialog] = useState(false)
  const [showInspiracaoModal, setShowInspiracaoModal] = useState(false)
  const [ideiaTemp, setIdeiaTemp] = useState('')
  const [gerando, setGerando] = useState(false)
  const [promptRefinado, setPromptRefinado] = useState('')
  const [gerandoImagem, setGerandoImagem] = useState(false)
  const [promptExpandido, setPromptExpandido] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [creditos, setCreditos] = useState<number | null>(null)
  const [referenceImage, setReferenceImage] = useState<string | null>(null)

  const abordagemSelecionada = useMemo(
    () => ABORDAGENS.find((a) => a.key === abordagem) || null,
    [abordagem],
  )

  const formatoAtual = useMemo(
    () => FORMATOS.find((f) => f.key === formato) || null,
    [formato],
  )

  // Saldo de creditos ao entrar no app
  useEffect(() => {
    api
      .get<{ creditos: number }>('/api/gamificacao/state')
      .then((d) => setCreditos(d.creditos || 0))
      .catch(() => setCreditos(0))
  }, [])

  const refinar = async () => {
    if (!ideia.trim() || !formato || !objetivo) {
      toast.error('Preencha formato, objetivo e ideia')
      return
    }
    setGerando(true)
    try {
      const res = await api.post<{ prompt: string }>(
        '/api/criar/refinar-prompt',
        {
          ideia,
          formato,
          objetivo,
          abordagem: abordagemSelecionada?.label,
        },
      )
      setPromptRefinado(res.prompt)
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao refinar')
    } finally {
      setGerando(false)
    }
  }

  // Auto-refina ao entrar no step criar
  useEffect(() => {
    if (step === 'criar' && !promptRefinado && !gerando) {
      refinar()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const gerarComIA = async () => {
    if (!promptRefinado.trim()) {
      toast.error('Aguarde o prompt ser gerado')
      return
    }
    if (!formato) return
    if ((creditos ?? 0) < CUSTO_SLIDE) {
      setShowUpgrade(true)
      return
    }
    setGerandoImagem(true)
    try {
      const res = await api.post<{
        cardId: string
        imageUrl: string
        creditosRestantes: number
      }>('/api/criar/gerar-imagem', {
        prompt: promptRefinado,
        formato,
        objetivo,
        ideia,
        abordagem: abordagemSelecionada?.label,
        referenceImageUrl: referenceImage || undefined,
      })
      setCreditos(res.creditosRestantes)
      toast.success('Imagem gerada!')
      router.push(`/app/biblioteca?card=${res.cardId}`)
    } catch (err: any) {
      const raw = err?.message || err?.error || ''
      if (
        err?.code === 'INSUFFICIENT_CREDITS' ||
        /INSUFFICIENT_CREDITS|creditos? insuficientes/i.test(raw)
      ) {
        setShowUpgrade(true)
      } else {
        toast.error(raw || 'Erro ao gerar imagem')
      }
    } finally {
      setGerandoImagem(false)
    }
  }

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no maximo 5MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setReferenceImage(String(reader.result))
    reader.readAsDataURL(file)
  }

  return {
    // routing
    router,
    fileInputRef,
    // wizard state
    step,
    setStep,
    tipo,
    setTipo,
    modo,
    setModo,
    formato,
    setFormato,
    filtroPlataforma,
    setFiltroPlataforma,
    objetivo,
    setObjetivo,
    abordagem,
    setAbordagem,
    verMaisAbordagens,
    setVerMaisAbordagens,
    fonte,
    setFonte,
    ideia,
    setIdeia,
    linkUrl,
    setLinkUrl,
    showIdeiaDialog,
    setShowIdeiaDialog,
    showInspiracaoModal,
    setShowInspiracaoModal,
    ideiaTemp,
    setIdeiaTemp,
    // derived
    abordagemSelecionada,
    formatoAtual,
    // prompt + generation
    gerando,
    promptRefinado,
    setPromptRefinado,
    gerandoImagem,
    promptExpandido,
    setPromptExpandido,
    referenceImage,
    setReferenceImage,
    // credits + upgrade
    showUpgrade,
    setShowUpgrade,
    creditos,
    // actions
    refinar,
    gerarComIA,
    handleReferenceUpload,
  }
}

export type CriarWizardApi = ReturnType<typeof useCriarWizard>
