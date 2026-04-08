import { AppLog, type AppLogLevel, type AppLogCategory } from '@soma-ai/db'

interface LogParams {
  level: AppLogLevel
  category: AppLogCategory
  event: string
  message: string
  company_id?: string
  company_name?: string
  metadata?: Record<string, unknown>
  duration_ms?: number
  ip?: string
}

export class LogService {
  static async log(params: LogParams): Promise<void> {
    try {
      await AppLog.create({
        level: params.level,
        category: params.category,
        event: params.event,
        message: params.message,
        company_id: params.company_id || null,
        company_name: params.company_name || '',
        metadata: params.metadata || {},
        duration_ms: params.duration_ms ?? null,
        ip: params.ip || '',
      })
    } catch (err) {
      // Never let logging crash the app
      console.error('[LogService] Failed to write log:', err)
    }
  }

  static async info(
    category: AppLogCategory,
    event: string,
    message: string,
    extra?: Omit<LogParams, 'level' | 'category' | 'event' | 'message'>,
  ): Promise<void> {
    return LogService.log({ level: 'info', category, event, message, ...extra })
  }

  static async warn(
    category: AppLogCategory,
    event: string,
    message: string,
    extra?: Omit<LogParams, 'level' | 'category' | 'event' | 'message'>,
  ): Promise<void> {
    return LogService.log({ level: 'warn', category, event, message, ...extra })
  }

  static async error(
    category: AppLogCategory,
    event: string,
    message: string,
    extra?: Omit<LogParams, 'level' | 'category' | 'event' | 'message'>,
  ): Promise<void> {
    return LogService.log({ level: 'error', category, event, message, ...extra })
  }

  static async debug(
    category: AppLogCategory,
    event: string,
    message: string,
    extra?: Omit<LogParams, 'level' | 'category' | 'event' | 'message'>,
  ): Promise<void> {
    return LogService.log({ level: 'debug', category, event, message, ...extra })
  }
}
