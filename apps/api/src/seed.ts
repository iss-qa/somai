import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') })

import bcrypt from 'bcryptjs'
import { connectDB, Plan, AdminUser, NicheConfig, Company, User } from '@soma-ai/db'
import { PLAN_STARTER, PLAN_PRO, Niche, PostType } from '@soma-ai/shared'

async function seed() {
  const mongoUri =
    process.env.MONGO_URI || 'mongodb://localhost:27017/soma_ai_dev'

  console.log('Conectando ao MongoDB...')
  await connectDB(mongoUri)
  console.log('Conectado!')

  // ── Plans ───────────────────────────────────
  console.log('\n--- Criando planos ---')

  const existingStarter = await Plan.findOne({ slug: PLAN_STARTER.slug })
  if (!existingStarter) {
    await Plan.create({
      slug: PLAN_STARTER.slug,
      name: PLAN_STARTER.name,
      setup_price: PLAN_STARTER.setup_price,
      monthly_price: PLAN_STARTER.monthly_price,
      features: { ...PLAN_STARTER.features },
      active: true,
    })
    console.log('Plano Starter criado')
  } else {
    console.log('Plano Starter ja existe')
  }

  const existingPro = await Plan.findOne({ slug: PLAN_PRO.slug })
  if (!existingPro) {
    await Plan.create({
      slug: PLAN_PRO.slug,
      name: PLAN_PRO.name,
      setup_price: PLAN_PRO.setup_price,
      monthly_price: PLAN_PRO.monthly_price,
      features: { ...PLAN_PRO.features },
      active: true,
    })
    console.log('Plano Pro criado')
  } else {
    console.log('Plano Pro ja existe')
  }

  // ── Admin User ──────────────────────────────
  console.log('\n--- Criando admin user ---')

  const existingAdmin = await AdminUser.findOne({ email: 'admin@soma.ai' })
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 12)
    await AdminUser.create({
      name: 'Admin Soma.ai',
      email: 'admin@soma.ai',
      password_hash: passwordHash,
      role: 'superadmin',
      active: true,
    })
    console.log('Admin user criado (admin@soma.ai / admin123)')
  } else {
    console.log('Admin user ja existe')
  }

  // ── Niche Configs ───────────────────────────
  console.log('\n--- Criando niche configs ---')

  const existingFarmacia = await NicheConfig.findOne({ niche: Niche.Farmacia })
  if (!existingFarmacia) {
    await NicheConfig.create({
      niche: Niche.Farmacia,
      label: 'Farmacia',
      default_colors: {
        primary: '#0D6EFD',
        secondary: '#FFFFFF',
        accent: '#28A745',
      },
      post_types: [
        PostType.Promocao,
        PostType.Dica,
        PostType.Novidade,
        PostType.Institucional,
        PostType.DataComemorativa,
      ],
      ai_prompts: {
        card_base:
          'Crie um card visual para farmacia/drogaria. Use cores profissionais (azul, verde, branco). Destaque o produto, preco e desconto. Inclua elementos visuais que remetam a saude e bem-estar.',
        caption_base:
          'Escreva uma legenda profissional para um post de farmacia no Instagram. Use linguagem acessivel, inclua emojis relevantes e um CTA claro. Maximo 2200 caracteres.',
        video_base:
          'Crie um script de video curto (15-30s) para farmacia. Mostre o produto, destaque o preco promocional e inclua um CTA para a loja.',
      },
      default_hashtags: [
        'farmacia',
        'saude',
        'bemestar',
        'promocao',
        'desconto',
        'medicamentos',
        'cuidados',
        'beleza',
        'higiene',
        'drogaria',
      ],
    })
    console.log('NicheConfig farmacia criado')
  } else {
    console.log('NicheConfig farmacia ja existe')
  }

  const existingPet = await NicheConfig.findOne({ niche: Niche.Pet })
  if (!existingPet) {
    await NicheConfig.create({
      niche: Niche.Pet,
      label: 'Pet Shop',
      default_colors: {
        primary: '#FF6B35',
        secondary: '#FFFFFF',
        accent: '#4ECDC4',
      },
      post_types: [
        PostType.Promocao,
        PostType.Dica,
        PostType.Novidade,
        PostType.Institucional,
        PostType.DataComemorativa,
      ],
      ai_prompts: {
        card_base:
          'Crie um card visual para pet shop. Use cores alegres e amigaveis (laranja, verde agua, branco). Inclua elementos fofos que remetam a animais de estimacao. Destaque o produto e preco.',
        caption_base:
          'Escreva uma legenda divertida e acolhedora para um post de pet shop no Instagram. Use linguagem carinhosa, emojis de animais e um CTA engajador. Maximo 2200 caracteres.',
        video_base:
          'Crie um script de video curto (15-30s) para pet shop. Mostre o produto para pets, destaque beneficios e inclua imagens fofas de animais.',
      },
      default_hashtags: [
        'petshop',
        'pets',
        'cachorro',
        'gato',
        'amoanimal',
        'petlover',
        'animaisdeestimacao',
        'racaopremiun',
        'banhoetosa',
        'mundopet',
      ],
    })
    console.log('NicheConfig pet criado')
  } else {
    console.log('NicheConfig pet ja existe')
  }

  // ── Demo Companies + Users ──────────────────
  console.log('\n--- Criando empresas demo ---')

  const starterPlan = await Plan.findOne({ slug: 'starter' })
  const proPlan = await Plan.findOne({ slug: 'pro' })

  // Pet Shop Amigo (Pro)
  const existingPet2 = await Company.findOne({ slug: 'pet-shop-amigo' })
  if (!existingPet2) {
    const petCompany = await Company.create({
      name: 'Pet Shop Amigo',
      slug: 'pet-shop-amigo',
      niche: Niche.Pet,
      city: 'Salvador',
      state: 'BA',
      responsible_name: 'Maria Silva',
      whatsapp: '5571999888777',
      email: 'maria@petshopamigo.com',
      logo_url: '',
      brand_colors: { primary: '#FF6B35', secondary: '#4ECDC4' },
      plan_id: proPlan?._id || null,
      status: 'active',
      access_enabled: true,
      setup_paid: true,
      setup_paid_at: new Date(),
      setup_amount: 497,
      billing: {
        monthly_amount: 69.90,
        due_day: 10,
        overdue_days: 0,
        status: 'paid',
      },
    })

    const petUserHash = await bcrypt.hash('demo123', 12)
    await User.create({
      company_id: petCompany._id,
      name: 'Maria Silva',
      email: 'maria@petshopamigo.com',
      password_hash: petUserHash,
      role: 'owner',
      active: true,
    })
    console.log('Pet Shop Amigo criado (maria@petshopamigo.com / demo123) - Plano Pro')
  } else {
    console.log('Pet Shop Amigo ja existe')
  }

  // Farmacia Central (Starter)
  const existingFarm = await Company.findOne({ slug: 'farmacia-central' })
  if (!existingFarm) {
    const farmCompany = await Company.create({
      name: 'Farmacia Central',
      slug: 'farmacia-central',
      niche: Niche.Farmacia,
      city: 'Sao Paulo',
      state: 'SP',
      responsible_name: 'Joao Santos',
      whatsapp: '5511998877666',
      email: 'joao@farmaciacentral.com',
      logo_url: '',
      brand_colors: { primary: '#0D6EFD', secondary: '#28A745' },
      plan_id: starterPlan?._id || null,
      status: 'active',
      access_enabled: true,
      setup_paid: true,
      setup_paid_at: new Date(),
      setup_amount: 297,
      billing: {
        monthly_amount: 39.90,
        due_day: 5,
        overdue_days: 0,
        status: 'paid',
      },
    })

    const farmUserHash = await bcrypt.hash('demo123', 12)
    await User.create({
      company_id: farmCompany._id,
      name: 'Joao Santos',
      email: 'joao@farmaciacentral.com',
      password_hash: farmUserHash,
      role: 'owner',
      active: true,
    })
    console.log('Farmacia Central criado (joao@farmaciacentral.com / demo123) - Plano Starter')
  } else {
    console.log('Farmacia Central ja existe')
  }

  console.log('\n--- Seed concluido! ---')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Erro no seed:', err)
  process.exit(1)
})
