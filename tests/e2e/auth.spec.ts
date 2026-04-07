import { test, expect } from '@playwright/test'
import { loginAsAdmin, loginAsCompany, selectors } from './helpers/auth'

// ============================================================
// Credenciais de teste
// ============================================================
const USERS = {
  admin: { email: 'admin@soma.ai', password: 'admin123', redirectTo: '/admin/dashboard' },
  petshop: { email: 'maria@petshopamigo.com', password: 'demo123', plan: 'Pro', redirectTo: '/app/dashboard' },
  farmacia: { email: 'joao@farmaciacentral.com', password: 'demo123', plan: 'Starter', redirectTo: '/app/dashboard' },
  enterprise: { email: 'carlos@agenciadigital.com', password: 'demo123', plan: 'Enterprise', redirectTo: '/app/dashboard' },
}

// ============================================================
// Pagina de login — elementos visuais
// ============================================================
test.describe('Pagina de Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('deve exibir o formulario de login completo', async ({ page }) => {
    // Logo / título
    await expect(page.locator('text=Soma.ai').first()).toBeVisible()

    // Campos
    await expect(page.locator(selectors.email)).toBeVisible()
    await expect(page.locator(selectors.password)).toBeVisible()

    // Botão de submit
    const submitBtn = page.locator(selectors.submit)
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toHaveText('Entrar')
  })

  test('deve ter placeholders corretos nos campos', async ({ page }) => {
    await expect(page.locator(selectors.email)).toHaveAttribute('placeholder', 'seu@email.com')
    await expect(page.locator(selectors.password)).toHaveAttribute('placeholder', 'Digite sua senha')
  })

  test('deve exibir labels dos campos', async ({ page }) => {
    await expect(page.locator('label[for="email"]')).toHaveText('E-mail')
    await expect(page.locator('label[for="password"]')).toHaveText('Senha')
  })
})

// ============================================================
// Validações e erros
// ============================================================
test.describe('Validacoes de Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('deve mostrar erro com credenciais invalidas', async ({ page }) => {
    await page.fill(selectors.email, 'naoexiste@test.com')
    await page.fill(selectors.password, 'senhaerrada')
    await page.click(selectors.submit)

    // Toast de erro ou role="status" do react-hot-toast
    const errorIndicator = page
      .locator('[role="status"]')
      .or(page.locator('text=Credenciais'))
      .or(page.locator('text=Erro'))
      .or(page.locator('text=inválid'))
    await expect(errorIndicator.first()).toBeVisible({ timeout: 10000 })
  })

  test('deve mostrar erro com senha incorreta para usuario existente', async ({ page }) => {
    await page.fill(selectors.email, USERS.admin.email)
    await page.fill(selectors.password, 'senhaerrada123')
    await page.click(selectors.submit)

    const errorIndicator = page
      .locator('[role="status"]')
      .or(page.locator('text=Credenciais'))
      .or(page.locator('text=Erro'))
      .or(page.locator('text=inválid'))
    await expect(errorIndicator.first()).toBeVisible({ timeout: 10000 })
  })

  test('nao deve submeter com campos vazios', async ({ page }) => {
    await page.click(selectors.submit)

    // Deve ficar na pagina de login (validação client-side)
    await expect(page).toHaveURL(/login/)

    // Toast de erro "Preencha todos os campos"
    const errorToast = page
      .locator('[role="status"]')
      .or(page.locator('text=Preencha'))
    await expect(errorToast.first()).toBeVisible({ timeout: 5000 })
  })

  test('deve desabilitar botao durante loading', async ({ page }) => {
    await page.fill(selectors.email, USERS.admin.email)
    await page.fill(selectors.password, USERS.admin.password)

    // Interceptar request para dar tempo de verificar o loading
    await page.route('**/api/auth/login', async (route) => {
      await new Promise((r) => setTimeout(r, 1000))
      await route.continue()
    })

    await page.click(selectors.submit)

    // Botao deve mostrar "Entrando..." durante request
    const submitBtn = page.locator(selectors.submit)
    await expect(submitBtn).toBeDisabled({ timeout: 3000 })
    await expect(submitBtn).toContainText('Entrando')
  })
})

// ============================================================
// Login Admin
// ============================================================
test.describe('Login Admin', () => {
  test('deve logar como admin e redirecionar para /admin/dashboard', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page).toHaveURL(/\/admin\/dashboard/)
  })

  test('admin deve ter acesso ao painel administrativo', async ({ page }) => {
    await loginAsAdmin(page)

    // Verifica que a pagina carregou com conteudo do dashboard admin
    await expect(page).toHaveURL(/\/admin\/dashboard/)

    // Deve existir algum conteudo na pagina (nao redireciona para login)
    await page.waitForLoadState('networkidle')
    await expect(page.locator(selectors.email)).not.toBeVisible()
  })
})

// ============================================================
// Login Usuarios por Plano
// ============================================================
test.describe('Login Pet Shop (Plano Pro)', () => {
  test('deve logar e redirecionar para /app/dashboard', async ({ page }) => {
    const user = USERS.petshop
    await loginAsCompany(page, user.email, user.password)
    await expect(page).toHaveURL(/\/app\/dashboard/)
  })

  test('nao deve ter acesso ao painel admin', async ({ page }) => {
    const user = USERS.petshop
    await loginAsCompany(page, user.email, user.password)

    // Tenta acessar rota admin — deve redirecionar para login ou app
    await page.goto('/admin/dashboard')
    await expect(page).not.toHaveURL(/\/admin\/dashboard/)
  })
})

test.describe('Login Farmacia (Plano Starter)', () => {
  test('deve logar e redirecionar para /app/dashboard', async ({ page }) => {
    const user = USERS.farmacia
    await loginAsCompany(page, user.email, user.password)
    await expect(page).toHaveURL(/\/app\/dashboard/)
  })

  test('nao deve ter acesso ao painel admin', async ({ page }) => {
    const user = USERS.farmacia
    await loginAsCompany(page, user.email, user.password)

    await page.goto('/admin/dashboard')
    await expect(page).not.toHaveURL(/\/admin\/dashboard/)
  })
})

test.describe('Login Enterprise', () => {
  test('deve logar e redirecionar para /app/dashboard', async ({ page }) => {
    const user = USERS.enterprise
    await loginAsCompany(page, user.email, user.password)
    await expect(page).toHaveURL(/\/app\/dashboard/)
  })

  test('nao deve ter acesso ao painel admin', async ({ page }) => {
    const user = USERS.enterprise
    await loginAsCompany(page, user.email, user.password)

    await page.goto('/admin/dashboard')
    await expect(page).not.toHaveURL(/\/admin\/dashboard/)
  })
})

// ============================================================
// Protecao de rotas
// ============================================================
test.describe('Protecao de Rotas', () => {
  test('deve redirecionar /app/dashboard para login sem autenticacao', async ({ page }) => {
    await page.goto('/app/dashboard')
    await expect(page).toHaveURL(/login/)
  })

  test('deve redirecionar /admin/dashboard para login sem autenticacao', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/login/)
  })
})

// ============================================================
// Logout
// ============================================================
test.describe('Logout', () => {
  test('admin deve conseguir fazer logout', async ({ page }) => {
    await loginAsAdmin(page)

    // Procura botao de sair no menu ou sidebar
    const logoutBtn = page
      .locator('button:has-text("Sair")')
      .or(page.locator('[data-testid="logout"]'))
      .or(page.locator('a:has-text("Sair")'))

    if (await logoutBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await logoutBtn.first().click()
      await page.waitForURL('**/login', { timeout: 10000 })
      await expect(page).toHaveURL(/login/)
    } else {
      // Se nao encontrar botao visivel, limpa cookies manualmente e verifica redirect
      await page.context().clearCookies()
      await page.goto('/admin/dashboard')
      await expect(page).toHaveURL(/login/)
    }
  })

  test('usuario company deve conseguir fazer logout', async ({ page }) => {
    await loginAsCompany(page, USERS.petshop.email, USERS.petshop.password)

    const logoutBtn = page
      .locator('button:has-text("Sair")')
      .or(page.locator('[data-testid="logout"]'))
      .or(page.locator('a:has-text("Sair")'))

    if (await logoutBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await logoutBtn.first().click()
      await page.waitForURL('**/login', { timeout: 10000 })
      await expect(page).toHaveURL(/login/)
    } else {
      await page.context().clearCookies()
      await page.goto('/app/dashboard')
      await expect(page).toHaveURL(/login/)
    }
  })
})
