import { test, expect } from '@playwright/test'

const API = 'http://localhost:3001'
let adminToken: string

test.describe('Comunicacao WhatsApp', () => {
  test.beforeAll(async () => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@soma.ai', password: 'admin123' }),
    })
    const data = await res.json()
    adminToken = data.token
    expect(adminToken).toBeTruthy()
  })

  test.describe('GET /api/admin/comunicacao/stats', () => {
    test('retorna estatisticas de mensagens', async () => {
      const res = await fetch(`${API}/api/admin/comunicacao/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(typeof data.total_enviadas).toBe('number')
      expect(typeof data.total_pendentes).toBe('number')
      expect(typeof data.total_falhas).toBe('number')
      expect(typeof data.enviadas_hoje).toBe('number')
    })
  })

  test.describe('GET /api/admin/comunicacao/historico', () => {
    test('retorna historico paginado', async () => {
      const res = await fetch(`${API}/api/admin/comunicacao/historico?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data.mensagens)).toBe(true)
      expect(typeof data.total).toBe('number')
      expect(typeof data.page).toBe('number')
      expect(typeof data.pages).toBe('number')
    })

    test('filtra por tipo boas_vindas', async () => {
      const res = await fetch(`${API}/api/admin/comunicacao/historico?tipo=boas_vindas`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      for (const msg of data.mensagens) {
        expect(msg.tipo).toBe('boas_vindas')
      }
    })

    test('filtra por status enviado', async () => {
      const res = await fetch(`${API}/api/admin/comunicacao/historico?status=enviado`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      for (const msg of data.mensagens) {
        expect(msg.status).toBe('enviado')
      }
    })
  })

  test.describe('GET /api/admin/comunicacao/queue-status', () => {
    test('retorna status da fila', async () => {
      const res = await fetch(`${API}/api/admin/comunicacao/queue-status`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(typeof data.waiting).toBe('number')
      expect(typeof data.active).toBe('number')
      expect(typeof data.failed).toBe('number')
      expect(typeof data.completed).toBe('number')
    })
  })

  test.describe('GET /api/admin/comunicacao/companies', () => {
    test('lista empresas para filtro', async () => {
      const res = await fetch(`${API}/api/admin/comunicacao/companies`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  test.describe('POST /api/admin/comunicacao/enviar-manual', () => {
    test('rejeita mensagem vazia', async () => {
      const res = await fetch(`${API}/api/admin/comunicacao/enviar-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ mensagem: '', escopo: 'todos' }),
      })
      expect(res.status).toBe(400)
    })

    test('rejeita escopo company_especifica sem company_id', async () => {
      const res = await fetch(`${API}/api/admin/comunicacao/enviar-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ mensagem: 'teste', escopo: 'company_especifica' }),
      })
      expect(res.status).toBe(400)
    })

    test('envia mensagem manual para empresa Juntix', async () => {
      // Buscar empresa Juntix
      const companiesRes = await fetch(`${API}/api/admin/comunicacao/companies`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      const companies = await companiesRes.json()
      const juntix = companies.find((c: any) =>
        c.name?.toLowerCase().includes('juntix'),
      )

      if (!juntix) {
        test.skip()
        return
      }

      const res = await fetch(`${API}/api/admin/comunicacao/enviar-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          mensagem: 'Teste E2E - mensagem manual Soma.ai',
          escopo: 'company_especifica',
          company_id: juntix._id,
        }),
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.enviados).toBeGreaterThanOrEqual(1)
    })
  })

  test.describe('Boas-vindas ao cadastrar empresa', () => {
    let companyId: string

    test('cadastra empresa fake e dispara boas-vindas para 7197242860', async () => {
      const res = await fetch(`${API}/api/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Empresa Teste Boas Vindas',
          slug: `teste-boas-vindas-${Date.now()}`,
          niche: 'outro',
          city: 'Salvador',
          state: 'BA',
          responsible_name: 'Cliente Teste',
          whatsapp: '7197242860',
          email: `teste-${Date.now()}@boas-vindas.com`,
          plan: 'starter',
        }),
      })
      expect(res.status).toBe(201)
      const data = await res.json()
      companyId = data._id
      expect(companyId).toBeTruthy()
    })

    test('mensagem de boas-vindas aparece no historico', async () => {
      if (!companyId) return

      // Aguarda processamento async da mensagem
      await new Promise((r) => setTimeout(r, 5000))

      const res = await fetch(
        `${API}/api/admin/comunicacao/historico?company_id=${companyId}&tipo=boas_vindas`,
        { headers: { Authorization: `Bearer ${adminToken}` } },
      )
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.total).toBeGreaterThanOrEqual(1)
      expect(data.mensagens[0].tipo).toBe('boas_vindas')
      expect(data.mensagens[0].destinatario_telefone).toBe('7197242860')
    })
  })

  test.describe('POST /api/admin/comunicacao/resend/:id', () => {
    test('retorna 404 para mensagem inexistente', async () => {
      const res = await fetch(
        `${API}/api/admin/comunicacao/resend/000000000000000000000000`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      )
      expect(res.status).toBe(404)
    })
  })

  test.describe('Tipos de mensagem validos', () => {
    const tiposEsperados = [
      'boas_vindas',
      'card_publicado',
      'card_agendado',
      'lembrete_mensalidade',
      'boleto_setup',
      'boleto_mensalidade',
      'confirmacao_pagamento',
      'alerta_atraso',
      'trial_expirando',
      'acesso_bloqueado',
      'erro_postagem',
      'manual',
    ]

    test('historico aceita filtragem por todos os tipos', async () => {
      for (const tipo of tiposEsperados) {
        const res = await fetch(
          `${API}/api/admin/comunicacao/historico?tipo=${tipo}&limit=1`,
          { headers: { Authorization: `Bearer ${adminToken}` } },
        )
        expect(res.status).toBe(200)
      }
    })
  })
})
