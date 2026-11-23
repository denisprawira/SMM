import type { MediaKind, ThumbnailTone } from '@/lib/types'

/**
 * Mock of the customer's Google Drive. Relay never copies these files — the
 * real API lists them through `drive.readonly` and streams previews from the
 * Drive thumbnail / download links.
 */

export type DriveFolder = {
  id: string
  name: string
  parentId: string | null
  /** Item count shown on folder cards in the Drive browser. */
  items: number
  /** Totals for the whole subtree, as reported by the Drive index. */
  counts: { videos: number; images: number; subfolders: number }
}

export type DriveFile = {
  id: string
  name: string
  kind: MediaKind
  tone: ThumbnailTone
  folderId: string
  /** Seconds; videos only. */
  durationSec?: number
  sizeMb: number
  /** ISO date (YYYY-MM-DD). */
  modified: string
  modifiedBy: string
  width: number
  height: number
  /** Container, e.g. "MP4", "MOV", "JPG". */
  format: string
  /** Codecs for videos, e.g. "H.264 · AAC". */
  codecs?: string
  starred?: boolean
}

export const DRIVE_ROOT_ID = 'root'

export const DRIVE_FOLDERS: DriveFolder[] = [
  { id: DRIVE_ROOT_ID, name: 'My Drive', parentId: null, items: 1, counts: { videos: 585, images: 1621, subfolders: 23 } },
  { id: 'northwind', name: 'Northwind', parentId: DRIVE_ROOT_ID, items: 3, counts: { videos: 585, images: 1621, subfolders: 22 } },
  { id: 'content-2025', name: 'Content 2025', parentId: 'northwind', items: 3, counts: { videos: 312, images: 972, subfolders: 14 } },
  { id: 'november', name: 'November', parentId: 'content-2025', items: 11, counts: { videos: 128, images: 402, subfolders: 3 } },
  { id: 'reels', name: 'Reels — 9×16', parentId: 'november', items: 24, counts: { videos: 24, images: 0, subfolders: 0 } },
  { id: 'youtube-long-form', name: 'YouTube long-form', parentId: 'november', items: 8, counts: { videos: 8, images: 0, subfolders: 0 } },
  { id: 'stills', name: 'Stills', parentId: 'november', items: 61, counts: { videos: 0, images: 61, subfolders: 0 } },
  { id: 'october', name: 'October', parentId: 'content-2025', items: 142, counts: { videos: 104, images: 318, subfolders: 4 } },
  { id: 'september', name: 'September', parentId: 'content-2025', items: 96, counts: { videos: 80, images: 252, subfolders: 4 } },
  { id: 'raw-footage', name: 'Raw footage', parentId: 'northwind', items: 96, counts: { videos: 96, images: 0, subfolders: 4 } },
  { id: 'brand-assets', name: 'Brand assets', parentId: 'northwind', items: 214, counts: { videos: 3, images: 211, subfolders: 2 } },
]

const LENA = 'Lena Ortiz'
const MAYA = 'Maya Rahman'
const JONAS = 'Jonas Weber'

export const DRIVE_FILES: DriveFile[] = [
  { id: 'f_autumn', name: 'autumn_lookbook_reel_v3.mp4', kind: 'video', tone: 'sunset', folderId: 'november', durationSec: 42, sizeMb: 248, modified: '2025-11-19', modifiedBy: LENA, width: 1080, height: 1920, format: 'MP4', codecs: 'H.264 · AAC', starred: true },
  { id: 'f_studio', name: 'studio_tour_60s.mov', kind: 'video', tone: 'ocean', folderId: 'november', durationSec: 60, sizeMb: 612, modified: '2025-11-18', modifiedBy: MAYA, width: 1920, height: 1080, format: 'MOV', codecs: 'H.264 · AAC' },
  { id: 'f_fabric', name: 'fabric-care-tips-03.mp4', kind: 'video', tone: 'sand', folderId: 'reels', durationSec: 28, sizeMb: 96, modified: '2025-11-18', modifiedBy: LENA, width: 1080, height: 1920, format: 'MP4', codecs: 'H.264 · AAC' },
  { id: 'f_holiday', name: 'holiday_gift_guide_9x16.mp4', kind: 'video', tone: 'berry', folderId: 'november', durationSec: 35, sizeMb: 182, modified: '2025-11-17', modifiedBy: MAYA, width: 1080, height: 1920, format: 'MP4', codecs: 'H.264 · AAC' },
  { id: 'f_packaging', name: 'packaging_unboxing.mp4', kind: 'video', tone: 'studio', folderId: 'november', durationSec: 51, sizeMb: 204, modified: '2025-11-16', modifiedBy: JONAS, width: 1080, height: 1350, format: 'MP4', codecs: 'H.264 · AAC' },
  { id: 'f_founders', name: 'founders_qa_full.mp4', kind: 'video', tone: 'slate', folderId: 'youtube-long-form', durationSec: 768, sizeMb: 2100, modified: '2025-11-15', modifiedBy: MAYA, width: 1920, height: 1080, format: 'MP4', codecs: 'H.264 · AAC', starred: true },
  { id: 'f_night', name: 'night_shoot_bts_01.jpg', kind: 'image', tone: 'night', folderId: 'november', sizeMb: 8.4, modified: '2025-11-15', modifiedBy: JONAS, width: 3024, height: 4032, format: 'JPG' },
  { id: 'f_flatlay', name: 'flatlay_knitwear.jpg', kind: 'image', tone: 'sand', folderId: 'november', sizeMb: 6.1, modified: '2025-11-14', modifiedBy: LENA, width: 3024, height: 4032, format: 'JPG' },
  { id: 'f_lena', name: 'lena_morning_routine.mp4', kind: 'video', tone: 'forest', folderId: 'november', durationSec: 58, sizeMb: 231, modified: '2025-11-14', modifiedBy: LENA, width: 1080, height: 1920, format: 'MP4', codecs: 'H.264 · AAC' },
  { id: 'f_store', name: 'store_opening_recap.mp4', kind: 'video', tone: 'sunset', folderId: 'october', durationSec: 134, sizeMb: 540, modified: '2025-11-12', modifiedBy: MAYA, width: 1920, height: 1080, format: 'MP4', codecs: 'H.264 · AAC' },
  { id: 'f_spring', name: 'spring_drop_teaser_cut2.mp4', kind: 'video', tone: 'berry', folderId: 'october', durationSec: 662, sizeMb: 1800, modified: '2025-11-11', modifiedBy: JONAS, width: 1080, height: 1920, format: 'MP4', codecs: 'H.264 · AAC' },
  { id: 'f_seams', name: 'behind_the_seams_ep4.mp4', kind: 'video', tone: 'night', folderId: 'youtube-long-form', durationSec: 516, sizeMb: 1400, modified: '2025-11-10', modifiedBy: MAYA, width: 1920, height: 1080, format: 'MP4', codecs: 'H.264 · AAC' },
  { id: 'f_color', name: 'color_story_rust.png', kind: 'image', tone: 'sunset', folderId: 'stills', sizeMb: 4.2, modified: '2025-11-09', modifiedBy: LENA, width: 2048, height: 2048, format: 'PNG' },
  { id: 'f_casting', name: 'model_casting_reel.mp4', kind: 'video', tone: 'ocean', folderId: 'november', durationSec: 84, sizeMb: 318, modified: '2025-11-08', modifiedBy: JONAS, width: 1080, height: 1920, format: 'MP4', codecs: 'H.264 · AAC' },
  { id: 'f_linen', name: 'linen_collection_still.jpg', kind: 'image', tone: 'studio', folderId: 'stills', sizeMb: 5.7, modified: '2025-11-07', modifiedBy: LENA, width: 4000, height: 5000, format: 'JPG' },
  { id: 'f_raw_lookbook', name: 'A001_C012_lookbook.mov', kind: 'video', tone: 'slate', folderId: 'raw-footage', durationSec: 252, sizeMb: 3400, modified: '2025-10-28', modifiedBy: JONAS, width: 3840, height: 2160, format: 'MOV', codecs: 'ProRes 422 · PCM' },
  { id: 'f_raw_studio', name: 'A002_C004_studio.mov', kind: 'video', tone: 'forest', folderId: 'raw-footage', durationSec: 187, sizeMb: 2600, modified: '2025-10-27', modifiedBy: JONAS, width: 3840, height: 2160, format: 'MOV', codecs: 'ProRes 422 · PCM' },
  { id: 'f_brand_logo', name: 'northwind-logo-lockup.png', kind: 'image', tone: 'studio', folderId: 'brand-assets', sizeMb: 1.2, modified: '2025-09-30', modifiedBy: MAYA, width: 2400, height: 1200, format: 'PNG' },
  { id: 'f_brand_sting', name: 'brand-intro-sting.mp4', kind: 'video', tone: 'night', folderId: 'brand-assets', durationSec: 6, sizeMb: 18, modified: '2025-09-28', modifiedBy: MAYA, width: 1920, height: 1080, format: 'MP4', codecs: 'H.264 · AAC' },
]

export const folderById = (id: string) => DRIVE_FOLDERS.find((f) => f.id === id)

/** Root → folder chain, e.g. [My Drive, Northwind, Content 2025]. */
export function folderChain(id: string): DriveFolder[] {
  const chain: DriveFolder[] = []
  let current = folderById(id)
  while (current) {
    chain.unshift(current)
    current = current.parentId ? folderById(current.parentId) : undefined
  }
  return chain
}

/** "My Drive / Northwind / Content 2025" */
export const folderPath = (id: string) => folderChain(id).map((f) => f.name).join(' / ')

/** The folder and every folder below it. */
export function subtreeIds(id: string): Set<string> {
  const ids = new Set([id])
  let grew = true
  while (grew) {
    grew = false
    for (const f of DRIVE_FOLDERS) {
      if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) {
        ids.add(f.id)
        grew = true
      }
    }
  }
  return ids
}

export const childFolders = (id: string) => DRIVE_FOLDERS.filter((f) => f.parentId === id)
