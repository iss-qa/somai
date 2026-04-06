import { Notification } from '@soma-ai/db'
import type { NotificationType } from '@soma-ai/shared'

interface CreateNotificationInput {
  target: 'company' | 'admin'
  company_id?: string | null
  type: NotificationType | string
  title: string
  message: string
  action_url?: string
}

export class NotificationService {
  static async create(data: CreateNotificationInput) {
    const notification = await Notification.create({
      target: data.target,
      company_id: data.company_id || null,
      type: data.type,
      title: data.title,
      message: data.message,
      action_url: data.action_url || '',
      read: false,
    })
    return notification
  }

  static async markRead(id: string) {
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true },
    )
    return notification
  }

  static async getUnread(target: 'company' | 'admin', companyId?: string) {
    const query: Record<string, unknown> = { target, read: false }
    if (companyId) {
      query.company_id = companyId
    }
    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .limit(50)
      .lean()
    return notifications
  }
}
