import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { CircleAlert, CircleCheck, Copy, Ellipsis } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { PlatformLogo } from '@/components/platform-logo'
import { SegmentedControl } from '@/components/segmented-control'
import { PLATFORM_LABEL, type Platform } from '@/lib/types'
import { cn } from '@/lib/utils'
import { accountsQueryOptions, driveFilesQueryOptions, type SocialAccount } from '../api'
import { PhonePreview } from '../components/phone-preview'
import { markVisited, useDraft, type Draft } from '../draft-store'
import { captionFor, frameTones, isCarousel, PLATFORM_ORDER, PLATFORM_SHORT, selectedMedia, targetLabel, targetsByPlatform, targetStatus } from '../model'
import { FacebookPanel, InstagramPanel, SharedPanel, TikTokPanel, YouTubePanel } from './customize-panels'

const route = getRouteApi('/create/customize')

const STATUS_ICON = {
  ready: <CircleCheck aria-label="Ready" className="size-3.5 shrink-0 text-success" />,
  attention: <CircleAlert aria-label="Needs attention" className="size-3.5 shrink-0 text-warning" />,
  idle: <Ellipsis aria-label="Using shared defaults" className="size-3.5 shrink-0 text-tertiary" />,
}

export function CustomizeStep() {
  const { target, preview } = route.useSearch()
  const navigate = route.useNavigate()
  const draft = useDraft()
  const { data: accounts } = useSuspenseQuery(accountsQueryOptions)
  const { data: files } = useSuspenseQuery(driveFilesQueryOptions)
  const media = selectedMedia(draft, files)
  const images = files.filter((f) => f.kind === 'image')
  const targets = targetsByPlatform(draft, accounts)
  const active = target === 'shared' ? null : (targets.find((t) => t.id === target) ?? targets[0] ?? null)
  const activeId = active?.id ?? 'shared'

  // A target counts as reviewed once the user moves on from it.
  const prev = useRef(activeId)
  useEffect(() => {
    if (prev.current !== activeId) {
      if (prev.current !== 'shared') markVisited(prev.current)
      prev.current = activeId
    }
  }, [activeId])

  const platforms = PLATFORM_ORDER.filter((p) => targets.some((t) => t.platform === p))
  const previewPlatform: Platform | undefined = preview && platforms.includes(preview) ? preview : (active?.platform ?? platforms[0])
  const settings = active ? draft.settings[active.id] : undefined

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col md:flex-row">
      {/* Mobile: platform chips under the step header */}
      <nav aria-label="Targets" className="flex shrink-0 gap-2 overflow-x-auto border-b bg-background px-4 pb-3 [scrollbar-width:none] md:hidden">
        {targets.map((t) => {
          const current = t.id === activeId
          const dup = targets.filter((x) => x.platform === t.platform).length > 1
          return (
            <Link
              key={t.id}
              to="/create/customize"
              search={{ target: t.id }}
              replace
              aria-current={current ? 'page' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full border py-1.5 pr-2.5 pl-1.5 text-caption font-medium whitespace-nowrap',
                current ? 'border-inverse bg-inverse text-primary-foreground' : 'bg-background text-muted-foreground',
              )}
            >
              <PlatformLogo platform={t.platform} size={18} />
              {dup ? targetLabel(t) : PLATFORM_LABEL[t.platform]}
              {targetStatus(draft, t) === 'attention' && <span aria-label="Needs attention" className="size-1.5 rounded-full bg-warning" />}
            </Link>
          )
        })}
      </nav>

      <TargetsList draft={draft} targets={targets} activeId={activeId} />

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div key={activeId} className={cn('flex w-full flex-col gap-3 p-4 md:p-6', active?.platform === 'youtube' ? 'md:gap-4' : 'md:gap-[18px]')}>
          {!active || !settings ? (
            <SharedPanel draft={draft} targets={targets} />
          ) : settings.platform === 'tiktok' ? (
            <TikTokPanel account={active} settings={settings} draft={draft} media={media} images={images} />
          ) : settings.platform === 'instagram' ? (
            <InstagramPanel account={active} settings={settings} draft={draft} media={media} images={images} />
          ) : settings.platform === 'youtube' ? (
            <YouTubePanel account={active} settings={settings} draft={draft} media={media} images={images} />
          ) : (
            <FacebookPanel account={active} settings={settings} draft={draft} media={media} images={images} />
          )}
        </div>
      </main>

      {previewPlatform && (
        <aside aria-label="Preview" className="hidden w-[316px] shrink-0 flex-col items-center gap-3 overflow-y-auto border-l bg-background p-6 xl:flex">
          <div className="flex w-full items-center gap-1.5">
            <h2 className="text-body-sm font-medium text-foreground">Preview</h2>
            <div className="flex-1" />
            <SegmentedControl
              aria-label="Preview platform"
              value={previewPlatform}
              options={platforms.map((p) => ({ value: p, label: PLATFORM_SHORT[p] }))}
              onValueChange={(p) => navigate({ search: (s) => ({ ...s, preview: p }), replace: true })}
            />
          </div>
          <Preview draft={draft} platform={previewPlatform} targets={targets} media={media} />
          <p className="w-[260px] text-caption text-tertiary">Approximate preview. Final layout is rendered by {PLATFORM_LABEL[previewPlatform]}.</p>
        </aside>
      )}
    </div>
  )
}

function TargetsList({ draft, targets, activeId }: { draft: Draft; targets: SocialAccount[]; activeId: string }) {
  const item = (current: boolean) =>
    cn(
      'flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-[7px] text-left outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/20',
      current ? 'bg-background shadow-xs' : 'border-transparent hover:bg-subtle',
    )
  return (
    <nav aria-label="Targets" className="hidden w-[260px] shrink-0 overflow-y-auto py-6 pr-4 pl-6 md:block">
      <div className="flex w-[220px] flex-col gap-0.5">
        <p className="px-2 pb-2 text-overline text-tertiary uppercase">Targets</p>
        <Link to="/create/customize" search={{ target: 'shared' }} replace className={item(activeId === 'shared')} aria-current={activeId === 'shared' ? 'page' : undefined}>
          <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted">
            <Copy aria-hidden className="size-3 text-muted-foreground" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-body-sm font-medium text-foreground">Shared defaults</span>
            <span className="truncate text-caption text-tertiary">Applied to all</span>
          </span>
        </Link>
        {targets.map((t) => (
          <Link key={t.id} to="/create/customize" search={{ target: t.id }} replace className={item(t.id === activeId)} aria-current={t.id === activeId ? 'page' : undefined}>
            <PlatformLogo platform={t.platform} size={20} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-body-sm font-medium text-foreground">{PLATFORM_LABEL[t.platform]}</span>
              <span className="truncate text-caption text-tertiary">{targetLabel(t)}</span>
            </span>
            {STATUS_ICON[targetStatus(draft, t)]}
          </Link>
        ))}
        <div className="h-3" />
        <div className="flex flex-col gap-1.5 rounded-[10px] bg-subtle p-3 text-caption">
          <p className="font-medium text-muted-foreground">Platforms differ</p>
          <p className="text-tertiary">Titles exist only on YouTube. Custom thumbnails: YouTube (regular videos). TikTok &amp; Instagram use a cover frame. Caption limits vary.</p>
        </div>
      </div>
    </nav>
  )
}

function Preview({ draft, platform, targets, media }: { draft: Draft; platform: Platform; targets: SocialAccount[]; media: ReturnType<typeof selectedMedia> }) {
  const account = targets.find((t) => t.platform === platform)
  if (!account || !media[0]) return null
  const s = draft.settings[account.id]
  const tone = s && (s.platform === 'tiktok' || s.platform === 'instagram') && !isCarousel(media) ? frameTones(media[0].tone)[s.coverFrame] : media[0].tone
  const text = s?.platform === 'youtube' ? s.title || captionFor(draft, account.id) : captionFor(draft, account.id)
  const handle = platform === 'facebook' ? account.name : account.handle
  return <PhonePreview platform={platform} handle={handle} text={text} tone={tone} slides={isCarousel(media) ? media.length : 1} />
}
