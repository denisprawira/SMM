import type { Platform } from '@/lib/types'

/** Avatar tint per platform (Figma 05: TikTok neutral, Instagram red, Facebook blue, YouTube amber). */
export const AVATAR_TONE: Record<Platform, string> = {
  tiktok: 'bg-muted text-foreground',
  instagram: 'bg-danger-subtle text-danger-text',
  facebook: 'bg-info-subtle text-info-text',
  youtube: 'bg-warning-subtle text-warning-text',
}

type ConnectCopy = {
  /** Option subtitle in the Connect modal. */
  subtitle: string
  /** Shown under the selected option. */
  requirement: string
  /** Formats Relay can publish to this platform. */
  formats: string[]
  /** "Relay will request permission to" — granted scopes, then what Relay never does. */
  permissions: string[]
  never: string
}

/** Figma 06 "Connect an account". Instagram is verbatim from the frame; the others follow its pattern. */
export const CONNECT_COPY: Record<Platform, ConnectCopy> = {
  tiktok: {
    subtitle: 'Business or Creator account',
    requirement: 'Requires a TikTok Business or Creator account. Posts publish through TikTok’s Content Posting API.',
    formats: ['Videos', 'Photo posts'],
    permissions: ['Publish videos and photo posts you schedule', 'Read basic profile and video insights'],
    never: 'Never reads DMs or posts outside your schedule',
  },
  instagram: {
    subtitle: 'Professional account (Business or Creator)',
    requirement: 'Requires an Instagram professional account linked to a Facebook Page. Personal accounts can’t publish via API.',
    formats: ['Reels', 'Feed posts', 'Carousels', 'Stories (Business only)'],
    permissions: ['Publish Reels and posts you schedule', 'Read basic profile and post insights'],
    never: 'Never reads DMs or posts outside your schedule',
  },
  facebook: {
    subtitle: 'Pages you manage',
    requirement: 'Pick the Pages to connect after signing in. You need admin or editor access on each Page.',
    formats: ['Reels', 'Feed posts', 'Photos', 'Videos'],
    permissions: ['Publish Reels and posts you schedule to your Pages', 'Read Page details and post insights'],
    never: 'Never reads Messenger chats or posts outside your schedule',
  },
  youtube: {
    subtitle: 'Channels on a Google account',
    requirement: 'Sign in with the Google account that owns or manages the channel. Brand channels are supported.',
    formats: ['Videos', 'Shorts'],
    permissions: ['Publish videos and Shorts you schedule', 'Read channel details and video analytics'],
    never: 'Never reads comments or videos outside your schedule',
  },
}
