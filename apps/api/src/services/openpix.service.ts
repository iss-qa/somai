/**
 * OpenPix (Woovi) Payment Service
 * API Docs: https://developers.woovi.com
 *
 * Handles:
 * - One-time charges (setup fee) via PIX
 * - Recurring subscriptions (monthly billing)
 */

import crypto from 'node:crypto'

function getConfig() {
  const appId = process.env.OPENPIX_APP_ID || ''
  const baseUrl = process.env.OPENPIX_BASE_URL || 'https://api.woovi.com/api/v1'
  return { appId, baseUrl }
}

async function openpixFetch<T = any>(
  path: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: unknown,
): Promise<T> {
  const { appId, baseUrl } = getConfig()

  if (!appId) {
    throw new Error(
      'OPENPIX_APP_ID nao configurado. Adicione no .env.',
    )
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: appId,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg =
      (data as any)?.error?.message ||
      (data as any)?.error ||
      `OpenPix API error: ${res.status}`
    console.error('[openpix] Error:', res.status, JSON.stringify(data))
    throw new Error(msg)
  }

  return data as T
}

// ─── Types ──────────────────────────────────────

export interface OpenPixCharge {
  correlationID: string
  value: number
  status: string
  brCode: string
  qrCodeImage: string
  paymentLinkUrl: string
  pixKey: string
  globalID: string
  identifier: string
  expiresDate: string
  createdAt: string
}

export interface OpenPixSubscription {
  globalID: string
  value: number
  status: string
  dayGenerateCharge: number
  customer: {
    name: string
    email: string
    phone: string
    taxID: { taxID: string; type: string }
  }
}

export interface OpenPixCustomer {
  name: string
  email: string
  phone: string
  correlationID: string
  taxID?: { taxID: string; type: string }
}

// ─── Service ────────────────────────────────────

export class OpenPixService {
  /**
   * Create or get a customer in OpenPix
   */
  static async createCustomer(params: {
    name: string
    email: string
    phone: string
    taxID?: string
  }): Promise<{ customer: OpenPixCustomer }> {
    const body: any = {
      name: params.name,
      email: params.email,
      phone: params.phone,
    }

    if (params.taxID) {
      body.taxID = params.taxID
    }

    console.log('[openpix] Creating customer:', params.name)

    const data = await openpixFetch<{ customer: OpenPixCustomer }>(
      '/customer',
      'POST',
      body,
    )

    console.log('[openpix] Customer created:', data.customer?.correlationID)
    return data
  }

  /**
   * Create a one-time PIX charge (ex: setup fee)
   * Value is in CENTS (R$ 297,00 = 29700)
   */
  static async createCharge(params: {
    correlationID?: string
    value: number
    comment?: string
    customer?: {
      name: string
      email: string
      phone: string
      taxID?: string
    }
    expiresIn?: number // seconds
  }): Promise<{ charge: OpenPixCharge; brCode: string; correlationID: string }> {
    const correlationID =
      params.correlationID || crypto.randomUUID()

    const body: any = {
      correlationID,
      value: params.value,
    }

    if (params.comment) {
      body.comment = params.comment
    }

    if (params.customer) {
      body.customer = {
        name: params.customer.name,
        email: params.customer.email,
        phone: params.customer.phone,
      }
      if (params.customer.taxID) {
        body.customer.taxID = params.customer.taxID
      }
    }

    if (params.expiresIn) {
      body.expiresIn = params.expiresIn
    }

    console.log('[openpix] Creating charge:', {
      correlationID,
      value: params.value,
    })

    const data = await openpixFetch<{
      charge: OpenPixCharge
      brCode: string
      correlationID: string
    }>('/charge', 'POST', body)

    console.log('[openpix] Charge created:', data.correlationID)
    return data
  }

  /**
   * Get charge details by correlationID or ID
   */
  static async getCharge(
    id: string,
  ): Promise<{ charge: OpenPixCharge }> {
    return openpixFetch<{ charge: OpenPixCharge }>(`/charge/${id}`)
  }

  /**
   * Create a recurring subscription (monthly billing)
   * Value is in CENTS
   */
  static async createSubscription(params: {
    value: number
    customer: {
      name: string
      email: string
      phone: string
      taxID?: string
    }
    dayGenerateCharge?: number // 1-27, day of month
  }): Promise<{ subscription: OpenPixSubscription }> {
    const body: any = {
      value: params.value,
      customer: {
        name: params.customer.name,
        email: params.customer.email,
        phone: params.customer.phone,
      },
    }

    if (params.customer.taxID) {
      body.customer.taxID = params.customer.taxID
    }

    if (params.dayGenerateCharge) {
      body.dayGenerateCharge = params.dayGenerateCharge
    }

    console.log('[openpix] Creating subscription:', {
      value: params.value,
      customer: params.customer.name,
    })

    const data = await openpixFetch<{
      subscription: OpenPixSubscription
    }>('/subscriptions', 'POST', body)

    console.log('[openpix] Subscription created:', data.subscription?.globalID)
    return data
  }

  /**
   * Get subscription by globalID
   */
  static async getSubscription(
    globalID: string,
  ): Promise<{ subscription: OpenPixSubscription }> {
    return openpixFetch<{ subscription: OpenPixSubscription }>(
      `/subscriptions/${globalID}`,
    )
  }

  /**
   * List all charges (with optional pagination)
   */
  static async listCharges(params?: {
    start?: string
    end?: string
    status?: string
  }): Promise<{ charges: OpenPixCharge[] }> {
    const query = new URLSearchParams()
    if (params?.start) query.set('start', params.start)
    if (params?.end) query.set('end', params.end)
    if (params?.status) query.set('status', params.status)

    const qs = query.toString()
    return openpixFetch<{ charges: OpenPixCharge[] }>(
      `/charge${qs ? `?${qs}` : ''}`,
    )
  }

  /**
   * List all subscriptions
   */
  static async listSubscriptions(): Promise<{
    subscriptions: OpenPixSubscription[]
  }> {
    return openpixFetch<{ subscriptions: OpenPixSubscription[] }>(
      '/subscriptions',
    )
  }

  /**
   * Delete/cancel a subscription
   */
  static async cancelSubscription(globalID: string): Promise<void> {
    await openpixFetch(`/subscriptions/${globalID}`, 'DELETE')
  }
}
