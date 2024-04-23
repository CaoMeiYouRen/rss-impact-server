import { BitTorrentConfig } from '@/models/bit-torrent-config'
import { DownloadConfig } from '@/models/download-config'
import { NotificationConfig } from '@/models/notification-config'
import { WebhookConfig } from '@/models/webhook-config'
import { AIConfig } from '@/models/ai-config'

export type HookConfig = NotificationConfig | WebhookConfig | DownloadConfig | BitTorrentConfig | AIConfig
