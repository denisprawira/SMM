/** Shared domain types. Move to `packages/shared` once the API exists. */

export type Platform = 'tiktok' | 'instagram' | 'facebook' | 'youtube'

export const PLATFORM_LABEL: Record<Platform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
}

/** Placeholder palette for Drive previews (Figma "Thumbnail" tones). */
export type ThumbnailTone = 'sunset' | 'ocean' | 'forest' | 'studio' | 'night' | 'sand' | 'berry' | 'slate'

export type MediaKind = 'video' | 'image'

/** Publishing status is per target (platform + account), never per content item. */
export type PublishStatus = 'draft' | 'scheduled' | 'processing' | 'published' | 'failed' | 'cancelled'

export type ConnectionStatus = 'connected' | 'reauth' | 'disconnected' | 'connecting'

export type Trend = 'up' | 'down' | 'neutral'
