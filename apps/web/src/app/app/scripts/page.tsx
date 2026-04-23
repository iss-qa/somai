'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { FeatureGate } from '@/components/company/FeatureGate'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import {
  FileText,
  Plus,
  Copy,
  Pencil,
  Trash2,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Mic,
  Video,
  Image as ImageIcon,
  Send,
  MessageCircle,
  X,
  Upload,
} from 'lucide-react'

// ── Types ────────────────────────────────────────

interface ScriptItem {
  _id: string
  title: string
  category: string
  text: string
  char_count: number
  audio_url: string
  video_url: string
  images: string[]
  sent_via_whatsapp: boolean
  createdAt: string
}

// ── Category templates by niche ──────────────────

interface CategoryTemplate {
  name: string
  title: string
  text: string
}

const NICHE_TEMPLATES: Record<string, CategoryTemplate[]> = {
  farmacia: [
    { name: 'Promocao de Medicamentos', title: 'Promocao Especial - Farmacia', text: 'Olá! Tudo bem?\n\nPassando pra avisar que estamos com uma promocao imperdivel!\n\n[Nome do produto] com desconto especial por tempo limitado.\n\nCorre pra garantir o seu! Estoque limitado.\n\nQualquer duvida, chama aqui no WhatsApp!' },
    { name: 'Dica de Saude', title: 'Dica de Saude - Farmacia', text: 'Oi! Tudo bem?\n\nVoce sabia que [dica de saude]?\n\nAqui na farmacia temos tudo que você precisa pra cuidar da sua saude.\n\nVem conversar com a gente!' },
    { name: 'Novidades da Farmacia', title: 'Novidades da Farmacia', text: 'Oi! Tudo bem?\n\nTemos novidades na farmacia!\n\nChegou [produto novo] e ja esta disponivel.\n\nPassa aqui pra conferir ou chama no WhatsApp!' },
    { name: 'Dia do Cliente', title: 'Dia Especial do Cliente', text: 'Olá, cliente especial!\n\nHoje e dia de cuidar de você!\n\nPreparamos condicoes exclusivas pra nossos clientes fieis.\n\nVem aproveitar!' },
    { name: 'Campanha Sazonal', title: 'Campanha Sazonal - Farmacia', text: 'Oi! Tudo bem?\n\n[Nome da campanha] chegou na farmacia!\n\nPreparamos ofertas especiais pra essa epoca do ano.\n\nConfira nossas promocoes!' },
    { name: 'Dermocosmeticos', title: 'Dermocosmeticos - Novidades', text: 'Oi! Tudo bem?\n\nVoce ja conhece nossa linha de dermocosmeticos?\n\nTemos [marca/produto] com preços especiais.\n\nCuide da sua pele com quem entende!' },
    { name: 'Programa de Fidelidade', title: 'Programa de Fidelidade', text: 'Olá!\n\nVoce ja faz parte do nosso programa de fidelidade?\n\nA cada compra você acumula pontos e troca por descontos!\n\nVem saber mais!' },
    { name: 'Outro', title: '', text: '' },
  ],
  pet: [
    { name: 'Apresentacao do Petshop', title: 'Apresentacao do Petshop', text: 'Oi! Tudo bem?\n\nJa conhece nosso petshop?\n\nAqui cuidamos do seu pet com muito amor e carinho!\n\nTemos racao, brinquedos, banho e tosa, e muito mais.\n\nVem nos visitar ou chama aqui no WhatsApp!' },
    { name: 'Promocao de Racao', title: 'Promocao de Racao', text: 'Olá! Tudo bem?\n\nRacao [marca] com preço especial!\n\nDe: R$ [preço original]\nPor: R$ [preço promocional]\n\nCorre que e por tempo limitado!\n\nFaca seu pedido pelo WhatsApp!' },
    { name: 'Dica de Cuidados', title: 'Dica de Cuidados com Pets', text: 'Oi! Tudo bem?\n\nVoce sabia que [dica de cuidado com pet]?\n\nAqui no petshop temos tudo pra manter seu pet saudavel e feliz!\n\nVem conversar com a gente!' },
    { name: 'Banho e Tosa', title: 'Banho e Tosa - Agende', text: 'Oi! Tudo bem?\n\nSeu pet esta precisando de um banho e tosa?\n\nAgende agora e aproveite nossas condicoes especiais!\n\nBanho: R$ [preço]\nBanho + Tosa: R$ [preço]\n\nChama no WhatsApp pra agendar!' },
    { name: 'Novos Produtos', title: 'Novos Produtos - Petshop', text: 'Olá!\n\nChegaram novidades no petshop!\n\n[Descreva os novos produtos]\n\nVem conferir ou faca seu pedido pelo WhatsApp!' },
    { name: 'Adocao de Pets', title: 'Campanha de Adocao', text: 'Olá! Tudo bem?\n\nEstamos com uma campanha de adocao responsavel!\n\nTemos [tipo de pet] esperando um lar cheio de amor.\n\nVenha conhecer e se apaixonar!' },
    { name: 'Vacinacao', title: 'Vacinacao em Dia', text: 'Oi! Tudo bem?\n\nA vacinacao do seu pet esta em dia?\n\nAqui no petshop temos todas as vacinas necessarias.\n\nAgende agora pelo WhatsApp!' },
    { name: 'Outro', title: '', text: '' },
  ],
  moda: [
    { name: 'Lancamento de Colecao', title: 'Nova Colecao - Lancamento', text: 'Oi! Tudo bem?\n\nA nova colecao chegou!\n\nPecas lindas, tendencias da estacao, e preços que cabem no bolso.\n\nVem conferir! Estoque limitado.\n\nChama no WhatsApp pra ver o catalogo!' },
    { name: 'Promocao de Roupas', title: 'Promocao Imperdivel', text: 'Olá! Tudo bem?\n\nPromocao especial na loja!\n\n[Descrição da promocao]\n\nAproveite antes que acabe!\n\nFaca seu pedido pelo WhatsApp!' },
    { name: 'Tendencias da Estacao', title: 'Tendencias da Estacao', text: 'Oi! Tudo bem?\n\nVoce ja conferiu as tendencias dessa estacao?\n\n[Descreva as tendencias]\n\nTemos tudo aqui na loja! Vem ver!' },
    { name: 'Look do Dia', title: 'Look do Dia - Inspiracao', text: 'Oi! Tudo bem?\n\nLook do dia pra você se inspirar!\n\n[Descreva o look]\n\nTodas as pecas disponiveis na loja.\n\nChama no WhatsApp pra garantir o seu!' },
    { name: 'Liquidacao', title: 'Liquidacao - Ate X% OFF', text: 'Olá!\n\nLiquidacao com ate [X]% de desconto!\n\nPecas selecionadas por preços incriveis.\n\nCorre que e por tempo limitado!\n\nVem pra loja ou chama no WhatsApp!' },
    { name: 'Depoimento de Cliente', title: 'O que nossos clientes dizem', text: 'Oi! Tudo bem?\n\nOlha so o que a [nome] falou sobre a experiencia com a gente:\n\n"[Depoimento do cliente]"\n\nQuer ter essa experiencia também? Vem pra ca!' },
    { name: 'Outro', title: '', text: '' },
  ],
  cosmeticos: [
    { name: 'Lancamento de Produto', title: 'Lancamento - Cosmeticos', text: 'Oi! Tudo bem?\n\nChegou [nome do produto]!\n\n[Beneficios do produto]\n\nVem experimentar! Disponivel na loja e pelo WhatsApp.' },
    { name: 'Tutorial de Maquiagem', title: 'Tutorial de Maquiagem', text: 'Oi! Tudo bem?\n\nPreparei um tutorial especial pra você!\n\n[Descreva o passo a passo]\n\nTodos os produtos usados estao disponiveis na loja.\n\nChama no WhatsApp pra saber mais!' },
    { name: 'Cuidados com a Pele', title: 'Cuidados com a Pele', text: 'Oi! Tudo bem?\n\nVoce sabia que [dica de skincare]?\n\nAqui na loja temos os melhores produtos pra sua rotina de cuidados.\n\nVem conversar com a gente!' },
    { name: 'Promocao Especial', title: 'Promocao Especial - Cosmeticos', text: 'Olá! Tudo bem?\n\nPromocao imperdivel!\n\n[Produto] de R$ [preço original] por R$ [preço promo].\n\nCorre que e por tempo limitado!' },
    { name: 'Antes e Depois', title: 'Antes e Depois - Resultados', text: 'Oi! Tudo bem?\n\nOlha so esse resultado incrivel!\n\n[Descreva o antes e depois]\n\nQuer ter esse resultado? Chama no WhatsApp!' },
    { name: 'Depoimento de Cliente', title: 'Depoimento - Cosmeticos', text: 'Oi! Tudo bem?\n\nOlha o que a [nome] achou:\n\n"[Depoimento]"\n\nExperimente você também!' },
    { name: 'Outro', title: '', text: '' },
  ],
  mercearia: [
    { name: 'Ofertas da Semana', title: 'Ofertas da Semana', text: 'Olá! Tudo bem?\n\nConfira as ofertas da semana!\n\n[Liste os produtos e preços]\n\nValido ate [data].\n\nFaca seu pedido pelo WhatsApp!' },
    { name: 'Produtos Frescos', title: 'Produtos Frescos do Dia', text: 'Oi! Tudo bem?\n\nChegaram produtos fresquinhos hoje!\n\n[Liste os produtos]\n\nVem garantir os seus! Estoque limitado.' },
    { name: 'Receita do Dia', title: 'Receita do Dia', text: 'Oi! Tudo bem?\n\nReceita especial do dia:\n\n[Nome da receita]\n\nIngredientes:\n[Liste os ingredientes]\n\nTodos disponiveis aqui na mercearia!\n\nVem conferir!' },
    { name: 'Novidades no Estoque', title: 'Novidades no Estoque', text: 'Olá!\n\nChegaram novidades!\n\n[Descreva os novos produtos]\n\nVem conferir ou faca seu pedido pelo WhatsApp!' },
    { name: 'Hortifruti', title: 'Hortifruti Fresquinho', text: 'Oi! Tudo bem?\n\nHortifruti fresquinho chegou!\n\n[Liste frutas e verduras]\n\nPrecos especiais pra você.\n\nVem pra mercearia!' },
    { name: 'Delivery', title: 'Delivery - Entregamos pra Você', text: 'Olá! Tudo bem?\n\nSabia que fazemos delivery?\n\nFaca seu pedido pelo WhatsApp e receba no conforto da sua casa!\n\nEntrega rápida e sem taxa minima.\n\nChama aqui!' },
    { name: 'Outro', title: '', text: '' },
  ],
  calcados: [
    { name: 'Lancamento de Colecao', title: 'Nova Colecao de Calcados', text: 'Oi! Tudo bem?\n\nA nova colecao chegou!\n\nModelos incriveis, confortaveis e com preços especiais.\n\nVem conferir! Chama no WhatsApp pra ver o catalogo.' },
    { name: 'Promocao de Calcados', title: 'Promocao de Calcados', text: 'Olá! Tudo bem?\n\nPromocao imperdivel!\n\n[Modelo] de R$ [preço original] por R$ [preço promo].\n\nCorre que e por tempo limitado!' },
    { name: 'Tendencias', title: 'Tendencias em Calcados', text: 'Oi! Tudo bem?\n\nAs tendencias da estacao estao aqui!\n\n[Descreva as tendencias]\n\nTemos todos os modelos na loja.\n\nVem conferir!' },
    { name: 'Conforto e Qualidade', title: 'Conforto e Qualidade', text: 'Oi! Tudo bem?\n\nProcurando calcado confortavel e de qualidade?\n\nConheca nossa linha [marca/modelo].\n\nSeu pe merece o melhor!\n\nVem experimentar na loja!' },
    { name: 'Liquidacao', title: 'Liquidacao de Calcados', text: 'Olá!\n\nLiquidacao com ate [X]% OFF!\n\nModelos selecionados por preços incriveis.\n\nVem pra loja ou chama no WhatsApp!' },
    { name: 'Depoimento de Cliente', title: 'O que nossos clientes dizem', text: 'Oi! Tudo bem?\n\nOlha o que a [nome] falou:\n\n"[Depoimento]"\n\nQuer ter essa experiencia? Vem pra ca!' },
    { name: 'Outro', title: '', text: '' },
  ],
  outro: [
    { name: 'Apresentacao do Negocio', title: 'Apresentacao - Seu Negocio', text: 'Oi! Tudo bem?\n\nJa conhece nosso negocio?\n\n[Descreva brevemente o que você faz]\n\nEstamos aqui pra te ajudar!\n\nChama no WhatsApp pra saber mais.' },
    { name: 'Recrutamento de Admins', title: 'Vagas Abertas - Venha Fazer Parte', text: 'Olá! Tudo bem?\n\nEstamos crescendo e buscando pessoas incriveis pra nossa equipe!\n\n[Descreva a vaga e requisitos]\n\nInteressado? Chama no WhatsApp!' },
    { name: 'Convite para Participante', title: 'Convite Especial', text: 'Oi! Tudo bem?\n\nVoce esta convidado(a) pra [evento/acao]!\n\n[Detalhes do convite]\n\nConfirme sua presenca pelo WhatsApp!' },
    { name: 'Follow-up / Lembrete', title: 'Lembrete Importante', text: 'Oi! Tudo bem?\n\nPassando pra lembrar que [assunto do lembrete].\n\nQualquer duvida, estamos a disposicao!\n\nChama no WhatsApp.' },
    { name: 'Depoimento / Prova Social', title: 'O que nossos clientes dizem', text: 'Oi! Tudo bem?\n\nOlha o que a [nome] falou sobre a gente:\n\n"[Depoimento]"\n\nVem viver essa experiencia também!' },
    { name: 'Promocional / Oferta', title: 'Oferta Especial - Por Tempo Limitado', text: 'Olá! Tudo bem?\n\nPreparamos uma oferta especial pra você!\n\n[Descreva a oferta]\n\nCorre que e por tempo limitado!\n\nChama no WhatsApp pra garantir.' },
    { name: 'Educativo / Como Funciona', title: 'Como Funciona - Guia Rápido', text: 'Oi! Tudo bem?\n\nVoce sabe como funciona [assunto]?\n\n[Explique de forma simples]\n\nQualquer duvida, chama no WhatsApp!' },
    { name: 'Outro', title: '', text: '' },
  ],
}

function getTemplates(niche?: string): CategoryTemplate[] {
  return NICHE_TEMPLATES[niche || 'outro'] || NICHE_TEMPLATES.outro
}

function getCategories(niche?: string): string[] {
  return getTemplates(niche).map((t) => t.name)
}

// ── Main component ───────────────────────────────

function ScriptsContent() {
  const { user } = useAuthStore()
  const templates = getTemplates(user?.niche)
  const categories = templates.map((t) => t.name)

  // State
  const [scripts, setScripts] = useState<ScriptItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingScript, setEditingScript] = useState<ScriptItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [improving, setImproving] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formText, setFormText] = useState('')
  const [formAudioUrl, setFormAudioUrl] = useState('')
  const [formVideoUrl, setFormVideoUrl] = useState('')
  const [formImages, setFormImages] = useState<string[]>([])

  // File refs
  const audioInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // ── Load scripts ─────────────────────────────
  const loadScripts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      params.set('limit', '100')
      const data = await api.get<{ scripts: ScriptItem[] }>(
        `/api/scripts?${params.toString()}`
      )
      setScripts(data.scripts || [])
    } catch {
      setScripts([])
    } finally {
      setLoading(false)
    }
  }, [categoryFilter])

  useEffect(() => {
    loadScripts()
  }, [loadScripts])

  // ── Filtered scripts ─────────────────────────
  const filtered = scripts.filter((s) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      s.title.toLowerCase().includes(q) ||
      s.text.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    )
  })

  // ── Stats ────────────────────────────────────
  const stats = {
    total: scripts.length,
    withAudio: scripts.filter((s) => s.audio_url).length,
    withImages: scripts.filter((s) => s.images.length > 0).length,
    categories: new Set(scripts.map((s) => s.category).filter(Boolean)).size,
  }

  // ── File to base64 ──────────────────────────
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  // ── Handle file uploads ─────────────────────
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Audio deve ter no máximo 10MB')
      return
    }
    const base64 = await fileToBase64(file)
    setFormAudioUrl(base64)
    toast.success('Audio adicionado')
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Vídeo deve ter no máximo 25MB')
      return
    }
    const base64 = await fileToBase64(file)
    setFormVideoUrl(base64)
    toast.success('Vídeo adicionado')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    if (formImages.length + files.length > 5) {
      toast.error('Máximo de 5 imagens')
      return
    }
    const newImages: string[] = []
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} excede 5MB`)
        continue
      }
      newImages.push(await fileToBase64(file))
    }
    setFormImages((prev) => [...prev, ...newImages])
    toast.success(`${newImages.length} imagem(ns) adicionada(s)`)
  }

  // ── Apply template from category ────────────
  const applyTemplate = (categoryName: string) => {
    const tpl = templates.find((t) => t.name === categoryName)
    if (tpl) {
      setFormCategory(categoryName)
      if (tpl.title) setFormTitle(tpl.title)
      if (tpl.text) setFormText(tpl.text)
    } else {
      setFormCategory(categoryName)
    }
  }

  // ── Handle category change in modal ─────────
  const handleCategoryChange = (categoryName: string) => {
    // Only auto-fill if creating (not editing)
    if (!editingScript) {
      applyTemplate(categoryName)
    } else {
      setFormCategory(categoryName)
    }
  }

  // ── Open modal ──────────────────────────────
  const openCreateModal = () => {
    setEditingScript(null)
    const firstCat = categories[0] || ''
    const tpl = templates.find((t) => t.name === firstCat)
    setFormTitle(tpl?.title || '')
    setFormCategory(firstCat)
    setFormText(tpl?.text || '')
    setFormAudioUrl('')
    setFormVideoUrl('')
    setFormImages([])
    setModalOpen(true)
  }

  const openEditModal = (script: ScriptItem) => {
    setEditingScript(script)
    setFormTitle(script.title)
    setFormCategory(script.category)
    setFormText(script.text)
    setFormAudioUrl(script.audio_url || '')
    setFormVideoUrl(script.video_url || '')
    setFormImages(script.images || [])
    setModalOpen(true)
  }

  // ── Save ────────────────────────────────────
  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast.error('Titulo e obrigatório')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: formTitle,
        category: formCategory,
        text: formText,
        audio_url: formAudioUrl,
        video_url: formVideoUrl,
        images: formImages,
      }
      if (editingScript) {
        await api.put(`/api/scripts/${editingScript._id}`, payload)
        toast.success('Roteiro atualizado!')
      } else {
        await api.post('/api/scripts', payload)
        toast.success('Roteiro criado!')
      }
      setModalOpen(false)
      loadScripts()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar roteiro')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ──────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este roteiro?')) return
    try {
      await api.delete(`/api/scripts/${id}`)
      toast.success('Roteiro excluido')
      if (expandedId === id) setExpandedId(null)
      loadScripts()
    } catch {
      toast.error('Erro ao excluir roteiro')
    }
  }

  // ── AI Improve ──────────────────────────────
  const handleImproveWithAI = async () => {
    if (!formText.trim()) {
      toast.error('Escreva o texto antes de melhorar com IA')
      return
    }
    setImproving(true)
    try {
      const result = await api.post<{ improved_text: string }>('/api/scripts/ai/improve', {
        text: formText,
        category: formCategory,
        niche: user?.niche,
      })
      setFormText(result.improved_text)
      toast.success('Texto melhorado com IA!')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao melhorar com IA')
    } finally {
      setImproving(false)
    }
  }

  // ── Copy text ───────────────────────────────
  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Texto copiado!')
  }

  // ── Copy for WhatsApp ───────────────────────
  const copyForWhatsApp = (text: string) => {
    navigator.clipboard.writeText(text)
    const encoded = encodeURIComponent(text)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  // ── Send complete via WhatsApp ──────────────
  const sendComplete = (script: ScriptItem) => {
    const encoded = encodeURIComponent(script.text)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
    toast.success('WhatsApp aberto! Envie o texto e depois os anexos manualmente.')
  }

  // ── Render ──────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Roteiros de Comunicacao</h2>
          <p className="text-sm text-gray-400 mt-1">
            Crie roteiros, adicione audios e imagens para compartilhar via WhatsApp
          </p>
        </div>
        <Button className="gap-2 w-full sm:w-auto" onClick={openCreateModal}>
          <Plus className="w-4 h-4" />
          Novo Roteiro
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Buscar roteiro..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Todas categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10">
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-gray-400">Total</p>
        </div>
        <div className="bg-green-500/5 rounded-lg p-3 text-center border border-green-500/20">
          <p className="text-2xl font-bold text-green-400">{stats.withAudio}</p>
          <p className="text-xs text-gray-400">Com audio</p>
        </div>
        <div className="bg-blue-500/5 rounded-lg p-3 text-center border border-blue-500/20">
          <p className="text-2xl font-bold text-blue-400">{stats.withImages}</p>
          <p className="text-xs text-gray-400">Com imagens</p>
        </div>
        <div className="bg-yellow-500/5 rounded-lg p-3 text-center border border-yellow-500/20">
          <p className="text-2xl font-bold text-yellow-400">{stats.categories}</p>
          <p className="text-xs text-gray-400">Categorias</p>
        </div>
      </div>

      {/* Scripts list */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((script) => {
            const isExpanded = expandedId === script._id
            return (
              <Card key={script._id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Collapsed header */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : script._id)
                    }
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-medium text-gray-200 truncate">
                          {script.title}
                        </h3>
                        {script.category && (
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            {script.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {script.text.slice(0, 80)}
                        {script.text.length > 80 ? '...' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {script.audio_url && (
                        <Mic className="w-3.5 h-3.5 text-green-400" />
                      )}
                      {script.video_url && (
                        <Video className="w-3.5 h-3.5 text-blue-400" />
                      )}
                      {script.images.length > 0 && (
                        <ImageIcon className="w-3.5 h-3.5 text-yellow-400" />
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-brand-border">
                      {/* Script text */}
                      <div className="p-4 bg-white/[0.02]">
                        <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {script.text}
                        </p>
                      </div>

                      {/* Media indicators */}
                      {(script.audio_url || script.video_url || script.images.length > 0) && (
                        <div className="px-4 py-2 flex items-center gap-3 border-t border-brand-border bg-white/[0.01]">
                          {script.audio_url && (
                            <span className="flex items-center gap-1 text-xs text-green-400">
                              <Mic className="w-3 h-3" /> Audio anexado
                            </span>
                          )}
                          {script.video_url && (
                            <span className="flex items-center gap-1 text-xs text-blue-400">
                              <Video className="w-3 h-3" /> Vídeo anexado
                            </span>
                          )}
                          {script.images.length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-yellow-400">
                              <ImageIcon className="w-3 h-3" /> {script.images.length} imagem(ns)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="px-4 py-3 flex flex-wrap items-center gap-2 border-t border-brand-border">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          onClick={() => copyText(script.text)}
                        >
                          <Copy className="w-3 h-3" />
                          Copiar texto
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs text-green-400 border-green-500/30 hover:bg-green-500/10"
                          onClick={() => copyForWhatsApp(script.text)}
                        >
                          <MessageCircle className="w-3 h-3" />
                          Copiar p/ WhatsApp
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1.5 text-xs bg-green-600 hover:bg-green-700"
                          onClick={() => sendComplete(script)}
                        >
                          <Send className="w-3 h-3" />
                          Enviar Completo
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          onClick={() => openEditModal(script)}
                        >
                          <Pencil className="w-3 h-3" />
                          Editar
                        </Button>
                        <div className="ml-auto">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => handleDelete(script._id)}
                          >
                            <Trash2 className="w-3 h-3" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white/[0.02] rounded-xl border border-dashed border-brand-border">
          <FileText className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-300 mb-1">
            Nenhum roteiro criado ainda. Clique em &quot;Novo Roteiro&quot;!
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Crie roteiros, adicione audios e imagens para compartilhar via WhatsApp
          </p>
          <Button className="gap-2" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Novo Roteiro
          </Button>
        </div>
      )}

      {/* ── Create/Edit Modal ──────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingScript ? 'Editar Roteiro' : 'Novo Roteiro'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label>Titulo do roteiro</Label>
              <Input
                placeholder="Ex: Apresentacao Juntix - Versao WhatsApp"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={formCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Text */}
            <div className="space-y-1.5">
              <Label>Texto do roteiro</Label>
              <textarea
                className="flex min-h-[150px] w-full rounded-md border border-brand-border bg-transparent px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
                placeholder="Digite o texto do roteiro aqui...&#10;&#10;Use emojis, quebras de linha e formatacao livre."
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {formText.length} caracteres
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-xs text-primary-400 hover:text-primary-300"
                  disabled={improving || !formText.trim()}
                  onClick={handleImproveWithAI}
                >
                  {improving ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  {improving ? 'Melhorando...' : 'Melhorar com IA'}
                </Button>
              </div>
            </div>

            {/* Audio upload */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" /> Audio (opcional)
              </Label>
              {formAudioUrl ? (
                <div className="flex items-center gap-2 p-2 rounded-md bg-green-500/5 border border-green-500/20">
                  <Mic className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400 flex-1">Audio adicionado</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => setFormAudioUrl('')}
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-md border border-dashed border-brand-border text-gray-500 hover:border-gray-400 hover:text-gray-300 transition-colors text-xs"
                >
                  <Upload className="w-4 h-4" />
                  Enviar audio (mp3, m4a, ogg - max 10MB)
                </button>
              )}
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/mp3,audio/mpeg,audio/m4a,audio/ogg,audio/*"
                className="hidden"
                onChange={handleAudioUpload}
              />
            </div>

            {/* Video upload */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" /> Vídeo (opcional)
              </Label>
              {formVideoUrl ? (
                <div className="flex items-center gap-2 p-2 rounded-md bg-blue-500/5 border border-blue-500/20">
                  <Video className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-blue-400 flex-1">Vídeo adicionado</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => setFormVideoUrl('')}
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-md border border-dashed border-brand-border text-gray-500 hover:border-gray-400 hover:text-gray-300 transition-colors text-xs"
                >
                  <Upload className="w-4 h-4" />
                  Enviar video (mp4, mov - max 25MB)
                </button>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/*"
                className="hidden"
                onChange={handleVideoUpload}
              />
            </div>

            {/* Image upload */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Imagens (opcional, max 5)
              </Label>
              {formImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formImages.map((img, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden group">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setFormImages((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {formImages.length < 5 && (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-md border border-dashed border-brand-border text-gray-500 hover:border-gray-400 hover:text-gray-300 transition-colors text-xs"
                >
                  <Upload className="w-4 h-4" />
                  Adicionar imagens ({formImages.length}/5)
                </button>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="gap-1.5"
              disabled={saving}
              onClick={handleSave}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingScript ? 'Salvar alteracoes' : 'Criar roteiro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ScriptsPage() {
  return (
    <FeatureGate feature="Roteiros com IA">
      <ScriptsContent />
    </FeatureGate>
  )
}
