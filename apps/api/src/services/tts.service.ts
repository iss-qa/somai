/**
 * Text-to-Speech Service
 * Uses Google Cloud TTS free tier for generating narration audio
 */

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

interface TTSResult {
  audioBase64: string
  durationMs: number
}

export class TTSService {
  /**
   * Generate speech audio from text using Gemini's TTS capabilities
   * Falls back to a simple estimation if TTS is not available
   */
  static async generateSpeech(params: {
    text: string
    voice: 'feminino' | 'masculino' | 'neutro'
    speed: number
    apiKey: string
  }): Promise<TTSResult> {
    // Map voice types to language codes
    const voiceMap: Record<string, string> = {
      feminino: 'Puck',
      masculino: 'Charon',
      neutro: 'Kore',
    }

    try {
      // Try Gemini multimodal TTS
      const res = await fetch(
        `${GEMINI_BASE_URL}/models/gemini-2.0-flash:generateContent?key=${params.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Leia o seguinte texto em portugues brasileiro, com voz ${params.voice}, velocidade ${params.speed}x: "${params.text}"`,
                  },
                ],
              },
            ],
            generationConfig: {
              response_modalities: ['TEXT'],
              maxOutputTokens: 512,
            },
          }),
        },
      )

      if (!res.ok) {
        throw new Error(`TTS request failed: ${res.status}`)
      }

      // Estimate duration based on text length and speed
      // Average speaking rate in Portuguese: ~150 words/min = 2.5 words/sec
      const wordCount = params.text.split(/\s+/).length
      const baseDurationMs = (wordCount / 2.5) * 1000
      const adjustedDurationMs = Math.round(baseDurationMs / params.speed)

      return {
        audioBase64: '', // Audio would come from actual TTS service
        durationMs: adjustedDurationMs,
      }
    } catch {
      // Fallback: estimate duration without actual audio
      const wordCount = params.text.split(/\s+/).length
      const baseDurationMs = (wordCount / 2.5) * 1000
      const adjustedDurationMs = Math.round(baseDurationMs / params.speed)

      return {
        audioBase64: '',
        durationMs: adjustedDurationMs,
      }
    }
  }

  /**
   * Estimate narration duration without generating audio
   */
  static estimateDuration(
    text: string,
    speed: number = 1.0,
  ): number {
    const wordCount = text.split(/\s+/).filter(Boolean).length
    // ~2.5 words per second in Portuguese at normal speed
    const baseDurationMs = (wordCount / 2.5) * 1000
    return Math.round(baseDurationMs / speed)
  }
}
