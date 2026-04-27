/**
 * Seed de datas comemorativas mais relevantes para marketing brasileiro.
 * Idempotente (upsert por date+name).
 *
 * Rodar:
 *   cd apps/api && pnpm tsx src/scripts/seed-datas.ts
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB, DatesCalendar } from '@soma-ai/db'

// "todos" = relevante pra qualquer nicho
const DATAS: Array<{
  date: string // MM-DD
  name: string
  description: string
  niches: string[]
  suggested_headline?: string
}> = [
  { date: '01-01', name: 'Ano Novo', description: 'Boas vindas ao novo ano', niches: ['todos'], suggested_headline: 'Um novo comeco comeca agora' },
  { date: '02-02', name: 'Dia de Iemanja', description: 'Religiosidade e tradicao', niches: ['todos'] },
  { date: '03-08', name: 'Dia Internacional da Mulher', description: 'Homenagem as mulheres', niches: ['todos'], suggested_headline: 'Forca, beleza e poder feminino' },
  { date: '03-15', name: 'Dia do Consumidor', description: 'Ofertas especiais', niches: ['todos'], suggested_headline: 'Promocoes imperdiveis para voce' },
  { date: '04-21', name: 'Tiradentes', description: 'Feriado nacional', niches: ['todos'] },
  { date: '05-01', name: 'Dia do Trabalhador', description: 'Homenagem ao trabalhador', niches: ['todos'] },
  { date: '05-11', name: 'Dia das Maes (2 semana de maio)', description: 'Segunda maior data do varejo', niches: ['todos'], suggested_headline: 'Para a pessoa mais especial do mundo' },
  { date: '06-12', name: 'Dia dos Namorados', description: 'Comercio forte para casais', niches: ['todos', 'moda', 'cosmeticos', 'joalheria', 'restaurante'], suggested_headline: 'Celebre o amor em grande estilo' },
  { date: '07-20', name: 'Dia do Amigo', description: 'Amizade e conexao', niches: ['todos'] },
  { date: '08-11', name: 'Dia dos Pais (2 domingo de agosto)', description: 'Data forte no varejo', niches: ['todos'], suggested_headline: 'O melhor presente para o melhor pai' },
  { date: '09-07', name: 'Independencia do Brasil', description: 'Feriado nacional', niches: ['todos'] },
  { date: '09-15', name: 'Dia do Cliente', description: 'Valorizacao do cliente', niches: ['todos'], suggested_headline: 'Obrigado por fazer parte da nossa historia' },
  { date: '10-12', name: 'Dia das Criancas', description: 'Data forte em varios segmentos', niches: ['todos', 'moda', 'papelaria', 'eletronicos', 'confeitaria'], suggested_headline: 'A alegria das criancas esta aqui' },
  { date: '10-15', name: 'Dia do Professor', description: 'Homenagem aos educadores', niches: ['educacao', 'papelaria', 'todos'] },
  { date: '11-15', name: 'Proclamacao da Republica', description: 'Feriado nacional', niches: ['todos'] },
  { date: '11-27', name: 'Black Friday', description: 'Maior data de vendas do ano', niches: ['todos'], suggested_headline: 'As ofertas mais loucas do ano' },
  { date: '12-25', name: 'Natal', description: 'Festa mais aguardada do ano', niches: ['todos'], suggested_headline: 'Um Natal cheio de amor e ofertas' },
  { date: '12-31', name: 'Reveillon', description: 'Festa de fim de ano', niches: ['todos'] },

  // Nichos específicos
  { date: '04-01', name: 'Dia da Mentira', description: 'Brincadeira tematica', niches: ['todos'] },
  { date: '05-03', name: 'Dia do Pet (Brasil)', description: 'Celebracao dos animais', niches: ['pet', 'todos'] },
  { date: '07-28', name: 'Dia do Agricultor', description: '', niches: ['todos'] },
  { date: '10-05', name: 'Dia Mundial do Medico', description: '', niches: ['saude', 'todos'] },
  { date: '10-25', name: 'Dia do Dentista', description: '', niches: ['odontologia'] },
  { date: '09-27', name: 'Dia da Secretaria', description: '', niches: ['todos'] },
  { date: '06-15', name: 'Dia do Cabeleireiro', description: '', niches: ['salao_beleza', 'barbearia'] },
  { date: '08-25', name: 'Dia do Soldado', description: '', niches: ['todos'] },

  // Feriados nacionais fixos adicionais
  { date: '10-12', name: 'Nossa Senhora Aparecida', description: 'Padroeira do Brasil — feriado nacional', niches: ['todos'] },
  { date: '11-02', name: 'Finados', description: 'Feriado nacional', niches: ['todos'] },
  { date: '11-20', name: 'Dia da Consciencia Negra', description: 'Feriado nacional — homenagem a Zumbi dos Palmares', niches: ['todos'], suggested_headline: 'Reconhecimento, respeito e representatividade' },

  // Datas culturais fortes
  { date: '06-13', name: 'Santo Antonio', description: 'Dia dos casamenteiros — abre o ciclo junino', niches: ['todos', 'restaurante', 'confeitaria'] },
  { date: '06-24', name: 'Sao Joao', description: 'Maior festa popular do Nordeste', niches: ['todos', 'restaurante', 'moda', 'confeitaria'], suggested_headline: 'Arraia chegou! Bora celebrar Sao Joao' },
  { date: '06-29', name: 'Sao Pedro', description: 'Encerra o ciclo junino', niches: ['todos'] },

  // Bahia — feriados e datas regionais
  { date: '07-02', name: 'Independencia da Bahia (Dois de Julho)', description: 'Feriado estadual — comemora a expulsao das tropas portuguesas em 1823', niches: ['todos'], suggested_headline: 'Bahia, terra de luta e liberdade' },
  { date: '01-06', name: 'Lavagem do Bonfim (1 quinta de janeiro)', description: 'Tradicao baiana — fe e cultura em Salvador', niches: ['todos'] },
  { date: '08-15', name: 'Festa de Nossa Senhora da Boa Morte (Cachoeira-BA)', description: 'Patrimonio cultural afro-brasileiro', niches: ['todos'] },
  { date: '12-04', name: 'Santa Barbara', description: 'Padroeira dos bombeiros — forte tradicao baiana', niches: ['todos'] },
  { date: '12-08', name: 'Nossa Senhora da Conceicao da Praia', description: 'Padroeira da cidade de Salvador', niches: ['todos'] },
]

async function run() {
  await connectDB(
    process.env.MONGO_URI || 'mongodb://localhost:27017/soma_ai_dev',
  )
  console.log('[seed] Datas comemorativas...')

  // Desativa entradas legadas/AI nao curadas para que o dashboard so
  // mostre as datas oficiais (nacionais + regionais BA). Admin pode
  // reativar manualmente quando houver painel.
  const legacy = await DatesCalendar.updateMany(
    { source: { $nin: ['soma', 'admin'] } },
    { $set: { active: false } },
  )
  console.log(`[seed] ${legacy.modifiedCount || 0} entradas legadas desativadas.`)

  for (const d of DATAS) {
    await DatesCalendar.findOneAndUpdate(
      { date: d.date, name: d.name },
      {
        $set: {
          description: d.description,
          niches: d.niches,
          suggested_headline: d.suggested_headline || '',
          active: true,
          source: 'soma',
        },
      },
      { upsert: true },
    )
  }
  console.log(`[seed] ${DATAS.length} datas curadas upsertadas.`)
  await mongoose.disconnect()
}

run().catch((err) => {
  console.error('[seed] erro:', err)
  process.exit(1)
})
