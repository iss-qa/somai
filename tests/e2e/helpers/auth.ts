import { Page, expect } from '@playwright/test'

const API_URL = 'http://localhost:3001'

/** Seletores do formulário de login */
const selectors = {
  email: '#email',
  password: '#password',
  submit: 'button[type="submit"]',
}

async function fillLoginForm(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.waitForSelector(selectors.email, { state: 'visible' })
  await page.fill(selectors.email, email)
  await page.fill(selectors.password, password)
  await page.click(selectors.submit)
}

export async function loginAsAdmin(page: Page) {
  await fillLoginForm(page, 'admin@soma.ai', 'admin123')
  await page.waitForURL('**/admin/dashboard', { timeout: 15000 })
}

export async function loginAsCompany(
  page: Page,
  email: string,
  password: string
) {
  await fillLoginForm(page, email, password)
  await page.waitForURL('**/app/dashboard', { timeout: 15000 })
}

export async function seedTestData() {
  const loginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@soma.ai', password: 'admin123' }),
  })
  const { token } = await loginRes.json()
  return token
}

export async function apiRequest(
  path: string,
  options: RequestInit & { token?: string } = {}
) {
  const { token, ...fetchOptions } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers })
  return res.json()
}

export { selectors }
