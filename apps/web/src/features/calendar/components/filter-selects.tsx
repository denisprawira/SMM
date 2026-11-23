import { PlatformLogo } from '@/components/platform-logo'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PLATFORM_LABEL, type Platform } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CALENDAR_ACCOUNTS, CALENDAR_PLATFORMS, CALENDAR_STATUSES, STATUS_LABEL, type CalendarFilters, type CalendarStatus } from '../api'
import { STATUS_TONE } from '../styles'

type FilterProps<T> = { value?: T; onChange: (value: T | undefined) => void; className?: string }

const fromSelect = <T extends string>(v: string) => (v === 'all' ? undefined : (v as T))

export function PlatformFilter({ value, onChange, className }: FilterProps<Platform>) {
  return (
    <Select value={value ?? 'all'} onValueChange={(v) => onChange(fromSelect<Platform>(v))}>
      <SelectTrigger aria-label="Platform" className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="end">
        <SelectItem value="all">All platforms</SelectItem>
        {CALENDAR_PLATFORMS.map((p) => (
          <SelectItem key={p} value={p}>
            <PlatformLogo platform={p} size={16} />
            {PLATFORM_LABEL[p]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function StatusFilter({ value, onChange, className }: FilterProps<CalendarStatus>) {
  return (
    <Select value={value ?? 'all'} onValueChange={(v) => onChange(fromSelect<CalendarStatus>(v))}>
      <SelectTrigger aria-label="Status" className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="end">
        <SelectItem value="all">All statuses</SelectItem>
        {CALENDAR_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            <span aria-hidden className={cn('size-2 rounded-[2px]', STATUS_TONE[s].bar)} />
            {STATUS_LABEL[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function AccountFilter({ value, onChange, className }: FilterProps<string>) {
  return (
    <Select value={value ?? 'all'} onValueChange={(v) => onChange(fromSelect<string>(v))}>
      <SelectTrigger aria-label="Account" className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="end">
        <SelectItem value="all">All accounts</SelectItem>
        {CALENDAR_ACCOUNTS.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            <PlatformLogo platform={a.platform} size={16} />
            {a.handle}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export type FilterChange = (patch: Partial<CalendarFilters>) => void
