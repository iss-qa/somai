/**
 * Templates de card por nicho × tipo de post.
 * Usado para pré-preencher o formulário do gerador de cards com exemplos
 * coerentes com o segmento do usuário logado.
 */

export type TemplatePostType =
  | 'promocao'
  | 'dica'
  | 'novidade'
  | 'institucional'
  | 'data_comemorativa'

export type TemplatePalette = 'vibrante' | 'profissional' | 'quente' | 'elegante'

export type TemplateFont =
  | 'Inter'
  | 'Roboto'
  | 'Montserrat'
  | 'Playfair Display'
  | 'Oswald'
  | 'Poppins'
  | 'Bebas Neue'
  | 'Raleway'
  | 'Lato'
  | 'Open Sans'

export interface CardTemplate {
  productName: string
  headline: string
  extraText: string
  cta: string
  ctaUrl: string
  originalPrice: string
  promoPrice: string
  palette: TemplatePalette
  fontFamily: TemplateFont
  titleColor?: string
  textColor?: string
  /** Se true, o preview deve exibir preço/preço original */
  showPrice: boolean
  showOriginalPrice: boolean
}

// ---------------------------------------------------------------------------
// Assinatura visual por nicho (paleta + tipografia + CTA-padrão)
// ---------------------------------------------------------------------------

interface NicheSignature {
  palette: TemplatePalette
  fontFamily: TemplateFont
  defaultCta: string
  defaultCtaUrl?: string
}

const NICHE_SIGNATURE: Record<string, NicheSignature> = {
  farmacia:      { palette: 'profissional', fontFamily: 'Open Sans',       defaultCta: 'Reservar no WhatsApp' },
  pet:           { palette: 'vibrante',     fontFamily: 'Poppins',         defaultCta: 'Peça no WhatsApp' },
  moda:          { palette: 'elegante',     fontFamily: 'Playfair Display',defaultCta: 'Comprar agora' },
  cosmeticos:    { palette: 'elegante',     fontFamily: 'Playfair Display',defaultCta: 'Quero conhecer' },
  mercearia:     { palette: 'quente',       fontFamily: 'Montserrat',      defaultCta: 'Venha conferir' },
  calcados:      { palette: 'vibrante',     fontFamily: 'Oswald',          defaultCta: 'Garantir o meu' },
  restaurante:   { palette: 'quente',       fontFamily: 'Playfair Display',defaultCta: 'Fazer reserva' },
  confeitaria:   { palette: 'elegante',     fontFamily: 'Playfair Display',defaultCta: 'Encomendar' },
  hamburgueria:  { palette: 'quente',       fontFamily: 'Bebas Neue',      defaultCta: 'Pedir agora' },
  cafeteria:     { palette: 'quente',       fontFamily: 'Lato',            defaultCta: 'Venha tomar um café' },
  suplementos:   { palette: 'vibrante',     fontFamily: 'Oswald',          defaultCta: 'Comprar agora' },
  estetica:      { palette: 'elegante',     fontFamily: 'Playfair Display',defaultCta: 'Agendar avaliação' },
  odontologia:   { palette: 'profissional', fontFamily: 'Montserrat',      defaultCta: 'Agendar consulta' },
  academia:      { palette: 'vibrante',     fontFamily: 'Oswald',          defaultCta: 'Matricular agora' },
  salao_beleza:  { palette: 'elegante',     fontFamily: 'Playfair Display',defaultCta: 'Agendar horário' },
  barbearia:     { palette: 'quente',       fontFamily: 'Bebas Neue',      defaultCta: 'Agendar corte' },
  imobiliaria:   { palette: 'profissional', fontFamily: 'Montserrat',      defaultCta: 'Agendar visita' },
  educacao:      { palette: 'profissional', fontFamily: 'Raleway',         defaultCta: 'Inscrever-se' },
  arquitetura:   { palette: 'elegante',     fontFamily: 'Playfair Display',defaultCta: 'Falar com arquiteto' },
  contabilidade: { palette: 'profissional', fontFamily: 'Montserrat',      defaultCta: 'Solicitar orçamento' },
  viagens:       { palette: 'vibrante',     fontFamily: 'Montserrat',      defaultCta: 'Reservar agora' },
  eletronicos:   { palette: 'profissional', fontFamily: 'Roboto',          defaultCta: 'Comprar' },
  decoracao:     { palette: 'elegante',     fontFamily: 'Playfair Display',defaultCta: 'Quero decorar' },
  papelaria:     { palette: 'vibrante',     fontFamily: 'Poppins',         defaultCta: 'Comprar' },
  automotivo:    { palette: 'profissional', fontFamily: 'Oswald',          defaultCta: 'Orçar agora' },
  construcao:    { palette: 'quente',       fontFamily: 'Oswald',          defaultCta: 'Pedir orçamento' },
  igreja:        { palette: 'elegante',     fontFamily: 'Playfair Display',defaultCta: 'Participar' },
  advocacia:     { palette: 'profissional', fontFamily: 'Playfair Display',defaultCta: 'Agendar consulta' },
  saude:         { palette: 'profissional', fontFamily: 'Open Sans',       defaultCta: 'Agendar atendimento' },
  tecnologia:    { palette: 'profissional', fontFamily: 'Inter',           defaultCta: 'Falar com especialista' },
  consultoria:   { palette: 'profissional', fontFamily: 'Montserrat',      defaultCta: 'Agendar reunião' },
  fotografia:    { palette: 'elegante',     fontFamily: 'Playfair Display',defaultCta: 'Agendar sessão' },
  joalheria:     { palette: 'elegante',     fontFamily: 'Playfair Display',defaultCta: 'Quero ver mais' },
  floricultura:  { palette: 'quente',       fontFamily: 'Playfair Display',defaultCta: 'Encomendar' },
  otica:         { palette: 'profissional', fontFamily: 'Montserrat',      defaultCta: 'Experimentar' },
  outro:         { palette: 'vibrante',     fontFamily: 'Poppins',         defaultCta: 'Saiba mais' },
}

function sig(niche: string): NicheSignature {
  return NICHE_SIGNATURE[niche] || NICHE_SIGNATURE.outro
}

// ---------------------------------------------------------------------------
// Seeds específicos por nicho (produto + mensagem) para cada tipo
// ---------------------------------------------------------------------------

type Seed = Pick<
  CardTemplate,
  'productName' | 'headline' | 'extraText' | 'originalPrice' | 'promoPrice'
> & { showPrice?: boolean; showOriginalPrice?: boolean; cta?: string }

type NicheSeeds = Partial<Record<TemplatePostType, Seed>>

const SEEDS: Record<string, NicheSeeds> = {
  farmacia: {
    promocao: {
      productName: 'Dipirona 500mg · Neo Química',
      headline: 'Alívio rápido pra dor e febre',
      extraText: 'Caixa com 20 comprimidos · válido até domingo.',
      originalPrice: 'R$ 12,90',
      promoPrice: 'R$ 7,90',
      showPrice: true,
      showOriginalPrice: true,
    },
    dica: {
      productName: 'Hidratação diária',
      headline: 'Beba 2 litros de água por dia',
      extraText: 'A desidratação compromete imunidade, pele e disposição. Mantenha uma garrafinha por perto.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Ver mais dicas',
    },
    novidade: {
      productName: 'Termômetro Digital Infravermelho',
      headline: 'Chegou na farmácia!',
      extraText: 'Leitura precisa em 1 segundo, sem contato. Ideal pra família toda.',
      originalPrice: '',
      promoPrice: 'R$ 89,90',
      showPrice: true,
    },
    institucional: {
      productName: 'Sua saúde em primeiro lugar',
      headline: 'Farmácia do bairro, atendimento de hospital',
      extraText: 'Farmacêutico presente, medicamentos com procedência e entrega rápida via WhatsApp.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Conhecer a farmácia',
    },
    data_comemorativa: {
      productName: 'Dia Mundial da Saúde',
      headline: 'Cuidar de você é a nossa missão',
      extraText: 'Hoje lembramos que prevenir é sempre melhor que remediar. Aproveite pra agendar seu check-up.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Falar com farmacêutico',
    },
  },
  pet: {
    promocao: {
      productName: 'Ração Premium Golden · 15kg',
      headline: 'Ração Premium com 20% OFF',
      extraText: 'Pra cães adultos · sabor frango e arroz · entrega grátis acima de R$ 120.',
      originalPrice: 'R$ 289,90',
      promoPrice: 'R$ 229,90',
      showPrice: true,
      showOriginalPrice: true,
    },
    dica: {
      productName: 'Cuidados no verão',
      headline: 'Seu pet também sente calor',
      extraText: 'Evite passeios entre 10h e 16h, ofereça água fresca o dia inteiro e nunca deixe o pet no carro.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Ver mais dicas',
    },
    novidade: {
      productName: 'Banho & Tosa Delivery',
      headline: 'Novidade: levamos e trazemos',
      extraText: 'Agora você agenda pelo WhatsApp e a gente busca o pet em casa. Mais conforto pra ele, mais tempo pra você.',
      originalPrice: '',
      promoPrice: 'A partir de R$ 89',
      showPrice: true,
    },
    institucional: {
      productName: 'Amor em cada atendimento',
      headline: 'Seu pet merece o melhor',
      extraText: 'Mais de 10 anos cuidando da família de quatro patas do bairro. Banho, tosa, veterinário e produtos premium.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Conhecer o petshop',
    },
    data_comemorativa: {
      productName: 'Dia Mundial dos Animais',
      headline: 'Hoje o dia é deles 🐾',
      extraText: 'Comemore com quem ama a gente incondicionalmente — um banho, um petisco, um carinho extra.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Agendar mimo',
    },
  },
  moda: {
    promocao: {
      productName: 'Vestido Midi Floral · Coleção Verão',
      headline: 'Verão com 30% OFF',
      extraText: 'Peças selecionadas da coleção atual · tamanhos P ao GG · estoque limitado.',
      originalPrice: 'R$ 249,90',
      promoPrice: 'R$ 174,90',
      showPrice: true,
      showOriginalPrice: true,
    },
    dica: {
      productName: 'Look do dia',
      headline: '3 formas de usar um blazer oversized',
      extraText: 'Com jeans destroyed pro dia, vestido curto pra noite ou alfaiataria pro trabalho. Versatilidade define.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Ver coleção',
    },
    novidade: {
      productName: 'Nova Coleção · Inverno',
      headline: 'Chegou a nova coleção',
      extraText: 'Peças atemporais com toques contemporâneos. Venha conhecer na loja ou pelo WhatsApp.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Ver lookbook',
    },
    institucional: {
      productName: 'Moda feita pra você',
      headline: 'Estilo que conta a sua história',
      extraText: 'Curadoria de peças pra mulheres reais, que querem conforto sem abrir mão da elegância.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Conhecer a loja',
    },
    data_comemorativa: {
      productName: 'Dia Internacional da Mulher',
      headline: 'Pra mulher que você é todo dia',
      extraText: 'Presenteamos com 15% OFF em toda a loja. Porque você merece todos os dias, não só hoje.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Aproveitar 15% OFF',
    },
  },
  cosmeticos: {
    promocao: {
      productName: 'Sérum Vitamina C · 30ml',
      headline: 'Glow com 25% OFF',
      extraText: 'Antioxidante, ilumina e uniformiza o tom · dermatologicamente testado.',
      originalPrice: 'R$ 129,90',
      promoPrice: 'R$ 97,40',
      showPrice: true,
      showOriginalPrice: true,
    },
    dica: {
      productName: 'Skincare minimalista',
      headline: 'A rotina de 3 passos que funciona',
      extraText: 'Limpeza · hidratação · protetor solar. Constância importa mais que quantidade de produto.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Montar minha rotina',
    },
    novidade: {
      productName: 'Base Líquida HD · 12 tons',
      headline: 'Nova base, cobertura natural',
      extraText: 'Leve como CC cream, entrega como base. Disponível em 12 tons pra todos os subtons.',
      originalPrice: '',
      promoPrice: 'R$ 149,90',
      showPrice: true,
    },
    institucional: {
      productName: 'Beleza que se sente',
      headline: 'Cosméticos que respeitam sua pele',
      extraText: 'Curadoria de marcas cruelty-free, com fórmulas limpas e desempenho comprovado.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Conhecer a loja',
    },
    data_comemorativa: {
      productName: 'Dia da Beleza',
      headline: 'Presentão pra quem ama se cuidar',
      extraText: 'Kits especiais com até 40% OFF e brindes exclusivos. Aproveite enquanto o estoque dura.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Ver kits',
    },
  },
  mercearia: {
    promocao: {
      productName: 'Feijão Carioca · Pacote 1kg',
      headline: 'Feijão do mês por R$ 6,99',
      extraText: 'Tipo 1 · válido até sábado · limite 3 un. por cliente.',
      originalPrice: 'R$ 9,49',
      promoPrice: 'R$ 6,99',
      showPrice: true,
      showOriginalPrice: true,
    },
    dica: {
      productName: 'Feira da semana',
      headline: 'Receita fácil com o que tem em casa',
      extraText: 'Arroz, feijão, ovo frito e banana frita: o combo brasileiro que resolve qualquer dia difícil.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Ver mais receitas',
    },
    novidade: {
      productName: 'Delivery próprio',
      headline: 'Agora entregamos em casa',
      extraText: 'Pedidos acima de R$ 50 com entrega grátis no bairro. Peça pelo WhatsApp.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Pedir no WhatsApp',
    },
    institucional: {
      productName: 'O mercado do seu bairro',
      headline: 'Preço justo, atendimento de verdade',
      extraText: 'Tradição em servir com qualidade. Aqui você é chamado pelo nome, não por um número.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Conhecer a mercearia',
    },
    data_comemorativa: {
      productName: 'Dia do Cliente',
      headline: '10% OFF em todas as compras',
      extraText: 'Nosso jeito de agradecer: desconto na loja toda, só hoje. Venha fazer sua feira.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Ir fazer compras',
    },
  },
  hamburgueria: {
    promocao: {
      productName: 'Combo Double Bacon',
      headline: 'Double Bacon + Fritas + Coca',
      extraText: 'Carne 180g, cheddar, bacon crocante e nosso molho da casa. Só hoje no combo.',
      originalPrice: 'R$ 52,90',
      promoPrice: 'R$ 39,90',
      showPrice: true,
      showOriginalPrice: true,
    },
    dica: {
      productName: 'Hack do hambúrguer',
      headline: 'Como pedir o burger perfeito',
      extraText: 'Carne no ponto, queijo derretido de verdade e pão brioche tostado. Detalhe faz a diferença.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Quero provar',
    },
    novidade: {
      productName: 'Smash Truffle',
      headline: 'Novidade pesada no cardápio',
      extraText: 'Duas carnes smash, gruyère, maionese de trufa e cebola caramelizada. Delírio total.',
      originalPrice: '',
      promoPrice: 'R$ 42,90',
      showPrice: true,
    },
    institucional: {
      productName: 'Burger artesanal de verdade',
      headline: 'Carne fresca, pão próprio, amor na brasa',
      extraText: 'Moemos nossa carne todo dia, assamos nossos pães todo dia. Nada congelado, nada industrial.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Conhecer a casa',
    },
    data_comemorativa: {
      productName: 'Dia do Hambúrguer',
      headline: 'Hoje o rei é o burger 👑',
      extraText: 'Compre um combo e leve outro pela metade do preço. Só hoje, pra comemorar em dobro.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Pedir combo 2x1',
    },
  },
  confeitaria: {
    promocao: {
      productName: 'Bolo Recheado · 1kg',
      headline: 'Bolo pra o fim de semana',
      extraText: 'Recheios de ninho com morango, brigadeiro ou prestígio. Encomende com 24h de antecedência.',
      originalPrice: 'R$ 129,90',
      promoPrice: 'R$ 99,90',
      showPrice: true,
      showOriginalPrice: true,
    },
    dica: {
      productName: 'Dica de doceira',
      headline: 'O segredo do brigadeiro gourmet',
      extraText: 'Leite condensado + creme de leite + chocolate 70% de qualidade. Fogo baixo e paciência.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Ver mais receitas',
    },
    novidade: {
      productName: 'Cheesecake de Frutas Vermelhas',
      headline: 'Nova estrela da vitrine',
      extraText: 'Base de biscoito, massa cremosa de cream cheese e geleia artesanal das frutas vermelhas.',
      originalPrice: '',
      promoPrice: 'R$ 18,90 a fatia',
      showPrice: true,
    },
    institucional: {
      productName: 'Afeto em forma de doce',
      headline: 'Feito à mão, com ingrediente de verdade',
      extraText: 'Receitas de família, confeitaria artesanal, e aquele cafezinho que combina com cada doce.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Visitar a confeitaria',
    },
    data_comemorativa: {
      productName: 'Dia das Mães',
      headline: 'Um doce pra quem adoça a sua vida',
      extraText: 'Encomende até sexta o bolo da comemoração. Opções sem lactose, sem glúten e veganas.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Encomendar agora',
    },
  },
  cafeteria: {
    promocao: {
      productName: 'Cappuccino + Croissant',
      headline: 'Combo Café da Manhã',
      extraText: 'De segunda a sexta, das 7h às 10h. Comece o dia como merece.',
      originalPrice: 'R$ 24,90',
      promoPrice: 'R$ 17,90',
      showPrice: true,
      showOriginalPrice: true,
    },
    dica: {
      productName: 'Hora certa do café',
      headline: 'Por que o primeiro café não deveria ser às 7h',
      extraText: 'Cortisol alto no início da manhã reduz o efeito da cafeína. Espere até 9h30 — você vai sentir.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Ver mais dicas',
    },
    novidade: {
      productName: 'Torra especial · Sul de Minas',
      headline: 'Chegou o nosso grão do mês',
      extraText: 'Notas de chocolate amargo, caramelo e uma acidez suave de frutas cítricas. Torra clara.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Experimentar',
    },
    institucional: {
      productName: 'Sua pausa favorita',
      headline: 'Café de verdade, ambiente pra ficar',
      extraText: 'Grãos selecionados, barista que sabe o nome do seu pedido e aquele canto perfeito pra respirar.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Visitar a cafeteria',
    },
    data_comemorativa: {
      productName: 'Dia Internacional do Café',
      headline: 'Um brinde ao que nos move ☕',
      extraText: 'O segundo café da casa é por nossa conta. Traga um amigo pra comemorar com a gente.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Ir tomar café',
    },
  },
  restaurante: {
    promocao: {
      productName: 'Rodízio de Carnes · Almoço',
      headline: 'Domingo em família',
      extraText: 'Rodízio completo + buffet de saladas + sobremesa. Crianças até 5 anos não pagam.',
      originalPrice: 'R$ 89,90',
      promoPrice: 'R$ 69,90',
      showPrice: true,
      showOriginalPrice: true,
    },
    dica: {
      productName: 'Harmonização',
      headline: 'O vinho certo pra cada carne',
      extraText: 'Carnes vermelhas pedem tintos encorpados. Brancos e rosés ficam pra carnes mais leves.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Ver cardápio',
    },
    novidade: {
      productName: 'Menu executivo · Almoço',
      headline: 'Novo menu executivo',
      extraText: 'Entrada, prato principal e sobremesa em 45 minutos. Pensado pra quem tem hora marcada.',
      originalPrice: '',
      promoPrice: 'R$ 54,90',
      showPrice: true,
    },
    institucional: {
      productName: 'Sabor e hospitalidade',
      headline: 'Onde todo mundo vira da família',
      extraText: 'Receitas autorais, ingredientes locais e um atendimento que transforma cliente em frequentador.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Reservar mesa',
    },
    data_comemorativa: {
      productName: 'Dia dos Namorados',
      headline: 'Menu especial a dois',
      extraText: 'Entrada · principal · sobremesa · taça de espumante. Reservas limitadas pra noite mais romântica do ano.',
      originalPrice: '',
      promoPrice: 'R$ 189 o casal',
      showPrice: true,
    },
  },
  barbearia: {
    promocao: {
      productName: 'Corte + Barba',
      headline: 'Combo da semana',
      extraText: 'Corte máquina ou tesoura + barba modelada + toalha quente. Agende com antecedência.',
      originalPrice: 'R$ 79,00',
      promoPrice: 'R$ 59,00',
      showPrice: true,
      showOriginalPrice: true,
    },
    dica: {
      productName: 'Rotina do bigode',
      headline: 'Cuidado semanal com a barba',
      extraText: 'Shampoo próprio · óleo hidratante · pente fino. Barba bonita é barba cuidada.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Conhecer produtos',
    },
    novidade: {
      productName: 'Pigmentação de barba',
      headline: 'Novo serviço: pigmentação',
      extraText: 'Preenche falhas e disfarça os fios brancos com naturalidade. Resultado que dura até 3 semanas.',
      originalPrice: '',
      promoPrice: 'A partir de R$ 80',
      showPrice: true,
    },
    institucional: {
      productName: 'Do clássico ao moderno',
      headline: 'Barbearia com estilo e precisão',
      extraText: 'Barbeiros especializados, ambiente pra relaxar e um cafezinho enquanto o corte rola.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Conhecer a barbearia',
    },
    data_comemorativa: {
      productName: 'Dia dos Pais',
      headline: 'Presente que ele vai usar',
      extraText: 'Vale-presente do combo corte + barba. Embalagem especial pra comemorar sem pensar em prenda chata.',
      originalPrice: '',
      promoPrice: 'R$ 89',
      showPrice: true,
    },
  },
  salao_beleza: {
    promocao: {
      productName: 'Progressiva + Hidratação',
      headline: 'Cabelão liso o mês inteiro',
      extraText: 'Técnica sem formol · reconstrução capilar inclusa · agendamento limitado.',
      originalPrice: 'R$ 389',
      promoPrice: 'R$ 279',
      showPrice: true,
      showOriginalPrice: true,
    },
    dica: {
      productName: 'Dica capilar',
      headline: '3 hábitos que estão danificando seu cabelo',
      extraText: 'Dormir com cabelo molhado · prender úmido · água muito quente no banho. Troque hoje.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Falar com cabeleireira',
    },
    novidade: {
      productName: 'Pacote Noiva',
      headline: 'Novo pacote pra noivas',
      extraText: 'Teste de maquiagem · teste de penteado · dia do casamento com assistente pessoal.',
      originalPrice: '',
      promoPrice: 'A partir de R$ 890',
      showPrice: true,
    },
    institucional: {
      productName: 'Beleza sob medida',
      headline: 'Cada cliente é uma história',
      extraText: 'Diagnóstico personalizado, técnicas atualizadas e produtos profissionais pra o seu fio.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Agendar avaliação',
    },
    data_comemorativa: {
      productName: 'Dia das Mães',
      headline: 'Presentão pra ela se sentir linda',
      extraText: 'Vale-presente com escova, manicure e hidratação. Embalagem pronta pra entregar.',
      originalPrice: '',
      promoPrice: 'R$ 149',
      showPrice: true,
    },
  },
  estetica: {
    promocao: {
      productName: 'Pacote Drenagem Linfática · 10 sessões',
      headline: 'Corpo leve, pele iluminada',
      extraText: 'Resultados visíveis em 4 semanas · bio-impedância inclusa · avaliação gratuita.',
      originalPrice: 'R$ 1.200',
      promoPrice: 'R$ 890',
      showPrice: true,
      showOriginalPrice: true,
    },
    dica: {
      productName: 'Skincare + estética',
      headline: 'O que fazer antes do peeling',
      extraText: 'Pare o ácido 7 dias antes, reforce o protetor solar e evite exposição direta ao sol. Preparo importa.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Agendar avaliação',
    },
    novidade: {
      productName: 'Radiofrequência facial',
      headline: 'Novo protocolo anti-idade',
      extraText: 'Ativa colágeno e trata flacidez sem agulhas, sem downtime. Indicado a partir dos 30.',
      originalPrice: '',
      promoPrice: 'R$ 290 a sessão',
      showPrice: true,
    },
    institucional: {
      productName: 'Estética integrativa',
      headline: 'Resultado real, cuidado de verdade',
      extraText: 'Avaliação com biomédica, protocolos personalizados e aparelhos de última geração.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Agendar avaliação',
    },
    data_comemorativa: {
      productName: 'Dia Internacional da Mulher',
      headline: 'Um presente pra você se cuidar',
      extraText: 'Pacote autocuidado com 20% OFF. Porque você merece todo dia, não só no dia 8.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Ver pacotes',
    },
  },
  academia: {
    promocao: {
      productName: 'Matrícula Anual · sem joia',
      headline: 'Ano novo, corpo novo',
      extraText: 'Acesso ilimitado a musculação, aulas coletivas e spa. Avaliação física inclusa.',
      originalPrice: 'R$ 199/mês',
      promoPrice: 'R$ 129/mês',
      showPrice: true,
      showOriginalPrice: true,
    },
    dica: {
      productName: 'Treino eficiente',
      headline: 'Por que você não tá evoluindo',
      extraText: 'Falta de progressão de carga, pouco descanso e nutrição desalinhada. Ajuste os 3 e veja a diferença.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Falar com personal',
    },
    novidade: {
      productName: 'Aula de HIIT · 30min',
      headline: 'Novo horário de HIIT',
      extraText: 'Treino de alta intensidade em 30 minutos. Perfeito pra quem tem pouco tempo e muito objetivo.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Garantir minha vaga',
    },
    institucional: {
      productName: 'Treino com método',
      headline: 'A academia que muda resultados',
      extraText: 'Equipamentos novos, professores formados e acompanhamento individualizado pra cada objetivo.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Conhecer academia',
    },
    data_comemorativa: {
      productName: 'Dia do Desafio',
      headline: 'Vem o seu desafio: 21 dias',
      extraText: 'Treino + nutricionista + avaliação antes e depois. Vaga limitada pra começar essa semana.',
      originalPrice: '',
      promoPrice: 'R$ 249 o desafio',
      showPrice: true,
    },
  },
  floricultura: {
    promocao: {
      productName: 'Buquê de Rosas Colombianas · 12 unid',
      headline: 'Buquê pra fazer bonito',
      extraText: 'Rosas importadas, embalagem artesanal e entrega no mesmo dia na região.',
      originalPrice: 'R$ 189',
      promoPrice: 'R$ 149',
      showPrice: true,
      showOriginalPrice: true,
    },
    dica: {
      productName: 'Flores que duram',
      headline: '3 truques pra flor durar o dobro',
      extraText: 'Corte diagonal no caule, troca diária da água e uma colher de açúcar. Simples e funciona.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Ver buquês',
    },
    novidade: {
      productName: 'Assinatura semanal',
      headline: 'Novo: flores toda semana em casa',
      extraText: 'Um buquê novo toda quarta, direto na sua porta. Pense em um mimo que se renova.',
      originalPrice: '',
      promoPrice: 'A partir de R$ 89/semana',
      showPrice: true,
    },
    institucional: {
      productName: 'Flores com história',
      headline: 'Do cerrado direto pra sua mesa',
      extraText: 'Curadoria de flores nacionais e importadas, arranjos pensados pra cada ocasião.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Conhecer a loja',
    },
    data_comemorativa: {
      productName: 'Dia das Mães',
      headline: 'Flor é amor em forma de presente',
      extraText: 'Encomende até sábado e garanta entrega no domingo. Cartão personalizado incluso.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Encomendar buquê',
    },
  },
  papelaria: {
    promocao: {
      productName: 'Kit Volta às Aulas',
      headline: 'Volta às aulas com 25% OFF',
      extraText: 'Caderno + estojo + conjunto de canetas + lápis. Tudo que a criançada precisa.',
      originalPrice: 'R$ 129',
      promoPrice: 'R$ 89',
      showPrice: true,
      showOriginalPrice: true,
    },
    dica: {
      productName: 'Organização',
      headline: 'Bullet Journal: por onde começar',
      extraText: 'Caderno pontilhado, caneta preta 0.5 e 4 canetas coloridas. Comece simples, melhore com o uso.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Ver produtos',
    },
    novidade: {
      productName: 'Cadernos Personalizados',
      headline: 'Novo: personalize seu caderno',
      extraText: 'Nome impresso na capa, cores à escolha e papel premium. Fica pronto em 48h.',
      originalPrice: '',
      promoPrice: 'R$ 49,90',
      showPrice: true,
    },
    institucional: {
      productName: 'Papelaria que inspira',
      headline: 'Materiais pra quem ama escrever',
      extraText: 'Curadoria de papelaria nacional e importada, com desconto pra estudantes e criadores.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Conhecer a loja',
    },
    data_comemorativa: {
      productName: 'Dia do Estudante',
      headline: 'Descontão pra quem estuda',
      extraText: 'Apresente a carteirinha e ganhe 15% OFF em toda a loja. Só hoje.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Aproveitar desconto',
    },
  },
  calcados: {
    promocao: {
      productName: 'Tênis Running · unissex',
      headline: 'Tênis que corre com você',
      extraText: 'Solado amortecido, drop 10mm e respirabilidade reforçada. Numerações 34 ao 44.',
      originalPrice: 'R$ 499',
      promoPrice: 'R$ 349',
      showPrice: true,
      showOriginalPrice: true,
    },
    dica: {
      productName: 'Troca do tênis',
      headline: 'Quando trocar o tênis de corrida',
      extraText: 'A cada 500 a 800km ou quando o amortecimento tá marcado. Tênis velho machuca joelho.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Ver coleção',
    },
    novidade: {
      productName: 'Sandália de Couro · verão',
      headline: 'Chegou a coleção verão',
      extraText: 'Couro legítimo, solado de borracha e palmilha anatômica. Estilo que acompanha o clima.',
      originalPrice: '',
      promoPrice: 'R$ 289',
      showPrice: true,
    },
    institucional: {
      productName: 'Calçado com caimento',
      headline: 'O calçado certo pro seu pé',
      extraText: 'Sapateiros que medem, orientam e ajustam. Aqui ninguém sai com sapato que aperta.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Visitar a loja',
    },
    data_comemorativa: {
      productName: 'Black Friday',
      headline: 'Black Friday · até 60% OFF',
      extraText: 'Tênis, sandálias, botas e sapatênis selecionados. Chega cedo, o estoque voa.',
      originalPrice: '',
      promoPrice: '',
      cta: 'Ver ofertas',
    },
  },
}

// ---------------------------------------------------------------------------
// Templates genéricos por tipo (fallback quando nicho não tem seed)
// ---------------------------------------------------------------------------

function genericSeed(nicheLabel: string, type: TemplatePostType): Seed {
  switch (type) {
    case 'promocao':
      return {
        productName: 'Produto/Serviço em destaque',
        headline: 'Oferta especial da semana',
        extraText: `Condição exclusiva pra clientes do nosso ${nicheLabel}. Aproveite enquanto o estoque dura.`,
        originalPrice: 'R$ 199',
        promoPrice: 'R$ 149',
        showPrice: true,
        showOriginalPrice: true,
      }
    case 'dica':
      return {
        productName: 'Dica da semana',
        headline: 'O que ninguém te contou',
        extraText: `Um segredo simples que a gente aprendeu em anos de ${nicheLabel}. Testa — você vai ver a diferença.`,
        originalPrice: '',
        promoPrice: '',
      }
    case 'novidade':
      return {
        productName: 'Novidade na casa',
        headline: 'Chegou uma novidade 👀',
        extraText: `Queremos te mostrar em primeira mão o que preparamos pro próximo mês no ${nicheLabel}.`,
        originalPrice: '',
        promoPrice: '',
      }
    case 'institucional':
      return {
        productName: 'Quem somos',
        headline: 'Mais que um negócio, uma história',
        extraText: `Há anos atendendo nossos clientes com excelência e dedicação no ${nicheLabel}. Venha fazer parte.`,
        originalPrice: '',
        promoPrice: '',
      }
    case 'data_comemorativa':
      return {
        productName: 'Data especial',
        headline: 'Hoje tem motivo pra celebrar',
        extraText: `E a gente não podia deixar passar. Confere a homenagem que preparamos nossos clientes do ${nicheLabel}.`,
        originalPrice: '',
        promoPrice: '',
      }
  }
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

const NICHE_LABELS: Record<string, string> = {
  farmacia: 'farmácia',
  pet: 'pet shop',
  moda: 'loja de moda',
  cosmeticos: 'loja de cosméticos',
  mercearia: 'mercearia',
  calcados: 'loja de calçados',
  restaurante: 'restaurante',
  confeitaria: 'confeitaria',
  hamburgueria: 'hamburgueria',
  cafeteria: 'cafeteria',
  suplementos: 'loja de suplementos',
  estetica: 'clínica de estética',
  odontologia: 'consultório',
  academia: 'academia',
  salao_beleza: 'salão',
  barbearia: 'barbearia',
  imobiliaria: 'imobiliária',
  educacao: 'centro de ensino',
  arquitetura: 'escritório de arquitetura',
  contabilidade: 'escritório de contabilidade',
  viagens: 'agência de viagens',
  eletronicos: 'loja de eletrônicos',
  decoracao: 'loja de decoração',
  papelaria: 'papelaria',
  automotivo: 'auto peças',
  construcao: 'loja de materiais',
  igreja: 'comunidade',
  advocacia: 'escritório de advocacia',
  saude: 'clínica',
  tecnologia: 'empresa de tecnologia',
  consultoria: 'consultoria',
  fotografia: 'estúdio de fotografia',
  joalheria: 'joalheria',
  floricultura: 'floricultura',
  otica: 'ótica',
  outro: 'negócio',
}

export function getCardTemplate(
  niche: string | undefined,
  postType: TemplatePostType,
): CardTemplate {
  const key = niche || 'outro'
  const signature = sig(key)
  const label = NICHE_LABELS[key] || NICHE_LABELS.outro
  const seed: Seed = SEEDS[key]?.[postType] ?? genericSeed(label, postType)

  return {
    productName: seed.productName,
    headline: seed.headline,
    extraText: seed.extraText,
    originalPrice: seed.originalPrice ?? '',
    promoPrice: seed.promoPrice ?? '',
    cta: seed.cta ?? signature.defaultCta,
    ctaUrl: signature.defaultCtaUrl ?? '',
    palette: signature.palette,
    fontFamily: signature.fontFamily,
    showPrice: seed.showPrice ?? false,
    showOriginalPrice: seed.showOriginalPrice ?? false,
  }
}
