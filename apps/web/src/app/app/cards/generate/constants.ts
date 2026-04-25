import { Square, Smartphone, Layers } from 'lucide-react'
import type {
  CardConfig,
  CardTheme,
  CarouselObjective,
  ColorPalette,
  FontFamily,
  Format,
  ImageLayout,
  PaletteId,
  PostType,
} from './types'

export const COLOR_PALETTES: ColorPalette[] = [
  { id: 'vibrante', label: 'Vibrante', primary: '#8B5CF6', secondary: '#EC4899', bg: '#1a1a2e' },
  { id: 'profissional', label: 'Profissional', primary: '#3B82F6', secondary: '#10B981', bg: '#0f172a' },
  { id: 'quente', label: 'Quente', primary: '#F59E0B', secondary: '#EF4444', bg: '#1c1917' },
  { id: 'elegante', label: 'Elegante', primary: '#A855F7', secondary: '#6366F1', bg: '#0c0a1a' },
]

export const FORMAT_OPTIONS: {
  id: Format
  label: string
  icon: typeof Square
  hint: string
}[] = [
  {
    id: 'feed',
    label: 'Feed Quadrado',
    icon: Square,
    hint: 'Post quadrado 1:1 no feed do Instagram. Ideal para imagens de produtos, promocoes e conteudo informativo. Permanece no perfil permanentemente.',
  },
  {
    id: 'stories',
    label: 'Stories',
    icon: Smartphone,
    hint: 'Fotos ou videos curtos verticais (9:16) para engajamento diario. Desaparecem em 24h. Ideal para bastidores, enquetes e conexao com seguidores existentes.',
  },
  {
    id: 'carousel',
    label: 'Carrossel',
    icon: Layers,
    hint: 'Ate 10 imagens em um único post deslizavel no formato quadrado (1:1) ou vertical (9:16). Ideal para tutoriais, antes/depois e multiplos produtos.',
  },
]

export const POST_TYPES: { value: PostType; label: string }[] = [
  { value: 'nenhum', label: 'Nenhum' },
  { value: 'promocao', label: 'Promocao' },
  { value: 'dica', label: 'Dica' },
  { value: 'novidade', label: 'Novidade' },
  { value: 'institucional', label: 'Institucional' },
  { value: 'data_comemorativa', label: 'Data Comemorativa' },
]

export const NICHE_OBJECTIVES: Record<string, CarouselObjective[]> = {
  farmacia: [
    { id: 'promo_semana', label: 'Promocoes da semana', slides: [
      { headline: 'Ofertas imperdíveis!', subtext: 'Confira as promocoes desta semana' },
      { headline: 'Ate 40% OFF', subtext: 'Medicamentos selecionados com desconto' },
      { headline: 'Dermocosmeticos', subtext: 'Cuidados com a pele por menos' },
      { headline: 'Vitaminas e suplementos', subtext: 'Cuide da sua saude todo dia' },
      { headline: 'Higiene e beleza', subtext: 'Produtos essenciais com preço baixo' },
      { headline: 'Não perca!', subtext: 'Ofertas validas por tempo limitado', cta: 'Venha conferir' },
      { headline: 'Farmacia sempre perto', subtext: 'Atendimento de qualidade pra você', cta: 'Chame no WhatsApp' },
    ]},
    { id: 'dica_saude', label: 'Dica de Saude', slides: [
      { headline: 'Você sabia?', subtext: 'Dicas de saude para o seu dia a dia' },
      { headline: 'Hidratacao', subtext: 'Beba pelo menos 2 litros de agua por dia' },
      { headline: 'Alimentacao', subtext: 'Inclua frutas e verduras nas refeicoes' },
      { headline: 'Sono de qualidade', subtext: 'Durma de 7 a 8 horas por noite' },
      { headline: 'Exercicios', subtext: 'Pratique atividade fisica regularmente' },
      { headline: 'Check-up em dia', subtext: 'Faca exames periodicos', cta: 'Cuide-se!' },
      { headline: 'Conte com a gente', subtext: 'Estamos aqui para ajudar', cta: 'Fale conosco' },
    ]},
    { id: 'novo_produto', label: 'Lancamento de produto', slides: [
      { headline: 'Novidade!', subtext: 'Chegou na farmacia' },
      { headline: 'Conheca o produto', subtext: 'Qualidade e eficacia comprovada' },
      { headline: 'Beneficios', subtext: 'Resultados que você vai sentir' },
      { headline: 'Como usar', subtext: 'Modo de uso simples e pratico' },
      { headline: 'Preço especial', subtext: 'Oferta de lancamento', cta: 'Aproveite' },
      { headline: 'Disponivel agora', subtext: 'Venha buscar o seu' },
      { headline: 'Garanta o seu', subtext: 'Estoque limitado', cta: 'Compre agora' },
    ]},
    { id: 'personalizado', label: 'Personalizado', slides: [] },
  ],
  pet: [
    { id: 'apresentacao', label: 'O que e o Petshop?', slides: [
      { headline: 'Conheca nosso petshop!', subtext: 'Cuidados completos para seu pet' },
      { headline: 'Banho e Tosa', subtext: 'Seu pet limpinho e cheiroso' },
      { headline: 'Racao Premium', subtext: 'As melhores marcas do mercado' },
      { headline: 'Acessorios', subtext: 'Brinquedos, camas e coleiras' },
      { headline: 'Veterinario', subtext: 'Atendimento com amor e carinho' },
      { headline: 'Delivery', subtext: 'Entregamos na sua porta', cta: 'Peca agora' },
      { headline: 'Venha nos visitar!', subtext: 'Seu pet merece o melhor', cta: 'Chame no WhatsApp' },
    ]},
    { id: 'promo_racao', label: 'Promocao de Racao', slides: [
      { headline: 'Super Oferta!', subtext: 'Racao com preço especial' },
      { headline: 'Caes', subtext: 'Racao premium a partir de R$ XX' },
      { headline: 'Gatos', subtext: 'As melhores marcas com desconto' },
      { headline: 'Filhotes', subtext: 'Nutricao ideal para crescimento' },
      { headline: 'Frete grátis*', subtext: 'Acima de R$ 100 em compras', cta: 'Peca ja' },
      { headline: 'Entrega rápida', subtext: 'Receba no mesmo dia' },
      { headline: 'Aproveite!', subtext: 'Estoque limitado', cta: 'Compre agora' },
    ]},
    { id: 'cuidados', label: 'Dicas de cuidados com pets', slides: [
      { headline: 'Dicas para seu pet', subtext: 'Cuidados essenciais' },
      { headline: 'Vacinacao em dia', subtext: 'Proteja seu amigo' },
      { headline: 'Higiene bucal', subtext: 'Escove os dentes do pet regularmente' },
      { headline: 'Passeios diarios', subtext: 'Exercicio e fundamental' },
      { headline: 'Alimentacao correta', subtext: 'Consulte o veterinario' },
      { headline: 'Carinho sempre!', subtext: 'Amor e o melhor remedio' },
      { headline: 'Conte com a gente', subtext: 'Cuidamos do seu pet', cta: 'Agende agora' },
    ]},
    { id: 'personalizado', label: 'Personalizado', slides: [] },
  ],
  moda: [
    { id: 'nova_colecao', label: 'Lancamento de colecao', slides: [
      { headline: 'Nova Colecao!', subtext: 'Chegou o que você esperava' },
      { headline: 'Tendencia', subtext: 'As pecas mais desejadas da estacao' },
      { headline: 'Looks exclusivos', subtext: 'Estilo único para você' },
      { headline: 'Conforto + estilo', subtext: 'Qualidade que você sente' },
      { headline: 'Tamanhos P ao GG', subtext: 'Moda para todos os corpos' },
      { headline: 'Preço especial', subtext: 'Lancamento com desconto', cta: 'Confira' },
      { headline: 'Garanta o seu', subtext: 'Estoque limitado!', cta: 'Compre agora' },
    ]},
    { id: 'liquidacao', label: 'Liquidacao', slides: [
      { headline: 'LIQUIDACAO!', subtext: 'Ate 70% de desconto' },
      { headline: 'Blusas', subtext: 'A partir de R$ XX' },
      { headline: 'Calcas', subtext: 'Com ate 50% OFF' },
      { headline: 'Vestidos', subtext: 'Pecas selecionadas' },
      { headline: 'Acessorios', subtext: 'Complemente seu look' },
      { headline: 'So ate acabar!', subtext: 'Corre que ta acabando', cta: 'Vem pra loja' },
      { headline: 'Frete grátis', subtext: 'Compras acima de R$ 150', cta: 'Compre online' },
    ]},
    { id: 'depoimento', label: 'Depoimento / Prova social', slides: [
      { headline: 'O que dizem de nos', subtext: 'Clientes reais, resultados reais' },
      { headline: '"Amei a qualidade!"', subtext: '- Maria S.' },
      { headline: '"Entrega super rápida"', subtext: '- Joao P.' },
      { headline: '"Virei cliente fiel"', subtext: '- Ana L.' },
      { headline: '"Melhor loja da cidade"', subtext: '- Carlos M.' },
      { headline: 'Junte-se a eles!', subtext: 'Milhares de clientes satisfeitos' },
      { headline: 'Experimente você também', subtext: 'Qualidade garantida', cta: 'Visite a loja' },
    ]},
    { id: 'personalizado', label: 'Personalizado', slides: [] },
  ],
  cosmeticos: [
    { id: 'lancamento', label: 'Lancamento de produto', slides: [
      { headline: 'Novidade!', subtext: 'Conheca nosso lancamento' },
      { headline: 'Ingredientes', subtext: 'Formula exclusiva e natural' },
      { headline: 'Resultados', subtext: 'Pele renovada em 7 dias' },
      { headline: 'Como aplicar', subtext: 'Passo a passo simples' },
      { headline: 'Antes e depois', subtext: 'Resultados comprovados' },
      { headline: 'Oferta especial', subtext: 'Preço de lancamento', cta: 'Garanta o seu' },
      { headline: 'Disponivel agora', subtext: 'Na loja e online', cta: 'Compre ja' },
    ]},
    { id: 'tutorial', label: 'Tutorial / Passo a passo', slides: [
      { headline: 'Tutorial', subtext: 'Aprenda uma tecnica nova' },
      { headline: 'Passo 1', subtext: 'Prepare a pele' },
      { headline: 'Passo 2', subtext: 'Aplique a base' },
      { headline: 'Passo 3', subtext: 'Finalize com po' },
      { headline: 'Resultado', subtext: 'Make perfeita e natural' },
      { headline: 'Produtos usados', subtext: 'Todos disponiveis na loja' },
      { headline: 'Gostou? Salve!', subtext: 'Compartilhe com as amigas', cta: 'Compre os produtos' },
    ]},
    { id: 'personalizado', label: 'Personalizado', slides: [] },
  ],
  mercearia: [
    { id: 'ofertas', label: 'Ofertas da semana', slides: [
      { headline: 'Ofertas da Semana', subtext: 'Preços que cabem no bolso' },
      { headline: 'Hortifruti', subtext: 'Fresquinho todo dia' },
      { headline: 'Acougue', subtext: 'Carnes selecionadas' },
      { headline: 'Padaria', subtext: 'Pao quentinho toda manha' },
      { headline: 'Bebidas', subtext: 'Geladas e com desconto' },
      { headline: 'Frios e laticinios', subtext: 'Qualidade garantida' },
      { headline: 'Venha conferir!', subtext: 'Válido ate sabado', cta: 'Veja o encarte' },
    ]},
    { id: 'receita', label: 'Receita do dia', slides: [
      { headline: 'Receita do Dia', subtext: 'Fácil, rápido e delicioso' },
      { headline: 'Ingredientes', subtext: 'Você encontra tudo aqui' },
      { headline: 'Modo de preparo', subtext: 'Passo 1: Prepare os ingredientes' },
      { headline: 'Passo 2', subtext: 'Misture e leve ao fogo' },
      { headline: 'Passo 3', subtext: 'Sirva e aproveite!' },
      { headline: 'Dica extra', subtext: 'Combine com um suco natural' },
      { headline: 'Ingredientes aqui!', subtext: 'Tudo na nossa mercearia', cta: 'Faca sua lista' },
    ]},
    { id: 'personalizado', label: 'Personalizado', slides: [] },
  ],
  calcados: [
    { id: 'colecao', label: 'Nova colecao', slides: [
      { headline: 'Nova Colecao!', subtext: 'Os lancamentos chegaram' },
      { headline: 'Tenis', subtext: 'Conforto para o dia a dia' },
      { headline: 'Sandalia', subtext: 'Estilo para o verao' },
      { headline: 'Social', subtext: 'Elegancia para ocasioes especiais' },
      { headline: 'Infantil', subtext: 'Calcados para os pequenos' },
      { headline: 'Preço especial', subtext: 'Lancamento com desconto', cta: 'Confira' },
      { headline: 'Visite a loja', subtext: 'Ou peca pelo WhatsApp', cta: 'Chame a gente' },
    ]},
    { id: 'personalizado', label: 'Personalizado', slides: [] },
  ],
  outro: [
    { id: 'apresentacao', label: 'O que e o negocio?', slides: [
      { headline: 'Conheca nosso negocio', subtext: 'Solucoes feitas pra você' },
      { headline: 'Nossos serviços', subtext: 'Qualidade e compromisso' },
      { headline: 'Diferenciais', subtext: 'O que nos torna unicos' },
      { headline: 'Depoimentos', subtext: 'Clientes satisfeitos' },
      { headline: 'Como funciona', subtext: 'Simples e pratico' },
      { headline: 'Fale conosco', subtext: 'Atendimento personalizado', cta: 'Chame no WhatsApp' },
      { headline: 'Venha conhecer', subtext: 'Estamos te esperando', cta: 'Saiba mais' },
    ]},
    { id: 'prova_social', label: 'Depoimento / Prova social', slides: [
      { headline: 'O que dizem de nos', subtext: 'Clientes reais' },
      { headline: '"Excelente serviço!"', subtext: '- Cliente 1' },
      { headline: '"Super recomendo"', subtext: '- Cliente 2' },
      { headline: '"Melhor custo-beneficio"', subtext: '- Cliente 3' },
      { headline: '"Atendimento top"', subtext: '- Cliente 4' },
      { headline: 'Junte-se a eles!', subtext: 'Centenas de clientes satisfeitos' },
      { headline: 'Experimente!', subtext: 'Garantia de satisfacao', cta: 'Fale conosco' },
    ]},
    { id: 'cta', label: 'Chamada para acao (CTA)', slides: [
      { headline: 'Oferta especial!', subtext: 'So por tempo limitado' },
      { headline: 'O que você ganha', subtext: 'Beneficios exclusivos' },
      { headline: 'Como funciona', subtext: 'Simples e rápido' },
      { headline: 'Resultados reais', subtext: 'Comprovado por clientes' },
      { headline: 'Preço acessivel', subtext: 'Cabe no seu bolso' },
      { headline: 'Não perca!', subtext: 'Vagas limitadas', cta: 'Garanta o seu' },
      { headline: 'Comece agora!', subtext: 'Chame no WhatsApp', cta: 'Falar com atendente' },
    ]},
    { id: 'passo_a_passo', label: 'Passo a passo: como funciona', slides: [
      { headline: 'Como funciona?', subtext: 'Veja o passo a passo' },
      { headline: 'Passo 1', subtext: 'Entre em contato conosco' },
      { headline: 'Passo 2', subtext: 'Escolha seu plano ou produto' },
      { headline: 'Passo 3', subtext: 'Receba em casa ou retire' },
      { headline: 'Pronto!', subtext: 'Simples assim' },
      { headline: 'Duvidas?', subtext: 'Estamos aqui pra ajudar' },
      { headline: 'Comece agora', subtext: 'E fácil e rápido', cta: 'Fale conosco' },
    ]},
    { id: 'seguranca', label: 'Seguranca e confianca', slides: [
      { headline: 'Por que confiar?', subtext: 'Transparencia e seguranca' },
      { headline: '+X anos no mercado', subtext: 'Experiencia comprovada' },
      { headline: 'Certificacoes', subtext: 'Qualidade reconhecida' },
      { headline: 'Politica de troca', subtext: 'Satisfacao garantida' },
      { headline: 'Pagamento seguro', subtext: 'Suas compras protegidas' },
      { headline: 'Atendimento humano', subtext: 'Pessoas reais cuidando de você' },
      { headline: 'Conte com a gente', subtext: 'Estamos aqui', cta: 'Saiba mais' },
    ]},
    { id: 'personalizado', label: 'Personalizado', slides: [] },
  ],
}

export const FONT_FAMILIES: FontFamily[] = [
  'Inter',
  'Roboto',
  'Montserrat',
  'Poppins',
  'Bebas Neue',
  'Playfair Display',
  'Oswald',
  'Raleway',
  'Lato',
  'Open Sans',
]

export const IMAGE_LAYOUTS: { id: ImageLayout; label: string }[] = [
  { id: 'background', label: 'Fundo' },
  { id: 'top', label: 'Img Topo' },
  { id: 'bottom', label: 'Img Baixo' },
  { id: 'left', label: 'Img Esquerda' },
  { id: 'right', label: 'Img Direita' },
  { id: 'big-sale', label: 'Big Sale' },
  { id: 'super-sale', label: 'Super Sale' },
  { id: 'frame', label: 'Moldura' },
  { id: 'dual-product', label: '2 Produtos' },
  { id: 'side-by-side', label: 'Lado a Lado' },
  { id: 'side-frame', label: 'Lado Moldura' },
]

// ── Random content pools (smart defaults por nicho) ──

export const RANDOM_HEADLINES: Record<string, string[]> = {
  farmacia: ['Oferta da semana', 'Super desconto', 'Imperdivel', 'So hoje!', 'Queima de estoque', 'Preço imbativel', 'Economize agora', 'Aproveite'],
  pet: ['Seu pet merece', 'Super oferta', 'Promo pet', 'Cuide com amor', 'Imperdivel', 'Novidade pet', 'Preço especial', 'Vem conferir'],
  moda: ['Liquidacao total', 'Colecao nova', 'Tendencia 2026', 'Look perfeito', 'Pecas exclusivas', 'Desconto especial', 'Estilo único'],
  cosmeticos: ['Cuide-se', 'Beleza real', 'Glow up', 'Promo beauty', 'Sua pele agradece', 'Beauty week', 'Transforme-se'],
  mercearia: ['Oferta do dia', 'Preços baixos', 'Fresquinho', 'Economia real', 'So aqui', 'Cesta cheia', 'Tem de tudo'],
  calcados: ['Mega sale', 'Conforto + estilo', 'Nova colecao', 'Imperdivel', 'Ande com estilo', 'Lancamento', 'Preço quente'],
  outro: ['Oferta imperdivel', 'Novidade', 'So hoje', 'Desconto especial', 'Aproveite', 'Lancamento', 'Confira'],
}

export const RANDOM_PRODUCTS: Record<string, string[]> = {
  farmacia: ['Vitamina C 1000mg', 'Dipirona 500mg', 'Protetor Solar FPS 50', 'Epocler', 'Neosoro', 'Dorflex', 'Benegrip', 'Shampoo Anticaspa', 'Hidratante Corporal', 'Colgate Total 12', 'Desodorante Rexona', 'Band-Aid', 'Omega 3', 'Melatonina 5mg', 'Dermocosmetico La Roche'],
  pet: ['Racao Pedigree 15kg', 'Racao Golden 10kg', 'Antipulgas Frontline', 'Brinquedo Kong', 'Coleira Antipulgas', 'Racao Royal Canin', 'Petisco DentaStix', 'Cama para Gatos', 'Shampoo Pet Clean', 'Areia Sanitaria', 'Comedouro Automático', 'Racao Whiskas', 'Osso Natural', 'Guia Retratil'],
  moda: ['Vestido Floral', 'Jaqueta Jeans', 'Tenis Casual', 'Bolsa Couro', 'Camisa Social Slim', 'Saia Midi', 'Short Jeans', 'Blazer Feminino', 'Camiseta Basica', 'Macacao Longo', 'Calca Skinny', 'Top Cropped'],
  cosmeticos: ['Serum Vitamina C', 'Kit Skincare', 'Base MAC', 'Batom Matte', 'Mascara Cilios', 'Protetor Facial', 'Hidratante Nivea', 'Perfume Importado', 'Po Compacto', 'Primer', 'Paleta Sombras', 'Esmalte Risque'],
  mercearia: ['Arroz 5kg', 'Feijao Carioca 1kg', 'Oleo de Soja', 'Acucar Cristal', 'Cafe Pilao 500g', 'Macarrao Barilla', 'Molho de Tomate', 'Leite Integral', 'Farinha de Trigo', 'Cesta Basica', 'Frutas da Estacao', 'Ovos caipira'],
  calcados: ['Tenis Nike Air Max', 'Sandalia Havaianas', 'Bota Chelsea', 'Sapato Social', 'Tenis Adidas Ultraboost', 'Chinelo Rider', 'Sapatenis Reserva', 'Tenis New Balance', 'Rasteirinha', 'Mocassim Couro'],
  outro: ['Produto Premium', 'Kit Especial', 'Combo Exclusivo', 'Lancamento', 'Edicao Limitada', 'Best Seller', 'Destaque'],
}

export const RANDOM_CTAS = ['Compre agora', 'Aproveite', 'Garanta o seu', 'Confira', 'Saiba mais', 'Veja mais', 'Quero o meu', 'Visite a loja', 'Peca ja', 'Não perca', 'Experimente', 'Reserve agora', 'Adquira ja']

export const RANDOM_EXTRAS: Record<string, string[]> = {
  farmacia: ['Válido ate sexta! Consulte disponibilidade.', 'Entrega grátis para compras acima de R$50.', 'Seus cuidados com saude pelo melhor preço.', 'Qualidade e economia para você e sua familia.', 'Consulte nosso farmaceutico.'],
  pet: ['Seu melhor amigo merece o melhor!', 'Frete grátis para pedidos acima de R$100.', 'Qualidade premium para pets felizes.', 'Veterinario recomenda!', 'Entrega rápida na sua regiao.'],
  moda: ['Pecas com estilo e conforto.', 'Vista-se com personalidade.', 'Envio para todo o Brasil.', 'Troca grátis em ate 30 dias.', 'Tendencias que você vai amar.'],
  cosmeticos: ['Sua beleza natural realcada.', 'Dermatologicamente testado.', 'Pele radiante em poucos dias.', 'Cruelty free e vegano.', 'Resultados visiveis desde a primeira aplicacao.'],
  mercearia: ['Produtos frescos todo dia.', 'Qualidade e economia na sua mesa.', 'Delivery pelo WhatsApp!', 'Ofertas validas enquanto durar o estoque.', 'Produtos selecionados da regiao.'],
  calcados: ['Conforto que você merece.', 'Frete grátis acima de R$199.', 'Design moderno e duravel.', 'Troca facilitada.', 'Do 34 ao 44, todos os tamanhos.'],
  outro: ['Oferta por tempo limitado.', 'Não perca essa oportunidade!', 'Qualidade garantida.', 'Atendimento personalizado.', 'Melhor custo-beneficio.'],
}

// Temas visuais: ajustam APENAS cores e tipografia — nunca layout de imagem ou posicao de texto
export const CARD_THEMES: CardTheme[] = [
  {
    id: 'dark_premium',
    label: 'Dark Premium 🖤',
    description: 'Estilo escuro e premium para qualquer conteudo',
    postTypes: ['promocao', 'dica', 'novidade', 'institucional', 'data_comemorativa', 'nenhum'],
    colors: { primary: '#A855F7', secondary: '#6366F1', bg: '#050508' },
    apply: { palette: 'elegante', fontFamily: 'Poppins' },
  },
  {
    id: 'natural_clean',
    label: 'Natural & Clean 🌿',
    description: 'Tom natural, ideal para saude e beleza',
    postTypes: ['promocao', 'dica', 'novidade', 'institucional', 'data_comemorativa', 'nenhum'],
    colors: { primary: '#10B981', secondary: '#3B82F6', bg: '#022c22' },
    apply: { palette: 'profissional', fontFamily: 'Lato' },
  },
  {
    id: 'vibrant_pop',
    label: 'Vibrante Pop 💜',
    description: 'Cores fortes e tipografia moderna',
    postTypes: ['promocao', 'dica', 'novidade', 'institucional', 'data_comemorativa', 'nenhum'],
    colors: { primary: '#EC4899', secondary: '#8B5CF6', bg: '#1a0a2e' },
    apply: { palette: 'vibrante', fontFamily: 'Montserrat' },
  },
  {
    id: 'sunrise_warm',
    label: 'Sunrise Warm 🔥',
    description: 'Tom quente, energizante e de alto contraste',
    postTypes: ['promocao', 'dica', 'novidade', 'institucional', 'data_comemorativa', 'nenhum'],
    colors: { primary: '#F59E0B', secondary: '#EF4444', bg: '#1c0800' },
    apply: { palette: 'quente', fontFamily: 'Bebas Neue' },
  },
  {
    id: 'corporate_blue',
    label: 'Corporativo 🏢',
    description: 'Profissional e confiavel para negocios',
    postTypes: ['promocao', 'dica', 'novidade', 'institucional', 'data_comemorativa', 'nenhum'],
    colors: { primary: '#3B82F6', secondary: '#10B981', bg: '#0f172a' },
    apply: { palette: 'profissional', fontFamily: 'Roboto' },
  },
]

export const DEFAULT_CONFIG: CardConfig = {
  format: 'feed',
  postType: 'nenhum',
  productName: '',
  headline: '',
  originalPrice: '',
  promoPrice: '',
  extraText: '',
  cta: 'Compre agora',
  ctaUrl: '',
  cardName: '',
  palette: 'vibrante',
  customColors: { primary: '#8B5CF6', secondary: '#EC4899', bg: '#1a1a2e' },
  display: { showLogo: true, showCta: true, showPrice: true, showOriginalPrice: true },
  includeImage: false,
  imageUrl: '',
  imageUrl2: '',
  imageLayout: 'background',
  imageOpacity: 40,
  imageBlur: 4,
  mediaType: 'image',
  fontFamily: 'Inter',
  fontSizes: { title: 28, subtitle: 16, price: 36, cta: 14 },
  textColor: '#ffffff',
  titleColor: '#ffffff',
  textPosition: { vertical: 'center', horizontal: 'center' },
  logoPosition: 'top-left',
  typeBadgePosition: 'inline',
  carouselShape: 'square',
  carouselSlides: 3,
  carouselSlideContents: [],
  slideImageUrls: [],
  objective: '',
  logoUrl: '',
  logoSize: 36,
}

// Labels legíveis em PT-BR para nichos (usados no prompt da IA)
export const NICHE_LABELS: Record<string, string> = {
  farmacia: 'farmacia / drogaria',
  pet: 'pet shop / produtos para pets',
  moda: 'loja de moda / vestuario',
  cosmeticos: 'loja de cosmeticos / beleza',
  mercearia: 'mercearia / mercado de bairro',
  calcados: 'loja de calcados',
  restaurante: 'restaurante',
  confeitaria: 'confeitaria / doceria',
  hamburgueria: 'hamburgueria',
  cafeteria: 'cafeteria',
  suplementos: 'loja de suplementos esportivos',
  estetica: 'clinica de estetica',
  odontologia: 'consultorio odontologico',
  academia: 'academia / estudio fitness',
  salao_beleza: 'salao de beleza',
  barbearia: 'barbearia',
  imobiliaria: 'imobiliaria',
  educacao: 'escola / cursos / educacao',
  arquitetura: 'escritorio de arquitetura',
  contabilidade: 'escritorio de contabilidade',
  viagens: 'agencia de viagens',
  eletronicos: 'loja de eletronicos',
  decoracao: 'loja de decoracao / casa',
  papelaria: 'papelaria',
  automotivo: 'loja automotiva / auto pecas',
  construcao: 'material de construcao',
  igreja: 'igreja / comunidade religiosa',
  advocacia: 'escritorio de advocacia',
  saude: 'clinica de saude',
  tecnologia: 'empresa de tecnologia',
  consultoria: 'consultoria',
  fotografia: 'estudio de fotografia',
  joalheria: 'joalheria',
  floricultura: 'floricultura',
  otica: 'otica',
  outro: 'negocio local',
}

// Real Instagram dimensions (2026)
export const REAL_DIMENSIONS: Record<Format, { w: number; h: number }> = {
  feed: { w: 1080, h: 1080 },
  stories: { w: 1080, h: 1920 },
  reels: { w: 1080, h: 1920 },
  carousel: { w: 1080, h: 1080 },
}

// Re-export types para imports convenientes
export type { PaletteId }
