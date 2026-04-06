import { Worker, Job, Queue } from 'bullmq'
import redis from '../plugins/redis'
import { Campaign, Notification } from '@soma-ai/db'
import { MetaAdsService } from '../services/meta-ads.service'

// Queue for campaign metric syncing
export const campaignMetricsQueue = new Queue('campaign-metrics-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 30000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 50 },
  },
})

// Schedule recurring metric sync every 4 hours
async function scheduleCampaignMetrics() {
  const existing = await campaignMetricsQueue.getRepeatableJobs()
  if (existing.length === 0) {
    await campaignMetricsQueue.add(
      'sync-metrics',
      {},
      {
        repeat: { every: 4 * 60 * 60 * 1000 }, // 4 hours
      },
    )
    console.log('[campaign-worker] Scheduled metrics sync every 4h')
  }
}

const campaignWorker = new Worker(
  'campaign-metrics-queue',
  async (job: Job) => {
    console.log('[campaign-worker] Syncing campaign metrics...')

    // 1. Find all active campaigns
    const activeCampaigns = await Campaign.find({ status: 'active' }).lean()

    for (const campaign of activeCampaigns as any[]) {
      // Sync Meta Ads metrics
      if (
        campaign.platforms?.meta_ads?.enabled &&
        campaign.platforms?.meta_ads?.campaign_id
      ) {
        try {
          const meta = await MetaAdsService.getToken(
            String(campaign.company_id),
          )
          if (meta) {
            const metrics = await MetaAdsService.fetchMetrics(
              campaign.platforms.meta_ads.campaign_id,
              meta.token,
            )

            await Campaign.findByIdAndUpdate(campaign._id, {
              'metrics.impressions': metrics.impressions,
              'metrics.reach': metrics.reach,
              'metrics.clicks': metrics.clicks,
              'metrics.ctr': metrics.ctr,
              'metrics.cpc': metrics.cpc,
              'metrics.cpm': metrics.cpm,
              'metrics.conversions': metrics.conversions,
              'metrics.total_spent': metrics.spend,
              'metrics.last_synced_at': new Date(),
            })
          }
        } catch (err: any) {
          console.error(
            `[campaign-worker] Error syncing metrics for ${campaign._id}:`,
            err.message,
          )
        }
      }
    }

    // 2. Check for expired campaigns
    const now = new Date()
    const expiredCampaigns = await Campaign.find({
      status: 'active',
      end_date: { $lte: now },
    }).lean()

    for (const campaign of expiredCampaigns as any[]) {
      await Campaign.findByIdAndUpdate(campaign._id, {
        status: 'completed',
        completed_at: now,
      })

      // Pause ads on Meta
      if (campaign.platforms?.meta_ads?.campaign_id) {
        try {
          const meta = await MetaAdsService.getToken(
            String(campaign.company_id),
          )
          if (meta) {
            await MetaAdsService.updateCampaignStatus(
              campaign.platforms.meta_ads.campaign_id,
              'PAUSED',
              meta.token,
            )
          }
        } catch {
          // Continue
        }
      }

      // Notify
      await Notification.create({
        target: 'company',
        company_id: campaign.company_id,
        type: 'campaign_completed',
        title: 'Campanha finalizada',
        message: `A campanha "${campaign.name}" foi concluida automaticamente.`,
        action_url: `/app/campaigns/${campaign._id}`,
        read: false,
      })
    }

    console.log(
      `[campaign-worker] Synced ${activeCampaigns.length} campaigns, completed ${expiredCampaigns.length}`,
    )
  },
  {
    connection: redis,
    concurrency: 1,
  },
)

campaignWorker.on('failed', (job, error) => {
  console.error(`[campaign-worker] Job ${job?.id} failed:`, error.message)
})

// Start the scheduled job
scheduleCampaignMetrics().catch(console.error)

export default campaignWorker
