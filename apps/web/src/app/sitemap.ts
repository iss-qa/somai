import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/utils'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${SITE.url}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE.url}/#recursos`, lastModified: now, priority: 0.8 },
    { url: `${SITE.url}/#planos`, lastModified: now, priority: 0.9 },
    { url: `${SITE.url}/#faq`, lastModified: now, priority: 0.7 },
    { url: `${SITE.url}/login`, lastModified: now, priority: 0.5 },
  ]
}
