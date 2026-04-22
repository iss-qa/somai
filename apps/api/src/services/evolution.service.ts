const EVOLUTION_API_URL = (process.env.EVOLUTION_API_URL || '').replace(/\/$/, '')
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''

if (process.env.EVOLUTION_ALLOW_SELF_SIGNED === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

async function evoFetch(path: string, method: string, body?: unknown) {
  const url = `${EVOLUTION_API_URL}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: EVOLUTION_API_KEY,
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Evolution API error (${res.status}): ${text}`)
  }

  return res.json()
}

export class EvolutionService {
  /**
   * Create a new WhatsApp instance.
   */
  static async createInstance(instanceName: string) {
    console.log(`[EvolutionService] createInstance: ${instanceName}`)
    return evoFetch('/instance/create', 'POST', {
      instanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
    })
  }

  /**
   * Send a media message (image/video) via WhatsApp.
   */
  static async sendMedia(
    instanceName: string,
    number: string,
    mediaUrl: string,
    caption: string,
  ) {
    console.log(
      `[EvolutionService] sendMedia: instance=${instanceName}, number=${number}`,
    )
    return evoFetch(`/message/sendMedia/${instanceName}`, 'POST', {
      number,
      mediatype: 'image',
      media: mediaUrl,
      caption,
    })
  }

  /**
   * Send a text message via WhatsApp.
   */
  static async sendText(
    instanceName: string,
    number: string,
    text: string,
  ) {
    console.log(
      `[EvolutionService] sendText: instance=${instanceName}, number=${number}`,
    )
    return evoFetch(`/message/sendText/${instanceName}`, 'POST', {
      number,
      text,
    })
  }

  /**
   * Get the connection status of a WhatsApp instance.
   */
  static async getStatus(instanceName: string) {
    console.log(`[EvolutionService] getStatus: ${instanceName}`)
    return evoFetch(`/instance/connectionState/${instanceName}`, 'GET')
  }
}
