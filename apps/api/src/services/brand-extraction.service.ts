/**
 * Usa Gemini (LLM + Vision) para extrair uma ficha completa da marca
 * a partir de um snapshot do Instagram ou do site.
 *
 * Campos retornados = os blocos do wizard v2.0:
 *   marca, publico, identidade, estiloVisual
 *
 * Estratégia:
 *  - Texto (bio, captions, títulos) → Gemini texto
 *  - Logo / screenshot → Gemini Vision (extrai cores dominantes + estilo)
 *
 * Retorna campos pré-preenchidos que o usuário pode editar no wizard.
 */
import type {
  InstagramSnapshot,
  InstagramMediaItem,
} from './instagram-analysis.service'
import type { WebsiteSnapshot } from './website-analysis.service'
import type {
  EstiloVisualV2,
  TomDeVozV2,
} from '@soma-ai/db'
import { LLMService } from './llm.service'

const TONS_VALIDOS: TomDeVozV2[] = [
  'descontraido',
  'profissional',
  'inspirador',
  'educativo',
  'divertido',
  'acolhedor',
  'direto',
  'sofisticado',
  'amigavel',
  'motivacional',
]

const ESTILOS_VALIDOS: EstiloVisualV2[] = [
  'minimalista',
  'colorido',
  'elegante',
  'moderno',
  'rustico',
  'feminino',
  'corporativo',
]

export interface BrandExtractionResult {
  marca: {
    nome: string
    descricao: string
    tag: string
    instagram: string
    site: string
    localizacao: string
    diferencial: string
    produtosServicos: string
  }
  publico: {
    clienteIdeal: string
    dores: string
    desejos: string
  }
  identidade: {
    tomDeVoz: TomDeVozV2[]
    personalidade: string
  }
  estiloVisual: {
    cores: string[]
    logoUrl: string
    estilo: EstiloVisualV2 | null
    fontes: string
    descricao: string
  }
}

function safeParseJson<T>(text: string, fallback: T): T {
  try {
    const cleaned = text
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/, '')
      .trim()
    return JSON.parse(cleaned) as T
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) {
      try {
        return JSON.parse(m[0]) as T
      } catch {
        /* ignore */
      }
    }
    return fallback
  }
}

function filtrarTons(arr: unknown): TomDeVozV2[] {
  if (!Array.isArray(arr)) return []
  return arr
    .map((v) => String(v).toLowerCase().trim())
    .filter((v): v is TomDeVozV2 =>
      (TONS_VALIDOS as string[]).includes(v),
    )
    .slice(0, 4)
}

function filtrarEstilo(v: unknown): EstiloVisualV2 | null {
  const s = String(v || '').toLowerCase().trim()
  return (ESTILOS_VALIDOS as string[]).includes(s)
    ? (s as EstiloVisualV2)
    : null
}

function normalizarHex(c: unknown): string | null {
  if (!c) return null
  const s = String(c).trim().toUpperCase()
  if (/^#[0-9A-F]{6}$/.test(s)) return s
  if (/^#[0-9A-F]{3}$/.test(s)) {
    return (
      '#' +
      s
        .slice(1)
        .split('')
        .map((ch) => ch + ch)
        .join('')
    )
  }
  return null
}

export class BrandExtractionService {
  /**
   * Analisa um snapshot de Instagram e retorna a ficha da marca.
   */
  static async fromInstagram(
    snapshot: InstagramSnapshot,
  ): Promise<BrandExtractionResult> {
    const captionsTexto = (snapshot.media || [])
      .map((m: InstagramMediaItem, i: number) => {
        const cap = (m.caption || '').slice(0, 300)
        return cap ? `Post ${i + 1}: ${cap}` : null
      })
      .filter(Boolean)
      .join('\n')

    const bio = snapshot.profile.biography || ''
    const nome = snapshot.profile.name || snapshot.profile.username || ''

    // 1. Extração textual via LLM
    const textResult = await this.extractTextualFields({
      origem: 'instagram',
      nomeInicial: nome,
      bioOuDescricao: bio,
      conteudoExtra: captionsTexto,
      siteInicial: snapshot.profile.website || '',
    })

    // 2. Extração visual da logo (cores + estilo)
    const visualResult = snapshot.profile.profile_picture_url
      ? await this.extractVisualFromUrl(snapshot.profile.profile_picture_url)
      : { cores: [] as string[], estilo: null as EstiloVisualV2 | null }

    return {
      marca: {
        nome,
        descricao: textResult.descricao,
        tag: '',
        instagram: snapshot.profile.username || '',
        site: snapshot.profile.website || '',
        localizacao: textResult.localizacao,
        diferencial: textResult.diferencial,
        produtosServicos: textResult.produtosServicos,
      },
      publico: {
        clienteIdeal: textResult.clienteIdeal,
        dores: textResult.dores,
        desejos: textResult.desejos,
      },
      identidade: {
        tomDeVoz: textResult.tomDeVoz,
        personalidade: textResult.personalidade,
      },
      estiloVisual: {
        cores: visualResult.cores,
        logoUrl: snapshot.profile.profile_picture_url || '',
        estilo: visualResult.estilo,
        fontes: '',
        descricao: textResult.estiloDescricao,
      },
    }
  }

  /**
   * Analisa um snapshot de website e retorna a ficha da marca.
   */
  static async fromWebsite(
    snapshot: WebsiteSnapshot,
  ): Promise<BrandExtractionResult> {
    const textResult = await this.extractTextualFields({
      origem: 'site',
      nomeInicial: snapshot.title,
      bioOuDescricao: snapshot.description,
      conteudoExtra: snapshot.htmlText,
      siteInicial: snapshot.finalUrl,
    })

    // Screenshot → Gemini Vision (cores + estilo)
    const visualResult = await this.extractVisualFromBase64(
      snapshot.screenshotBase64,
      snapshot.screenshotMime,
    )

    return {
      marca: {
        nome: textResult.nome || snapshot.title,
        descricao: textResult.descricao,
        tag: '',
        instagram: '',
        site: snapshot.finalUrl,
        localizacao: textResult.localizacao,
        diferencial: textResult.diferencial,
        produtosServicos: textResult.produtosServicos,
      },
      publico: {
        clienteIdeal: textResult.clienteIdeal,
        dores: textResult.dores,
        desejos: textResult.desejos,
      },
      identidade: {
        tomDeVoz: textResult.tomDeVoz,
        personalidade: textResult.personalidade,
      },
      estiloVisual: {
        cores: visualResult.cores,
        logoUrl: snapshot.logoUrl,
        estilo: visualResult.estilo,
        fontes: '',
        descricao: textResult.estiloDescricao,
      },
    }
  }

  // ─────────────────────────────────────────────
  // Internos
  // ─────────────────────────────────────────────

  private static async extractTextualFields(input: {
    origem: 'instagram' | 'site'
    nomeInicial: string
    bioOuDescricao: string
    conteudoExtra: string
    siteInicial: string
  }): Promise<{
    nome: string
    descricao: string
    localizacao: string
    diferencial: string
    produtosServicos: string
    clienteIdeal: string
    dores: string
    desejos: string
    tomDeVoz: TomDeVozV2[]
    personalidade: string
    estiloDescricao: string
  }> {
    const prompt = `Voce e um estrategista de marketing. Analise a marca abaixo e retorne SOMENTE um JSON com o formato:

{
  "nome": "nome da marca limpo, sem @ ou emoji",
  "descricao": "2-3 frases descrevendo o negocio, produto ou servico e o que o diferencia",
  "localizacao": "cidade/estado se houver evidencia, ou string vazia",
  "diferencial": "1-2 frases sobre o que torna a marca unica (vazio se nao houver evidencia)",
  "produtosServicos": "lista curta dos principais produtos/servicos (com faixa de preco se houver evidencia)",
  "clienteIdeal": "parag. curto sobre quem e o cliente ideal (idade, genero, interesses)",
  "dores": "parag. curto sobre dores e problemas que o publico sente",
  "desejos": "parag. curto sobre desejos e sonhos do publico",
  "tomDeVoz": ["ate 4 tons da lista: descontraido, profissional, inspirador, educativo, divertido, acolhedor, direto, sofisticado, amigavel, motivacional"],
  "personalidade": "se a marca fosse uma pessoa, como ela seria",
  "estiloDescricao": "3-5 frases descrevendo o estilo visual da marca (tipografia, layout, tratamento fotografico, grafismos). Evite listar cores."
}

Escreva tudo em portugues do Brasil, texto corrido, sem markdown.

Origem: ${input.origem.toUpperCase()}
Nome inicial: ${input.nomeInicial}
Site: ${input.siteInicial}
Bio/descricao: ${input.bioOuDescricao || '(vazio)'}

Conteudo adicional (posts/texto do site):
${input.conteudoExtra.slice(0, 6000) || '(vazio)'}

Responda APENAS com o JSON.`

    const text = await LLMService.generateText(prompt)
    const parsed = safeParseJson<any>(text, {})

    return {
      nome: String(parsed.nome || input.nomeInicial || '').trim(),
      descricao: String(parsed.descricao || '').trim(),
      localizacao: String(parsed.localizacao || '').trim(),
      diferencial: String(parsed.diferencial || '').trim(),
      produtosServicos: String(parsed.produtosServicos || '').trim(),
      clienteIdeal: String(parsed.clienteIdeal || '').trim(),
      dores: String(parsed.dores || '').trim(),
      desejos: String(parsed.desejos || '').trim(),
      tomDeVoz: filtrarTons(parsed.tomDeVoz),
      personalidade: String(parsed.personalidade || '').trim(),
      estiloDescricao: String(parsed.estiloDescricao || '').trim(),
    }
  }

  private static async extractVisualFromUrl(imageUrl: string): Promise<{
    cores: string[]
    estilo: EstiloVisualV2 | null
  }> {
    try {
      const res = await fetch(imageUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      const mime = res.headers.get('content-type') || 'image/jpeg'
      return await this.extractVisualFromBase64(buf.toString('base64'), mime)
    } catch (err) {
      console.warn('[BrandExtraction] falha ao baixar logo:', err)
      return { cores: [], estilo: null }
    }
  }

  private static async extractVisualFromBase64(
    base64: string,
    mimeType: string,
  ): Promise<{ cores: string[]; estilo: EstiloVisualV2 | null }> {
    try {
      const prompt = `Analise esta imagem de logo de marca e identifique as cores exatas usadas no design.

Retorne SOMENTE JSON sem markdown:
{
  "cores": ["#RRGGBB", "#RRGGBB", "#RRGGBB"],
  "estilo": "minimalista" | "colorido" | "elegante" | "moderno" | "rustico" | "feminino" | "corporativo"
}

Regras para cores:
- Identifique as 3 cores mais importantes da logo (nao do fundo generico)
- Se a logo tiver fundo colorido, inclua essa cor
- Se usar verde, branco e escuro: inclua as 3
- Sempre retorne exatamente 3 cores em hexadecimal (#RRGGBB)
- Se so houver 2 cores, repita a mais importante como terceira
- Para estilos fintech/financas/tecnologia prefira "moderno" ou "corporativo"

Responda apenas com o JSON, sem texto adicional.`

      const text = await LLMService.analyzeImage(prompt, base64, mimeType)
      const parsed = safeParseJson<any>(text, {})

      const cores = Array.isArray(parsed.cores)
        ? parsed.cores
            .map(normalizarHex)
            .filter((c: string | null): c is string => !!c)
            .slice(0, 3)
        : []

      return {
        cores,
        estilo: filtrarEstilo(parsed.estilo),
      }
    } catch (err) {
      console.warn('[BrandExtraction] Vision falhou:', err)
      return { cores: [], estilo: null }
    }
  }
}
