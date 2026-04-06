import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers/auth'

test.describe('Painel Admin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('deve carregar o dashboard admin com metricas', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')

    // Verify the dashboard page loaded
    await expect(page).toHaveURL(/admin\/dashboard/)

    // Check for metric cards or summary data
    const metricCards = page
      .locator('[data-testid="metric-card"]')
      .or(page.locator('.metric-card'))
      .or(page.locator('[class*="card"]').first())
    await expect(metricCards).toBeVisible({ timeout: 10000 })
  })

  test('deve renderizar a lista de empresas', async ({ page }) => {
    await page.goto('/admin/companies')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(/admin\/companies/)

    // Check for a table or list of companies
    const companiesList = page
      .locator('table')
      .or(page.locator('[data-testid="companies-list"]'))
      .or(page.locator('[class*="company"]').first())
    await expect(companiesList).toBeVisible({ timeout: 10000 })
  })

  test('deve exibir detalhes ao clicar em uma empresa', async ({ page }) => {
    await page.goto('/admin/companies')
    await page.waitForLoadState('networkidle')

    // Click the first company row/card
    const firstCompany = page
      .locator('table tbody tr')
      .first()
      .or(page.locator('[data-testid="company-row"]').first())
      .or(page.locator('a[href*="/admin/companies/"]').first())

    if (await firstCompany.isVisible({ timeout: 5000 })) {
      await firstCompany.click()
      await page.waitForLoadState('networkidle')

      // Should navigate to company detail or open a drawer/modal
      const companyDetail = page
        .locator('[data-testid="company-detail"]')
        .or(page.locator('text=Detalhes'))
        .or(page.locator('h1, h2, h3').filter({ hasText: /farmacia|empresa|company/i }).first())
      await expect(companyDetail).toBeVisible({ timeout: 10000 })
    }
  })

  test('deve carregar a pagina financeira', async ({ page }) => {
    await page.goto('/admin/financial')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(/admin\/financial/)

    // Check for financial summary content
    const financialContent = page
      .locator('[data-testid="financial-summary"]')
      .or(page.locator('text=Financeiro').first())
      .or(page.locator('text=Receita').first())
      .or(page.locator('[class*="financial"]').first())
    await expect(financialContent).toBeVisible({ timeout: 10000 })
  })

  test('deve exibir status dos servicos na pagina de saude', async ({ page }) => {
    await page.goto('/admin/health')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(/admin\/health/)

    // Check for service status indicators
    const healthContent = page
      .locator('[data-testid="service-status"]')
      .or(page.locator('text=MongoDB').first())
      .or(page.locator('text=online').or(page.locator('text=offline')).first())
      .or(page.locator('[class*="health"]').first())
    await expect(healthContent).toBeVisible({ timeout: 10000 })
  })

  test('deve carregar a pagina de logs com tabela', async ({ page }) => {
    await page.goto('/admin/logs')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(/admin\/logs/)

    // Check for logs table or list
    const logsContent = page
      .locator('table')
      .or(page.locator('[data-testid="logs-table"]'))
      .or(page.locator('[data-testid="logs-list"]'))
      .or(page.locator('text=Logs').first())
    await expect(logsContent).toBeVisible({ timeout: 10000 })
  })
})
