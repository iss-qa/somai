// Connection
export { connectDB } from './connection'

// Models
export { AdminUser, type IAdminUser } from './models/AdminUser'
export { FalUsage, type IFalUsage } from './models/FalUsage'
export { AppSettings, type IAppSettings } from './models/AppSettings'
export { Plan, type IPlan, type IPlanFeatures } from './models/Plan'
export {
  Company,
  type ICompany,
  type ICompanyBilling,
  type ICompanyBrandColors,
  type ICompanyMarcaV2,
  type ICompanyPublicoV2,
  type ICompanyIdentidadeV2,
  type ICompanyEstiloVisualV2,
  type ObjetivoV2,
  type TomDeVozV2,
  type EstiloVisualV2,
  type OnboardingStepV2,
} from './models/Company'
export { User, type IUser } from './models/User'
export {
  Integration,
  type IIntegration,
  type IIntegrationMeta,
  type IIntegrationWhatsapp,
  type IIntegrationGemini,
} from './models/Integration'
export {
  NicheConfig,
  type INicheConfig,
  type INicheConfigColors,
  type INicheConfigAiPrompts,
} from './models/NicheConfig'
export { HashtagSet, type IHashtagSet } from './models/HashtagSet'
export { MediaLibrary, type IMediaLibrary } from './models/MediaLibrary'
export {
  Template,
  type ITemplate,
  type ITemplateConfig,
} from './models/Template'
export { Card, type ICard, type ICardOverlay } from './models/Card'
export { Video, type IVideo } from './models/Video'
export { Script, type IScript } from './models/Script'
export { Campaign, type ICampaign } from './models/Campaign'
export {
  Schedule,
  type ISchedule,
  type IWeeklySlot,
} from './models/Schedule'
export { PostQueue, type IPostQueue } from './models/PostQueue'
export { Post, type IPost } from './models/Post'
export { DatesCalendar, type IDatesCalendar } from './models/DatesCalendar'
export { Analytics, type IAnalytics } from './models/Analytics'
export { Notification, type INotification } from './models/Notification'
export { AuditLog, type IAuditLog } from './models/AuditLog'
export {
  AppLog,
  type IAppLog,
  type AppLogLevel,
  type AppLogCategory,
} from './models/AppLog'
export {
  MessageHistory,
  type IMessageHistory,
  TipoMensagem,
  StatusMensagem,
} from './models/MessageHistory'
export {
  SetupAgendamento,
  type ISetupAgendamento,
} from './models/SetupAgendamento'
export {
  SetupCredencial,
  type ISetupCredencial,
  type ISetupCredencialAcesso,
} from './models/SetupCredencial'

// ── v2.0 ──────────────────────────────────────
export {
  Gamificacao,
  type IGamificacao,
  type NivelGamificacao,
} from './models/Gamificacao'
export {
  Missao,
  type IMissao,
  type MissaoTipo,
  type MissaoCondicao,
} from './models/Missao'
export {
  MissaoProgresso,
  type IMissaoProgresso,
} from './models/MissaoProgresso'
export {
  Conquista,
  type IConquista,
} from './models/Conquista'
export {
  XpHistory,
  type IXpHistory,
  type XpAcao,
} from './models/XpHistory'
export {
  Inspiracao,
  type IInspiracao,
  type InspiracaoFormato,
} from './models/Inspiracao'
export {
  ComunidadePost,
  type IComunidadePost,
  type IComunidadeResposta,
  type ComunidadeTag,
} from './models/ComunidadePost'
export {
  Referral,
  type IReferral,
  type IReferralUse,
} from './models/Referral'
export {
  SupportTicket,
  type ISupportTicket,
  type ITicketMessage,
  type TicketStatus,
  type TicketCategory,
  type TicketPriority,
} from './models/SupportTicket'
