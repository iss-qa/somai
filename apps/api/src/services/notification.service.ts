import { Notification } from '@soma-ai/db'
import type { NotificationType } from '@soma-ai/shared'

interface CreateNotificationInput {
  target: 'company' | 'admin'
  company_id?: string | null
  type: NotificationType | string
  title: string
  message: string
  action_url?: string
  expires_in_hours?: number
}

export class NotificationService {
  static async create(data: CreateNotificationInput) {
    let expires_at: Date | null = null
    if (data.expires_in_hours) {
      expires_at = new Date(Date.now() + data.expires_in_hours * 60 * 60 * 1000)
    }

    const notification = await Notification.create({
      target: data.target,
      company_id: data.company_id || null,
      type: data.type,
      title: data.title,
      message: data.message,
      action_url: data.action_url || '',
      read: false,
      dismissed: false,
      expires_at,
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
    const now = new Date()
    const query: Record<string, unknown> = {
      target,
      read: false,
      dismissed: { $ne: true },
      $or: [
        { expires_at: null },
        { expires_at: { $gt: now } },
      ],
    }
    if (companyId) {
      query.company_id = companyId
    }
    const notifications = await Notification.find(query)
      .sort({ created_at: -1 })
      .limit(50)
      .lean()
    return notifications
  }

  static async getAll(
    target: 'company' | 'admin',
    companyId?: string,
    page = 1,
    limit = 20,
  ) {
    const now = new Date()
    const query: Record<string, unknown> = {
      target,
      dismissed: { $ne: true },
      $or: [
        { expires_at: null },
        { expires_at: { $gt: now } },
      ],
    }
    if (companyId) {
      query.company_id = companyId
    }

    const skip = (page - 1) * limit
    const [notifications, total] = await Promise.all([
      Notification.find(query).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(query),
    ])

    return { notifications, total, page, pages: Math.ceil(total / limit) }
  }

  static async markAllRead(target: 'company' | 'admin', companyId?: string) {
    const query: Record<string, unknown> = { target, read: false }
    if (companyId) {
      query.company_id = companyId
    }
    await Notification.updateMany(query, { read: true })
  }

  static async dismiss(id: string) {
    return Notification.findByIdAndUpdate(id, { dismissed: true }, { new: true })
  }
}
