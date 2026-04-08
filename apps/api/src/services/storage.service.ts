import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'node:crypto'

function getClient(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

export class StorageService {
  /**
   * Uploads a base64 data URL image to Cloudflare R2 and returns a public URL.
   */
  static async uploadBase64Image(
    dataUrl: string,
    folder = 'cards',
  ): Promise<string> {
    const accountId = process.env.R2_ACCOUNT_ID
    const bucket = process.env.R2_BUCKET_NAME || 'soma-ai-media'
    const publicUrl = process.env.R2_PUBLIC_URL

    if (!accountId || !process.env.R2_ACCESS_KEY_ID || !publicUrl) {
      throw new Error('Armazenamento R2 nao configurado (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_PUBLIC_URL)')
    }

    // Parse data URL: data:image/png;base64,<data>
    const match = dataUrl.match(/^data:([a-zA-Z0-9+/]+\/[a-zA-Z0-9+/]+);base64,(.+)$/)
    if (!match) {
      throw new Error('Formato de data URL invalido')
    }

    const mimeType = match[1]
    const base64Data = match[2]
    const buffer = Buffer.from(base64Data, 'base64')
    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png'

    const key = `${folder}/${crypto.randomBytes(12).toString('hex')}.${ext}`

    const client = getClient()
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000',
      }),
    )

    const base = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl
    return `${base}/${key}`
  }
}
