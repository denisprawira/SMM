import { CircleCheck, Copy, Image, TriangleAlert } from 'lucide-react'
import { PlatformLogo } from '@/components/platform-logo'
import { SegmentedControl } from '@/components/segmented-control'
import { Thumbnail } from '@/components/thumbnail'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ReactNode } from 'react'
import { PLATFORM_LABEL, type Platform } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { DriveFile, SocialAccount } from '../api'
import { CaptionField } from '../components/caption-field'
import { CoverFrames, FieldLabel, FieldStack, HashtagsField, PanelHeader, ResetToShared, SettingsCard, SwitchRow, TagsInput } from '../components/fields'
import {
  canBeShort,
  resetToShared,
  setSharedCaption,
  updateSettings,
  type Draft,
  type FacebookSettings,
  type InstagramSettings,
  type TikTokPrivacy,
  type TikTokSettings,
  type YouTubeSettings,
  type YouTubeVisibility,
} from '../draft-store'
import { ACCOUNT_KIND_LABEL, CAPTION_LIMIT, captionFor, FACEBOOK_HOOK_LENGTH, frameTones, isCarousel, isEdited, targetIssues, targetLabel, TITLE_LIMIT } from '../model'

const SUGGESTED = ['#knitwear', '#ootd', '#capsulewardrobe']

type PanelProps<S> = { account: SocialAccount; settings: S; draft: Draft; media: DriveFile[]; images: DriveFile[] }

/** M05 mobile: media card with "Fits <platform>" above the caption. */
function MobileMediaCard({ media, platform }: { media: DriveFile[]; platform: Platform }) {
  const m = media[0]
  if (!m) return null
  return (
    <div className="flex w-full items-center gap-3 rounded-xl border bg-card p-3 md:hidden">
      <Thumbnail tone={m.tone} ratio={54 / 96} className="h-24 w-[54px] rounded-md" />
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <p className="truncate text-body-sm font-medium text-foreground">{isCarousel(media) ? `${media.length} images · carousel` : m.name}</p>
        <p className="truncate text-caption text-tertiary">{isCarousel(media) ? `From Drive · ${m.format}` : `From Drive · ${m.duration} · ${m.aspect}`}</p>
        <p className="flex items-center gap-1 text-caption font-medium text-success-text">
          <CircleCheck aria-hidden className="size-3 text-success" />
          Fits {PLATFORM_LABEL[platform]}
        </p>
      </div>
    </div>
  )
}

function CaptionBlock({ draft, account, onChange, hint }: { draft: Draft; account: SocialAccount; onChange: (v: string) => void; hint?: ReactNode }) {
  const id = `caption-${account.id}`
  const caption = captionFor(draft, account.id)
  return (
    <FieldStack>
      <FieldLabel htmlFor={id} note={isEdited(draft, account.id) ? `Edited for ${PLATFORM_LABEL[account.platform]}` : undefined}>
        Caption
      </FieldLabel>
      <CaptionField id={id} value={caption} onChange={onChange} limit={CAPTION_LIMIT[account.platform]} />
      {hint}
    </FieldStack>
  )
}

function CoverBlock({ media, value, onChange, note }: { media: DriveFile[]; value: number; onChange: (i: number) => void; note: string }) {
  if (isCarousel(media) || !media[0]) return null
  return (
    <FieldStack>
      <p className="text-body-sm font-medium text-foreground">Cover frame</p>
      <CoverFrames tones={frameTones(media[0].tone)} value={value} onChange={onChange} />
      <p className="hidden text-caption text-tertiary md:block">{note}</p>
    </FieldStack>
  )
}

const subtitle = (a: SocialAccount) => `${targetLabel(a)} · ${ACCOUNT_KIND_LABEL[a.kind]}`

/* ── TikTok ────────────────────────────────────────────────────────── */

const PRIVACY: { value: TikTokPrivacy; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'friends', label: 'Friends' },
  { value: 'only-me', label: 'Only me' },
]

export function TikTokPanel({ account, settings, draft, media }: PanelProps<TikTokSettings>) {
  const set = (patch: Partial<Omit<TikTokSettings, 'platform'>>) => updateSettings<'tiktok'>(account.id, patch)
  const caption = captionFor(draft, account.id)
  return (
    <>
      <PanelHeader logo={<PlatformLogo platform="tiktok" size={28} />} title="TikTok" subtitle={subtitle(account)} action={<ResetToShared disabled={!isEdited(draft, account.id)} onClick={() => resetToShared(account.id)} />} />
      <MobileMediaCard media={media} platform="tiktok" />
      <CaptionBlock draft={draft} account={account} onChange={(caption) => set({ caption })} />
      <HashtagsField className="hidden md:flex" caption={caption} onChange={(caption) => set({ caption })} suggestions={SUGGESTED} />
      <CoverBlock media={media} value={settings.coverFrame} onChange={(coverFrame) => set({ coverFrame })} note="TikTok picks a frame from the video — uploading a separate cover image isn’t supported." />
      <SettingsCard title="TikTok settings">
        <div className="hidden w-full items-center gap-3 md:flex">
          <Label htmlFor={`${account.id}-privacy`} className="text-body-sm font-normal text-muted-foreground">
            Who can view
          </Label>
          <div className="flex-1" />
          <Select value={settings.whoCanView} onValueChange={(v) => set({ whoCanView: v as TikTokPrivacy })}>
            <SelectTrigger id={`${account.id}-privacy`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              {PRIVACY.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <SwitchRow id={`${account.id}-comments`} label="Allow comments" checked={settings.allowComments} onCheckedChange={(allowComments) => set({ allowComments })} />
        <SwitchRow id={`${account.id}-duet`} label="Allow Duet" checked={settings.allowDuet} onCheckedChange={(allowDuet) => set({ allowDuet })} />
        <SwitchRow id={`${account.id}-stitch`} label="Allow Stitch" checked={settings.allowStitch} onCheckedChange={(allowStitch) => set({ allowStitch })} />
        <SwitchRow
          id={`${account.id}-branded`}
          className="hidden md:flex"
          label="Branded content"
          description="Adds a “Paid partnership” label"
          checked={settings.brandedContent}
          onCheckedChange={(brandedContent) => set({ brandedContent })}
        />
      </SettingsCard>
    </>
  )
}

/* ── Instagram ─────────────────────────────────────────────────────── */

export function InstagramPanel({ account, settings, draft, media }: PanelProps<InstagramSettings>) {
  const set = (patch: Partial<Omit<InstagramSettings, 'platform'>>) => updateSettings<'instagram'>(account.id, patch)
  const caption = captionFor(draft, account.id)
  const tags = caption.match(/#/g)?.length ?? 0
  return (
    <>
      <PanelHeader logo={<PlatformLogo platform="instagram" size={28} />} title="Instagram" subtitle={subtitle(account)} action={<ResetToShared disabled={!isEdited(draft, account.id)} onClick={() => resetToShared(account.id)} />} />
      <MobileMediaCard media={media} platform="instagram" />
      <CaptionBlock draft={draft} account={account} onChange={(caption) => set({ caption })} hint={tags > 30 ? <p className="text-caption text-danger-text">Instagram allows up to 30 hashtags.</p> : undefined} />
      <HashtagsField className="hidden md:flex" caption={caption} onChange={(caption) => set({ caption })} suggestions={SUGGESTED} />
      <CoverBlock media={media} value={settings.coverFrame} onChange={(coverFrame) => set({ coverFrame })} note="Instagram shows this frame as the Reel cover on your profile grid." />
      <SettingsCard title="Instagram settings">
        <SwitchRow id={`${account.id}-feed`} label="Also share to Feed" description="Shows the Reel on your profile grid" checked={settings.shareToFeed} onCheckedChange={(shareToFeed) => set({ shareToFeed })} />
        <SwitchRow id={`${account.id}-comments`} label="Allow comments" checked={settings.allowComments} onCheckedChange={(allowComments) => set({ allowComments })} />
        <SwitchRow id={`${account.id}-likes`} label="Hide like and view counts" checked={settings.hideLikes} onCheckedChange={(hideLikes) => set({ hideLikes })} />
      </SettingsCard>
    </>
  )
}

/* ── Facebook ──────────────────────────────────────────────────────── */

export function FacebookPanel({ account, settings, draft, media }: PanelProps<FacebookSettings>) {
  const set = (patch: Partial<Omit<FacebookSettings, 'platform'>>) => updateSettings<'facebook'>(account.id, patch)
  const caption = captionFor(draft, account.id)
  const long = caption.length > FACEBOOK_HOOK_LENGTH
  return (
    <>
      <PanelHeader logo={<PlatformLogo platform="facebook" size={28} />} title="Facebook" subtitle={subtitle(account)} action={<ResetToShared disabled={!isEdited(draft, account.id)} onClick={() => resetToShared(account.id)} />} />
      <MobileMediaCard media={media} platform="facebook" />
      <CaptionBlock
        draft={draft}
        account={account}
        onChange={(caption) => set({ caption })}
        hint={
          long ? (
            <p className="flex items-start gap-1 text-caption text-warning-text">
              <TriangleAlert aria-hidden className="mt-0.5 size-3 shrink-0 text-warning" />
              Feed cuts captions after 3 lines — consider a shorter hook
            </p>
          ) : undefined
        }
      />
      <HashtagsField className="hidden md:flex" caption={caption} onChange={(caption) => set({ caption })} suggestions={SUGGESTED} />
      <SettingsCard title="Facebook settings">
        <SwitchRow id={`${account.id}-comments`} label="Allow comments" checked={settings.allowComments} onCheckedChange={(allowComments) => set({ allowComments })} />
        <SwitchRow id={`${account.id}-embed`} label="Allow embedding" description="Lets people embed this Reel on other websites" checked={settings.allowEmbedding} onCheckedChange={(allowEmbedding) => set({ allowEmbedding })} />
      </SettingsCard>
    </>
  )
}

/* ── YouTube ───────────────────────────────────────────────────────── */

const VISIBILITY: { value: YouTubeVisibility; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'unlisted', label: 'Unlisted' },
  { value: 'private', label: 'Private' },
]
const CATEGORIES = ['Howto & Style', 'People & Blogs', 'Entertainment', 'Education', 'Film & Animation']
const PLAYLISTS = [
  { value: 'none', label: 'No playlist' },
  { value: 'fall-2025', label: 'Fall 2025' },
  { value: 'lookbooks', label: 'Lookbooks' },
  { value: 'behind-the-seams', label: 'Behind the seams' },
]
const RADIO = 'size-4 border-strong shadow-none data-[state=checked]:border-[5px] data-[state=checked]:border-primary [&_[data-slot=radio-group-indicator]]:hidden'

function SelectField({ id, label, value, options, onChange }: { id: string; label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function YouTubePanel({ account, settings, draft, media, images }: PanelProps<YouTubeSettings>) {
  const set = (patch: Partial<Omit<YouTubeSettings, 'platform'>>) => updateSettings<'youtube'>(account.id, patch)
  const shortOk = canBeShort(media[0])
  const titleError = draft.showErrors ? targetIssues(draft, account.id).errors.find((e) => e.toLowerCase().includes('title')) : undefined
  const description = captionFor(draft, account.id)
  const options = shortOk
    ? ([
        { value: 'short', label: 'Short' },
        { value: 'video', label: 'Video' },
      ] as const)
    : ([{ value: 'video', label: 'Video' }] as const)

  return (
    <>
      <PanelHeader
        logo={<PlatformLogo platform="youtube" size={28} />}
        title="YouTube"
        subtitle={subtitle(account)}
        action={
          <div className="flex items-center gap-1.5">
            <span className="text-body-sm text-muted-foreground">Publish as</span>
            <SegmentedControl aria-label="Publish as" value={settings.publishAs} options={options} onValueChange={(publishAs) => set({ publishAs })} />
          </div>
        }
      />
      <MobileMediaCard media={media} platform="youtube" />
      <SegmentedControl aria-label="Publish as" value={settings.publishAs} options={options} onValueChange={(publishAs) => set({ publishAs })} fill className="md:hidden" />

      <FieldStack>
        <FieldLabel htmlFor="yt-title" note="Required · YouTube only" noteClassName="text-warning-text">
          Title
        </FieldLabel>
        <div className="relative">
          <Input
            id="yt-title"
            value={settings.title}
            placeholder="Add a title that describes your video"
            aria-invalid={!!titleError || settings.title.length > TITLE_LIMIT || undefined}
            onChange={(e) => set({ title: e.target.value })}
            className="pr-20 text-body-sm"
          />
          <span className={cn('pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-caption tabular-nums', settings.title.length > TITLE_LIMIT ? 'text-danger-text' : 'text-tertiary')}>
            {settings.title.length} / {TITLE_LIMIT}
          </span>
        </div>
        {titleError && <p className="text-caption text-danger-text">{titleError}</p>}
      </FieldStack>

      <FieldStack>
        <FieldLabel htmlFor="yt-description" note={settings.description !== null ? undefined : 'Using shared caption'} noteClassName="text-tertiary">
          Description
        </FieldLabel>
        <CaptionField id="yt-description" value={description} onChange={(v) => set({ description: v })} limit={CAPTION_LIMIT.youtube} desktopHeight="md:h-16 md:pb-0" placeholder="Tell viewers about your video" />
      </FieldStack>

      <FieldStack>
        <p className="text-body-sm font-medium text-foreground">Thumbnail</p>
        {settings.publishAs === 'short' ? (
          <div className="flex max-w-[434px] items-start gap-2.5 rounded-[10px] border border-dashed bg-subtle p-3">
            <Image aria-hidden className="size-[18px] shrink-0 text-tertiary" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-body-sm font-medium text-muted-foreground">Custom thumbnail — regular videos only</p>
              <p className="text-caption text-tertiary">Shorts show a frame chosen by YouTube. Switch “Publish as” to Video to pick an image from your Drive.</p>
            </div>
          </div>
        ) : (
          <>
            <div role="radiogroup" aria-label="Custom thumbnail" className="flex flex-wrap gap-2">
              {images.map((img) => {
                const selected = settings.thumbnailId === img.id
                return (
                  <button
                    key={img.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={img.name}
                    title={img.name}
                    onClick={() => set({ thumbnailId: selected ? null : img.id })}
                    className="relative overflow-hidden rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
                  >
                    <Thumbnail tone={img.tone} ratio={16 / 9} className="h-[54px] w-24 rounded-md" />
                    {selected && <span aria-hidden className="absolute inset-0 rounded-md border-[2.5px] border-primary" />}
                  </button>
                )
              })}
            </div>
            <p className="text-caption text-tertiary">Pick an image from your Drive · 1280×720 or larger</p>
          </>
        )}
      </FieldStack>

      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <SelectField id="yt-visibility" label="Visibility" value={settings.visibility} options={VISIBILITY} onChange={(v) => set({ visibility: v as YouTubeVisibility })} />
        <SelectField id="yt-category" label="Category" value={settings.category} options={CATEGORIES.map((c) => ({ value: c, label: c }))} onChange={(category) => set({ category })} />
        <SelectField id="yt-playlist" label="Playlist" value={settings.playlist} options={PLAYLISTS} onChange={(playlist) => set({ playlist })} />
      </div>

      <FieldStack>
        <FieldLabel htmlFor="yt-tags" note="Not shown publicly" noteClassName="font-normal text-tertiary">
          Tags
        </FieldLabel>
        <TagsInput id="yt-tags" tags={settings.tags} onChange={(tags) => set({ tags })} />
      </FieldStack>

      <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] border bg-background p-3">
        <p id="yt-audience" className="text-body-sm font-medium text-foreground">
          Audience
        </p>
        <RadioGroup aria-labelledby="yt-audience" value={settings.madeForKids ? 'yes' : 'no'} onValueChange={(v) => set({ madeForKids: v === 'yes' })} className="flex flex-wrap gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <RadioGroupItem id="kids-no" value="no" className={RADIO} />
            <Label htmlFor="kids-no" className="text-body-sm font-normal text-foreground">
              No, it’s not made for kids
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem id="kids-yes" value="yes" className={RADIO} />
            <Label htmlFor="kids-yes" className="text-body-sm font-normal text-foreground">
              Yes, it’s made for kids
            </Label>
          </div>
        </RadioGroup>
      </div>
    </>
  )
}

/* ── Shared defaults ───────────────────────────────────────────────── */

export function SharedPanel({ draft, targets }: { draft: Draft; targets: SocialAccount[] }) {
  const limit = Math.min(...targets.filter((t) => t.platform !== 'youtube').map((t) => CAPTION_LIMIT[t.platform]), CAPTION_LIMIT.youtube)
  return (
    <>
      <div className="flex w-full items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
          <Copy aria-hidden className="size-4 text-muted-foreground" />
        </span>
        <div className="flex min-w-0 flex-col">
          <h2 className="text-h2 text-foreground">Shared defaults</h2>
          <p className="text-body-sm text-tertiary">Applied to every target unless you edit it for that platform.</p>
        </div>
      </div>
      <FieldStack>
        <FieldLabel htmlFor="caption-shared">Caption</FieldLabel>
        <CaptionField id="caption-shared" value={draft.caption} onChange={setSharedCaption} limit={limit} />
      </FieldStack>
      <HashtagsField caption={draft.caption} onChange={setSharedCaption} suggestions={SUGGESTED} />
      <SettingsCard title="Where it’s used">
        {targets.map((t) => {
          const edited = isEdited(draft, t.id)
          return (
            <div key={t.id} className="flex w-full items-center gap-2.5">
              <PlatformLogo platform={t.platform} size={18} />
              <span className="min-w-0 flex-1 truncate text-body-sm text-foreground">
                {PLATFORM_LABEL[t.platform]} · {targetLabel(t)}
              </span>
              {edited ? (
                <>
                  <span className="text-caption font-medium text-primary-text">{t.platform === 'youtube' ? 'Own description' : 'Edited'}</span>
                  <Button variant="ghost" size="xs" onClick={() => resetToShared(t.id)}>
                    Use shared
                  </Button>
                </>
              ) : (
                <span className="text-caption text-tertiary">Uses shared caption</span>
              )}
            </div>
          )
        })}
      </SettingsCard>
    </>
  )
}
