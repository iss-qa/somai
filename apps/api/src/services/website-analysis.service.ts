/**
 * Captura um screenshot da home do site + HTML bruto para alimentar a
 * análise de marca no onboarding v2.0.
 *
 * Usa playwright-core reaproveitando o Chromium já instalado pelo
 * @playwright/test (devDep do monorepo).
 */
import { chromium, type Browser } from 'playwright-core'

export interface WebsiteSnapshot {
  url: string
  finalUrl: string
  title: string
  description: string
  htmlText: string
  screenshotBase64: string
  screenshotMime: string
  logoUrl: string
}

let sharedBrowser: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (sharedBrowser && sharedBrowser.isConnected()) return sharedBrowser
  sharedBrowser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  return sharedBrowser
}

export class WebsiteAnalysisService {
  static normalizeUrl(raw: string): string {
    const trimmed = raw.trim()
    if (!trimmed) throw new Error('URL vazia')
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    return `https://${trimmed}`
  }

  static async capture(rawUrl: string): Promise<WebsiteSnapshot> {
    const url = this.normalizeUrl(rawUrl)
    const browser = await getBrowser()
    const ctx = await browser.newContext({
      viewport: { width: 1366, height: 900 },
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36 SomaBot/1.0',
    })
    const page = await ctx.newPage()
    try {
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 25_000,
      })
      if (!response || !response.ok()) {
        const status = response?.status() ?? 0
        if (status >= 400) {
          throw new Error(`Site retornou HTTP ${status}`)
        }
      }

      await page.waitForTimeout(1500)

      const finalUrl = page.url()
      const title = await page.title().catch(() => '')
      const description = await page
        .$eval('meta[name="description"]', (el) =>
          (el as HTMLMetaElement).content || '',
        )
        .catch(() => '')

      const htmlText = await page
        .evaluate(() => {
          const body = document.body?.innerText || ''
          return body.slice(0, 8000)
        })
        .catch(() => '')

      const logoUrl = await page
        .evaluate(() => {
          const selectors = [
            'img[alt*="logo" i]',
            'img[src*="logo" i]',
            'header img',
            'nav img',
            'a[href="/"] img',
          ]
          for (const sel of selectors) {
            const el = document.querySelector(sel) as HTMLImageElement | null
            if (el && el.src) return el.src
          }
          const icon = document.querySelector(
            'link[rel~="icon"]',
          ) as HTMLLinkElement | null
          return icon?.href || ''
        })
        .catch(() => '')

      const screenshotBuf = await page.screenshot({
        type: 'jpeg',
        quality: 75,
        fullPage: false,
      })

      return {
        url,
        finalUrl,
        title,
        description,
        htmlText,
        screenshotBase64: screenshotBuf.toString('base64'),
        screenshotMime: 'image/jpeg',
        logoUrl,
      }
    } finally {
      await ctx.close().catch(() => {})
    }
  }
}
