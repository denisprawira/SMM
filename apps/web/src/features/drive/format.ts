import type { Platform } from '@/lib/types'
import { folderChain, type DriveFile } from './data'

/** 42 → "0:42", 768 → "12:48" */
export function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** One file: "96 MB", "8.4 MB", "2.1 GB" (Drive reports decimal units). */
export function formatSize(mb: number) {
  if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`
}

/** A selection total: "1.04 GB", "430 MB". */
export function formatTotal(mb: number) {
  if (mb >= 1000) return `${(mb / 1000).toFixed(2)} GB`
  return `${Math.round(mb)} MB`
}

const date = (iso: string) => new Date(`${iso}T00:00:00Z`)

/** "Nov 19" */
export const formatShortDate = (iso: string) => date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

/** "Nov 19, 2025" */
export const formatLongDate = (iso: string) => date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

export const formatCount = (n: number) => n.toLocaleString('en-US')

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

/** 1080×1920 → "9:16" */
export function aspectLabel(width: number, height: number) {
  const d = gcd(width, height)
  return `${width / d}:${height / d}`
}

/** Library card meta: "0:42 · 248 MB" for video, "JPG 8.4 MB" for images. */
export const libraryMeta = (f: DriveFile) => (f.kind === 'video' ? `${formatDuration(f.durationSec ?? 0)} · ${formatSize(f.sizeMb)}` : `${f.format} ${formatSize(f.sizeMb)}`)

/** Drive browser card meta: "MP4 · 0:42" / "JPG · 3024×4032". */
export const browserMeta = (f: DriveFile) => (f.kind === 'video' ? `${f.format} · ${formatDuration(f.durationSec ?? 0)}` : `${f.format} · ${f.width}×${f.height}`)

/** Folder of a file relative to the content folder: "Content 2025 / November". */
export function fileLocation(f: DriveFile, contentFolderId: string) {
  const chain = folderChain(f.folderId)
  const start = chain.findIndex((c) => c.id === contentFolderId)
  return chain
    .slice(start >= 0 ? start : 1)
    .map((c) => c.name)
    .join(' / ')
}

export type PlatformFit = { platform: Platform; label: string; tone: 'fits' | 'neutral' | 'issue' }

/** Publishing rules per platform, evaluated from the Drive metadata only (no download). */
export function platformFit(f: DriveFile): PlatformFit[] {
  const portrait = f.height > f.width
  const ratio = aspectLabel(f.width, f.height)
  if (f.kind === 'image') {
    return [
      { platform: 'tiktok', label: 'Fits as a photo post', tone: 'fits' },
      { platform: 'instagram', label: portrait ? 'Fits as a portrait post' : 'Fits as a feed post', tone: 'fits' },
      { platform: 'youtube', label: 'Images can’t be published to YouTube', tone: 'neutral' },
    ]
  }
  const sec = f.durationSec ?? 0
  return [
    sec > 600
      ? { platform: 'tiktok', label: 'Video exceeds 10 min limit', tone: 'issue' }
      : portrait
        ? { platform: 'tiktok', label: `Fits — ${ratio}, under 10 min`, tone: 'fits' }
        : { platform: 'tiktok', label: `Fits — ${ratio}, letterboxed in feed`, tone: 'neutral' },
    sec > 900
      ? { platform: 'instagram', label: 'Too long for a Reel (15 min max)', tone: 'issue' }
      : portrait
        ? { platform: 'instagram', label: 'Fits as Reel', tone: 'fits' }
        : { platform: 'instagram', label: 'Fits as feed video', tone: 'fits' },
    portrait && sec <= 180
      ? { platform: 'youtube', label: 'Will publish as a Short', tone: 'neutral' }
      : { platform: 'youtube', label: 'Fits as a video', tone: 'fits' },
  ]
}

/** Drive web URL for a file, or the Drive home. */
export const driveFileUrl = (f?: DriveFile) => (f ? `https://drive.google.com/file/d/${f.id}/view` : 'https://drive.google.com/drive/my-drive')
