import { test, expect } from '@playwright/test'

test.describe('Autenticacao', () => {
  test('deve exibir a pagina de login', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('text=Soma.ai')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('deve mostrar erro com credenciais invalidas', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'wrong@test.com')
    await page.fill('input[name="password"]', 'wrongpass')
    await page.click('button[type="submit"]')
    // Should show error toast or message
    await expect(
      page.locator('text=Credenciais inválidas').or(page.locator('[role="alert"]'))
    ).toBeVisible({ timeout: 5000 })
  })

  test('deve fazer login como admin e redirecionar para dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@soma.ai')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    await expect(page).toHaveURL(/dashboard/)
  })

  test('deve redirecionar rotas protegidas para login sem autenticacao', async ({ page }) => {
    await page.goto('/app/dashboard')
    await expect(page).toHaveURL(/login/)
  })

  test('deve redirecionar /admin para login sem autenticacao', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/login/)
  })

  test('deve fazer logout corretamente', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@soma.ai')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard', { timeout: 10000 })

    // Find and click logout (in user dropdown or sidebar)
    const userMenu = page
      .locator('[data-testid="user-menu"]')
      .or(page.locator('button:has-text("Sair")'))
    if (await userMenu.isVisible()) {
      await userMenu.click()
      const logoutBtn = page.locator('text=Sair')
      if (await logoutBtn.isVisible()) await logoutBtn.click()
    }
    // After logout should redirect to login
    await page.waitForURL('**/login', { timeout: 10000 })
  })
})
