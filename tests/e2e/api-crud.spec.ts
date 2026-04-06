import { test, expect } from '@playwright/test'

const API = 'http://localhost:3001'
let adminToken: string

test.describe('API CRUD Tests', () => {
  test.beforeAll(async () => {
    // Login as admin to get token
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@soma.ai', password: 'admin123' }),
    })
    const data = await res.json()
    adminToken = data.token
  })

  test.describe('Companies CRUD', () => {
    let companyId: string

    test('POST /api/companies - criar empresa', async () => {
      const res = await fetch(`${API}/api/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Farmacia Teste E2E',
          slug: 'farmacia-teste-e2e',
          niche: 'farmacia',
          city: 'Salvador',
          state: 'BA',
          responsible_name: 'Joao Teste',
          whatsapp: '5571999999999',
          email: 'teste@farmacia.com',
          status: 'active',
          access_enabled: true,
        }),
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data._id || data.id).toBeTruthy()
      companyId = data._id || data.id
    })

    test('GET /api/companies - listar empresas', async () => {
      const res = await fetch(`${API}/api/companies`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(Array.isArray(data) || Array.isArray(data.companies)).toBeTruthy()
    })

    test('GET /api/companies/:id - buscar empresa por ID', async () => {
      if (!companyId) test.skip()
      const res = await fetch(`${API}/api/companies/${companyId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.name).toBe('Farmacia Teste E2E')
    })

    test('PUT /api/companies/:id - atualizar empresa', async () => {
      if (!companyId) test.skip()
      const res = await fetch(`${API}/api/companies/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: 'Farmacia Teste Atualizada' }),
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.name).toBe('Farmacia Teste Atualizada')
    })

    test('POST /api/companies/:id/block - bloquear empresa', async () => {
      if (!companyId) test.skip()
      const res = await fetch(`${API}/api/companies/${companyId}/block`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('blocked')
    })

    test('POST /api/companies/:id/unblock - desbloquear empresa', async () => {
      if (!companyId) test.skip()
      const res = await fetch(`${API}/api/companies/${companyId}/unblock`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('active')
    })
  })

  test.describe('Cards CRUD', () => {
    let cardId: string

    test('POST /api/cards/generate - gerar card', async () => {
      const res = await fetch(`${API}/api/cards/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          format: 'feed_1x1',
          post_type: 'promocao',
          product_name: 'Vitamina C 1000mg',
          price_original: 29.9,
          price_promo: 19.9,
          headline: 'Oferta Imperdivel',
          subtext: 'Vitamina C com desconto',
        }),
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data._id || data.id).toBeTruthy()
      expect(data.status).toBe('draft')
      cardId = data._id || data.id
    })

    test('GET /api/cards - listar cards', async () => {
      const res = await fetch(`${API}/api/cards`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
    })

    test('PATCH /api/cards/:id/approve - aprovar card', async () => {
      if (!cardId) test.skip()
      const res = await fetch(`${API}/api/cards/${cardId}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('approved')
    })

    test('PATCH /api/cards/:id - atualizar card', async () => {
      if (!cardId) test.skip()
      const res = await fetch(`${API}/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ headline: 'Super Oferta Atualizada' }),
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.headline).toBe('Super Oferta Atualizada')
    })

    test('DELETE /api/cards/:id - arquivar card', async () => {
      if (!cardId) test.skip()
      const res = await fetch(`${API}/api/cards/${cardId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('archived')
    })
  })

  test.describe('Post Queue', () => {
    test('GET /api/post-queue - listar fila', async () => {
      const res = await fetch(`${API}/api/post-queue`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
    })
  })

  test.describe('Campaigns CRUD', () => {
    let campaignId: string

    test('POST /api/campaigns - criar campanha', async () => {
      const res = await fetch(`${API}/api/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Campanha Dia das Maes',
          description: 'Promocoes especiais',
          theme: 'Dia das Maes',
          start_date: '2026-05-01',
          end_date: '2026-05-15',
        }),
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data._id || data.id).toBeTruthy()
      campaignId = data._id || data.id
    })

    test('GET /api/campaigns - listar campanhas', async () => {
      const res = await fetch(`${API}/api/campaigns`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
    })

    test('PUT /api/campaigns/:id - atualizar campanha', async () => {
      if (!campaignId) test.skip()
      const res = await fetch(`${API}/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ name: 'Campanha Atualizada' }),
      })
      expect(res.status).toBe(200)
    })

    test('DELETE /api/campaigns/:id - deletar campanha', async () => {
      if (!campaignId) test.skip()
      const res = await fetch(`${API}/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
    })
  })

  test.describe('Scripts CRUD', () => {
    let scriptId: string

    test('POST /api/scripts - criar roteiro', async () => {
      const res = await fetch(`${API}/api/scripts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: 'Roteiro Promocao Vitamina',
          category: 'promocao',
          text: 'Ola! Estamos com uma oferta imperdivel de Vitamina C. Aproveite agora mesmo!',
        }),
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data._id || data.id).toBeTruthy()
      scriptId = data._id || data.id
    })

    test('GET /api/scripts - listar roteiros', async () => {
      const res = await fetch(`${API}/api/scripts`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
    })

    test('DELETE /api/scripts/:id - deletar roteiro', async () => {
      if (!scriptId) test.skip()
      const res = await fetch(`${API}/api/scripts/${scriptId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
    })
  })

  test.describe('Admin Endpoints', () => {
    test('GET /api/admin/dashboard/summary - dashboard admin', async () => {
      const res = await fetch(`${API}/api/admin/dashboard/summary`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveProperty('activeCompanies')
    })

    test('GET /api/admin/financial/summary - resumo financeiro', async () => {
      const res = await fetch(`${API}/api/admin/financial/summary`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
    })

    test('GET /api/admin/health/services - saude dos servicos', async () => {
      const res = await fetch(`${API}/api/admin/health/services`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.mongodb).toBeDefined()
    })

    test('GET /api/admin/logs - logs de postagem', async () => {
      const res = await fetch(`${API}/api/admin/logs`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
    })
  })

  test.describe('Integrations', () => {
    test('GET /api/integrations/meta - integracoes Meta', async () => {
      const res = await fetch(`${API}/api/integrations/meta`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      // Can be 200 or 404 depending on if integration exists
      expect([200, 404]).toContain(res.status)
    })
  })

  test.describe('Schedules', () => {
    test('GET /api/schedules - obter agenda', async () => {
      const res = await fetch(`${API}/api/schedules`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
    })

    test('PUT /api/schedules - atualizar agenda', async () => {
      const res = await fetch(`${API}/api/schedules`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          active: true,
          publish_instagram: true,
          publish_facebook: false,
          frequency: 'daily',
          weekly_slots: [
            { day: 1, time: '10:00', format: 'feed' },
            { day: 3, time: '14:00', format: 'stories' },
            { day: 5, time: '10:00', format: 'feed' },
          ],
        }),
      })
      expect(res.status).toBe(200)
    })
  })

  test.describe('Videos', () => {
    test('GET /api/videos - listar videos', async () => {
      const res = await fetch(`${API}/api/videos`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      expect(res.status).toBe(200)
    })
  })
})
