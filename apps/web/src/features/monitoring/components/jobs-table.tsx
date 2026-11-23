import { Link } from '@tanstack/react-router'
import { Ban, ChevronDown, ChevronRight, RefreshCw, RotateCcw, X } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { GoogleDriveLogo } from '@/components/brand'
import { PlatformLogo } from '@/components/platform-logo'
import { Thumbnail } from '@/components/thumbnail'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PLATFORM_LABEL } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  ACCOUNTS,
  cancellableIds,
  failedIds,
  focusJobId,
  publishedLabel,
  scheduledLabel,
  targetsLabel,
  useCancelTargets,
  useRetryTargets,
  type JobPost,
  type JobsPage,
  type JobTarget,
} from '../api'
import { isFromControl, useOpenJob } from '../hooks'
import { Dash, ErrorText, IconAction, OpenPostButton, PostMenu, StatusSummary, TargetMenu, TargetStatus } from './job-parts'

type Selection = { selected: ReadonlySet<string>; onSelect: (ids: string[], checked: boolean) => void; onClear: () => void }

type JobsTableProps = Selection & {
  data: JobsPage
  expanded: ReadonlySet<string>
  onToggleExpanded: (postId: string) => void
  footer: ReactNode
  className?: string
}

/** Column widths from the Figma "Jobs table" (cell + 12px gap). */
const COLS = ['w-14', 'w-[312px]', 'w-[140px]', 'w-[140px]', 'w-[162px]', '', 'w-[124px]']
const cell = 'p-0 py-2.5 pr-3'
const first = 'p-0 py-2.5 pl-4'
const last = 'p-0 py-2.5 pr-4'

const checkState = (ids: string[], selected: ReadonlySet<string>) => {
  const n = ids.filter((id) => selected.has(id)).length
  return n === 0 ? false : n === ids.length ? true : ('indeterminate' as const)
}

/** Desktop / tablet jobs table (Figma 26:3526): posts with nested per-target rows, or a flat target list. */
export function JobsTable({ data, expanded, onToggleExpanded, selected, onSelect, onClear, footer, className }: JobsTableProps) {
  const pageIds = data.grouped ? data.posts.flatMap((p) => p.targets.map((t) => t.id)) : data.rows.map((r) => r.targetId)

  return (
    <Card className={className}>
      <Table className="min-w-[1060px] table-fixed">
        <colgroup>
          {COLS.map((c, i) => (
            <col key={i} className={c} />
          ))}
        </colgroup>
        <TableHeader className="bg-canvas">
          {selected.size > 0 ? (
            <BulkBar pageIds={pageIds} data={data} selected={selected} onSelect={onSelect} onClear={onClear} />
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn(first, 'h-10 py-0')}>
                <SelectAll pageIds={pageIds} selected={selected} onSelect={onSelect} />
              </TableHead>
              {['Content / target', 'Scheduled', 'Published at', 'Status', 'Error'].map((label) => (
                <TableHead key={label} className={cn(cell, 'h-10 py-0 text-caption font-medium text-tertiary')}>
                  {label}
                </TableHead>
              ))}
              <TableHead className={cn(last, 'h-10 py-0')}>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          )}
        </TableHeader>
        <TableBody>
          {data.grouped
            ? data.posts.map((post) => {
                const open = expanded.has(post.id)
                return (
                  <Fragment key={post.id}>
                    <PostRow post={post} open={open} onToggle={() => onToggleExpanded(post.id)} selected={selected} onSelect={onSelect} />
                    {open && post.targets.map((t) => <TargetRow key={t.id} post={post} target={t} />)}
                  </Fragment>
                )
              })
            : data.rows.map(({ post, targetId }) => {
                const t = post.targets.find((x) => x.id === targetId)
                return t ? <TargetRow key={t.id} post={post} target={t} flat selected={selected} onSelect={onSelect} /> : null
              })}
        </TableBody>
      </Table>
      {footer}
    </Card>
  )
}

function SelectAll({ pageIds, selected, onSelect }: Omit<Selection, 'onClear'> & { pageIds: string[] }) {
  return (
    <div className="flex">
      <Checkbox
        aria-label="Select all on this page"
        checked={checkState(pageIds, selected)}
        disabled={pageIds.length === 0}
        onCheckedChange={(v) => onSelect(pageIds, v === true)}
      />
    </div>
  )
}

/** Replaces the column header while rows are selected: bulk Retry failed / Cancel. */
function BulkBar({ pageIds, data, selected, onSelect, onClear }: Selection & { pageIds: string[]; data: JobsPage }) {
  const retry = useRetryTargets()
  const cancel = useCancelTargets()
  const targets = [...data.posts.flatMap((p) => p.targets), ...data.rows.map((r) => r.post.targets.find((t) => t.id === r.targetId)!)].filter((t) => t && selected.has(t.id))
  const failed = failedIds(targets)
  const cancellable = cancellableIds(targets)
  const run = (mutate: (ids: string[]) => void, ids: string[]) => {
    mutate(ids)
    onClear()
  }
  return (
    <TableRow className="hover:bg-transparent">
      <TableHead className={cn(first, 'h-10 py-0')}>
        <SelectAll pageIds={pageIds} selected={selected} onSelect={onSelect} />
      </TableHead>
      <TableHead colSpan={6} className={cn(last, 'h-10 py-0')}>
        <div className="flex items-center gap-2">
          <span className="mr-1 text-caption font-medium text-foreground">
            {targets.length} {targets.length === 1 ? 'target' : 'targets'} selected
          </span>
          <Button variant="outline" size="xs" disabled={failed.length === 0} onClick={() => run(retry.mutate, failed)}>
            <RotateCcw />
            Retry failed{failed.length > 0 && ` (${failed.length})`}
          </Button>
          <Button variant="outline" size="xs" disabled={cancellable.length === 0} onClick={() => run(cancel.mutate, cancellable)}>
            <Ban />
            Cancel pending{cancellable.length > 0 && ` (${cancellable.length})`}
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="xs" onClick={onClear}>
            <X />
            Clear selection
          </Button>
        </div>
      </TableHead>
    </TableRow>
  )
}

function PostRow({ post, open, onToggle, selected, onSelect }: { post: JobPost; open: boolean; onToggle: () => void } & Omit<Selection, 'onClear'>) {
  const openJob = useOpenJob()
  const retry = useRetryTargets()
  const ids = post.targets.map((t) => t.id)
  const state = checkState(ids, selected)
  const failed = failedIds(post.targets)
  const Chevron = open ? ChevronDown : ChevronRight
  return (
    <TableRow
      data-state={state === true ? 'selected' : undefined}
      className={cn('cursor-pointer', open && 'bg-canvas')}
      onClick={(e) => !isFromControl(e.target) && openJob(focusJobId(post))}
    >
      <TableCell className={first}>
        <div className="flex">
          <Checkbox aria-label={`Select ${post.title}`} checked={state} onCheckedChange={(v) => onSelect(ids, v === true)} />
        </div>
      </TableCell>
      <TableCell className={cell}>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-expanded={open}
            aria-label={`${open ? 'Collapse' : 'Expand'} targets for ${post.title}`}
            onClick={onToggle}
            className="-m-1 flex shrink-0 rounded-sm p-1 text-tertiary outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/20"
          >
            <Chevron aria-hidden className="size-3.5" />
          </button>
          <Thumbnail tone={post.tone} ratio={1} className="size-10 rounded-md" />
          <div className="flex min-w-0 flex-col gap-px">
            <Link
              to="/monitoring/$jobId"
              params={{ jobId: focusJobId(post) }}
              search
              className="truncate text-body-sm font-medium text-foreground outline-none hover:underline focus-visible:underline"
            >
              {post.title}
            </Link>
            <span className="flex min-w-0 items-center gap-1">
              <GoogleDriveLogo size={11} />
              <span className="truncate text-caption text-tertiary">{post.file}</span>
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className={cn(cell, 'text-caption text-muted-foreground')}>{scheduledLabel(post)}</TableCell>
      <TableCell className={cn(cell, 'text-caption text-tertiary')}>{targetsLabel(post.targets.length)}</TableCell>
      <TableCell className={cell}>
        <StatusSummary post={post} />
      </TableCell>
      <TableCell className={cell} />
      <TableCell className={last}>
        <div className="flex items-center justify-end">
          {failed.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => retry.mutate(failed)}>
              Retry failed
            </Button>
          ) : (
            <PostMenu post={post} />
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

function TargetRow({ post, target, flat = false, selected, onSelect }: { post: JobPost; target: JobTarget; flat?: boolean } & Partial<Omit<Selection, 'onClear'>>) {
  const openJob = useOpenJob()
  const isSelected = flat && selected?.has(target.id)
  const account = ACCOUNTS[target.account]
  const published = publishedLabel(post, target)
  return (
    <TableRow data-state={isSelected ? 'selected' : undefined} className="cursor-pointer" onClick={(e) => !isFromControl(e.target) && openJob(target.id)}>
      <TableCell className={cn(first, 'py-2')}>
        {flat && onSelect && (
          <div className="flex">
            <Checkbox
              aria-label={`Select ${post.title} on ${PLATFORM_LABEL[target.platform]}`}
              checked={!!isSelected}
              onCheckedChange={(v) => onSelect([target.id], v === true)}
            />
          </div>
        )}
      </TableCell>
      <TableCell className={cn(cell, 'py-2')}>
        <div className={cn('flex items-center gap-2.5', !flat && 'pl-6')}>
          {!flat && <span aria-hidden className="h-px w-3 shrink-0 bg-[var(--border-strong)]" />}
          <PlatformLogo platform={target.platform} size={20} />
          <div className="flex min-w-0 flex-col">
            <Link
              to="/monitoring/$jobId"
              params={{ jobId: target.id }}
              search
              className="truncate text-body-sm text-foreground outline-none hover:underline focus-visible:underline"
            >
              {flat ? post.title : account.handle}
            </Link>
            <span className="truncate text-caption text-tertiary">{flat ? `${account.handle} · ${PLATFORM_LABEL[target.platform]}` : PLATFORM_LABEL[target.platform]}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className={cn(cell, 'py-2 text-caption text-muted-foreground')}>{scheduledLabel(post)}</TableCell>
      <TableCell className={cn(cell, 'py-2 text-caption text-muted-foreground')}>{published ?? <Dash />}</TableCell>
      <TableCell className={cn(cell, 'py-2')}>
        <TargetStatus target={target} />
      </TableCell>
      <TableCell className={cn(cell, 'py-2')}>{target.status === 'failed' && target.error ? <ErrorText>{target.error.message}</ErrorText> : <Dash />}</TableCell>
      <TableCell className={cn(last, 'py-2')}>
        <div className="flex items-center justify-end gap-0.5">
          <TargetPrimaryAction target={target} />
          <TargetMenu target={target} />
        </div>
      </TableCell>
    </TableRow>
  )
}

/** The one inline action per target: Open post · Retry · Reconnect · Cancel target. */
function TargetPrimaryAction({ target }: { target: JobTarget }) {
  const retry = useRetryTargets()
  const cancel = useCancelTargets()
  if (target.status === 'published') return <OpenPostButton target={target} />
  if (target.status === 'failed') {
    if (target.error?.remedy === 'reconnect') {
      return (
        <Button asChild variant="outline" size="sm">
          <Link to="/accounts">
            <RefreshCw />
            Reconnect
          </Link>
        </Button>
      )
    }
    return (
      <Button variant="outline" size="sm" onClick={() => retry.mutate([target.id])}>
        <RotateCcw className="text-foreground" />
        Retry
      </Button>
    )
  }
  if (target.status === 'scheduled' || target.status === 'processing') {
    return <IconAction label="Cancel target" icon={Ban} onClick={() => cancel.mutate([target.id])} />
  }
  return null
}
