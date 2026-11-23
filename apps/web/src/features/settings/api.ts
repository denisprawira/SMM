import { queryOptions, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'
import { sessionQueryOptions, useSession, type Session } from '@/features/session/api'
import { mockRequest } from '@/lib/api'
import type { Platform, ThumbnailTone } from '@/lib/types'

/* ── Shared option lists ───────────────────────────────────────────── */

/** An image file picked from the customer's Google Drive (previewed, never copied). */
export type DriveImage = { id: string; name: string; tone: ThumbnailTone }

export const TIME_ZONES = [
  { value: 'America/New_York', label: 'America/New_York (EST, UTC−5)', short: 'EST' },
  { value: 'America/Chicago', label: 'America/Chicago (CST, UTC−6)', short: 'CST' },
  { value: 'America/Denver', label: 'America/Denver (MST, UTC−7)', short: 'MST' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST, UTC−8)', short: 'PST' },
  { value: 'Europe/London', label: 'Europe/London (GMT, UTC+0)', short: 'GMT' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET, UTC+1)', short: 'CET' },
  { value: 'Asia/Jakarta', label: 'Asia/Jakarta (WIB, UTC+7)', short: 'WIB' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT, UTC+8)', short: 'SGT' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEDT, UTC+11)', short: 'AEDT' },
] as const
export type TimeZone = (typeof TIME_ZONES)[number]['value']

export const WEEK_STARTS = [
  { value: 'monday', label: 'Monday' },
  { value: 'sunday', label: 'Sunday' },
  { value: 'saturday', label: 'Saturday' },
] as const
export type WeekStart = (typeof WEEK_STARTS)[number]['value']

export const DATE_FORMATS = [
  { value: 'mdy-12', label: 'Nov 21, 2025 · 12-hour' },
  { value: 'mdy-24', label: 'Nov 21, 2025 · 24-hour' },
  { value: 'dmy-24', label: '21 Nov 2025 · 24-hour' },
  { value: 'iso-24', label: '2025-11-21 · 24-hour' },
] as const
export type DateFormat = (typeof DATE_FORMATS)[number]['value']

/** Image files in the connected Drive that can be used as a logo / photo. */
export const DRIVE_IMAGES: DriveImage[] = [
  { id: 'drv_logo_night', name: 'northwind-mark-dark.png', tone: 'night' },
  { id: 'drv_logo_sand', name: 'northwind-mark-sand.png', tone: 'sand' },
  { id: 'drv_logo_ocean', name: 'northwind-wave.png', tone: 'ocean' },
  { id: 'drv_portrait_studio', name: 'maya-portrait.jpg', tone: 'studio' },
  { id: 'drv_team_forest', name: 'team-offsite.jpg', tone: 'forest' },
  { id: 'drv_lookbook_berry', name: 'lookbook-cover.jpg', tone: 'berry' },
]

/* ── Types ─────────────────────────────────────────────────────────── */

export type WorkspaceSettings = {
  name: string
  /** URL slug — relay.app/<slug>. */
  slug: string
  /** `null` = the workspace initial on bg/inverse. */
  logo: DriveImage | null
  timeZone: TimeZone
  weekStart: WeekStart
}

export type Role = 'owner' | 'admin' | 'editor' | 'contributor' | 'viewer'
export type AssignableRole = Exclude<Role, 'owner'>

export const ROLE_LABEL: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  contributor: 'Contributor',
  viewer: 'Viewer',
}

/** Figma role legend under the Team members table. */
export const ASSIGNABLE_ROLES: { value: AssignableRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'Manage team, billing and integrations' },
  { value: 'editor', label: 'Editor', description: 'Create, schedule and publish' },
  { value: 'contributor', label: 'Contributor', description: 'Draft posts for approval' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
]

export type TeamMember = {
  id: string
  /** `null` while the invite is pending. */
  name: string | null
  email: string
  initials: string
  role: Role
  /** Social accounts this member can publish to. */
  access: 'all' | number
  lastActive: string
  you?: boolean
  invite?: { by: string; on: string }
}

export type Profile = {
  fullName: string
  email: string
  photo: DriveImage | null
  /** `workspace` = follow the workspace default time zone. */
  timeZone: 'workspace' | TimeZone
  dateFormat: DateFormat
}

export type NotificationChannel = 'inApp' | 'email' | 'slack'
export const NOTIFICATION_CHANNELS: { id: NotificationChannel; label: string }[] = [
  { id: 'inApp', label: 'In-app' },
  { id: 'email', label: 'Email' },
  { id: 'slack', label: 'Slack' },
]

export type NotificationGroup = 'publishing' | 'accounts' | 'reports'
export const NOTIFICATION_GROUPS: { id: NotificationGroup; label: string }[] = [
  { id: 'publishing', label: 'Publishing' },
  { id: 'accounts', label: 'Accounts & Drive' },
  { id: 'reports', label: 'Reports' },
]

export type NotificationEvent = {
  id: string
  group: NotificationGroup
  title: string
  description: string
  channels: Record<NotificationChannel, boolean>
}

export type NotificationSettings = {
  events: NotificationEvent[]
  slack: { channel: string; workspace: string }
}

export const SLACK_CHANNELS = [
  { value: '#social-ops', description: 'Social team · 8 members' },
  { value: '#marketing', description: 'Marketing · 23 members' },
  { value: '#content-team', description: 'Content · 6 members' },
  { value: '#alerts', description: 'Ops alerts · 12 members' },
] as const

export type PlatformHealth = 'operational' | 'degraded'

export type PlatformIntegration = {
  platform: Platform
  api: string
  /** "2 accounts · 1 connecting" */
  summary: string
  permissions: string
  /** Accounts on this platform whose token needs reauthorization. */
  reauth: number
  health: PlatformHealth
  healthLabel: string
}

export type PublishingDefaults = { autoRetry: boolean; stagger: boolean; requireApproval: boolean }

export const PUBLISHING_DEFAULTS: { key: keyof PublishingDefaults; title: string; description: string }[] = [
  { key: 'autoRetry', title: 'Auto-retry failed targets', description: 'Retry twice with backoff before marking as Failed' },
  { key: 'stagger', title: 'Stagger multi-platform posts', description: 'Space targets 15 minutes apart by default' },
  { key: 'requireApproval', title: 'Require approval for Contributors', description: 'Drafts from Contributors need an Editor to schedule' },
]

export type IntegrationsData = {
  drive: { folder: string; access: string }
  platforms: PlatformIntegration[]
  defaults: PublishingDefaults
}

/* ── Mock database ─────────────────────────────────────────────────── */

let workspaceDb: WorkspaceSettings = {
  name: 'Northwind Studio',
  slug: 'northwind',
  logo: null,
  timeZone: 'America/New_York',
  weekStart: 'monday',
}

let teamDb: TeamMember[] = [
  { id: 'usr_maya', name: 'Maya Rahman', email: 'maya@northwind.studio', initials: 'MR', role: 'owner', access: 'all', lastActive: 'Now', you: true },
  { id: 'usr_lena', name: 'Lena Ortiz', email: 'lena@northwind.studio', initials: 'LO', role: 'editor', access: 4, lastActive: '2h ago' },
  { id: 'usr_sam', name: 'Sam Chen', email: 'sam@northwind.studio', initials: 'SC', role: 'admin', access: 'all', lastActive: 'Yesterday' },
  { id: 'usr_priya', name: 'Priya Nair', email: 'priya@freelance.co', initials: 'PN', role: 'contributor', access: 2, lastActive: 'Nov 17' },
  { id: 'usr_jonas', name: 'Jonas Weber', email: 'jonas@northwind.studio', initials: 'JW', role: 'viewer', access: 'all', lastActive: 'Nov 12' },
  { id: 'inv_alex', name: null, email: 'alex@agency.io', initials: 'AL', role: 'editor', access: 3, lastActive: 'Pending', invite: { by: 'Maya', on: 'Nov 20' } },
]

let profileDb: Profile = {
  fullName: 'Maya Rahman',
  email: 'maya@northwind.studio',
  photo: null,
  timeZone: 'workspace',
  dateFormat: 'mdy-12',
}

let notificationsDb: NotificationSettings = {
  events: [
    { id: 'publish_failed', group: 'publishing', title: 'A target fails to publish', description: 'Includes the error and a retry link', channels: { inApp: true, email: true, slack: true } },
    { id: 'post_published', group: 'publishing', title: 'A post is published', description: 'One summary per post, not per target', channels: { inApp: true, email: false, slack: false } },
    { id: 'post_upcoming', group: 'publishing', title: 'A scheduled post is about to go out', description: '15 minutes before', channels: { inApp: false, email: false, slack: false } },
    { id: 'account_reauth', group: 'accounts', title: 'An account needs reauthorization', description: 'Sent 3 days before tokens expire', channels: { inApp: true, email: true, slack: true } },
    { id: 'drive_issue', group: 'accounts', title: 'Google Drive is disconnected or a file goes missing', description: 'Scheduled posts using it are paused', channels: { inApp: true, email: true, slack: false } },
    { id: 'weekly_summary', group: 'reports', title: 'Weekly performance summary', description: 'Mondays at 9:00 AM', channels: { inApp: false, email: true, slack: false } },
    { id: 'team_activity', group: 'reports', title: 'Team activity', description: 'Invites, role changes, new connections', channels: { inApp: true, email: false, slack: false } },
  ],
  slack: { channel: '#social-ops', workspace: 'Northwind HQ' },
}

let integrationsDb: IntegrationsData = {
  drive: { folder: 'My Drive / Northwind / Content 2025', access: 'read-only access' },
  platforms: [
    { platform: 'tiktok', api: 'Content Posting API', summary: '2 accounts · 1 connecting', permissions: 'Upload videos, read basic profile & video stats', reauth: 0, health: 'operational', healthLabel: 'Operational' },
    { platform: 'instagram', api: 'Instagram Graph API (via Facebook Login)', summary: '3 accounts · 1 needs reauth', permissions: 'Publish Reels & posts, read insights', reauth: 1, health: 'operational', healthLabel: 'Operational' },
    { platform: 'facebook', api: 'Pages API', summary: '2 Pages · 1 needs reauth', permissions: 'Publish to Pages, read Page insights', reauth: 1, health: 'operational', healthLabel: 'Operational' },
    { platform: 'youtube', api: 'YouTube Data API v3', summary: '2 channels · 1 disconnected', permissions: 'Upload videos, manage thumbnails, read analytics', reauth: 0, health: 'degraded', healthLabel: 'Degraded — uploads slower than usual' },
  ],
  defaults: { autoRetry: true, stagger: false, requireApproval: true },
}

/* ── Queries ───────────────────────────────────────────────────────── */

const KEYS = {
  workspace: ['settings', 'workspace'],
  team: ['settings', 'team'],
  profile: ['settings', 'profile'],
  notifications: ['settings', 'notifications'],
  integrations: ['settings', 'integrations'],
} as const satisfies Record<string, QueryKey>

export const workspaceSettingsQueryOptions = queryOptions({ queryKey: KEYS.workspace, queryFn: () => mockRequest(() => workspaceDb) })
export const teamQueryOptions = queryOptions({ queryKey: KEYS.team, queryFn: () => mockRequest(() => teamDb) })
export const profileQueryOptions = queryOptions({ queryKey: KEYS.profile, queryFn: () => mockRequest(() => profileDb) })
export const notificationsQueryOptions = queryOptions({ queryKey: KEYS.notifications, queryFn: () => mockRequest(() => notificationsDb) })
export const integrationsQueryOptions = queryOptions({ queryKey: KEYS.integrations, queryFn: () => mockRequest(() => integrationsDb) })

/* ── Mutations ─────────────────────────────────────────────────────── */

const SAVE_FAILED = { description: 'Your change wasn’t saved. Please try again.', duration: Infinity }

/**
 * Optimistic mutation over one settings query: `update` is applied to the
 * cache immediately, rolled back on error, and re-synced when settled.
 */
function useOptimisticMutation<TData, TVars>({
  queryKey,
  request,
  update,
  onSuccess,
  delay = 500,
}: {
  queryKey: QueryKey
  request: (vars: TVars) => void
  update: (old: TData, vars: TVars) => TData
  onSuccess?: (vars: TVars) => void
  delay?: number
}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: TVars) => mockRequest(() => request(vars), { delay }),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<TData>(queryKey)
      if (previous !== undefined) queryClient.setQueryData<TData>(queryKey, update(previous, vars))
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) queryClient.setQueryData(queryKey, ctx.previous)
      toast.error('Something went wrong', SAVE_FAILED)
    },
    onSuccess: (_data, vars) => onSuccess?.(vars),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })
}

/** Keeps the sidebar / breadcrumb (session) in sync with settings changes. */
function usePatchSession() {
  const queryClient = useQueryClient()
  return (patch: (s: Session) => Session) => queryClient.setQueryData<Session>(sessionQueryOptions.queryKey, (old) => (old ? patch(old) : old))
}

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

export function useUpdateWorkspace() {
  const patchSession = usePatchSession()
  return useOptimisticMutation<WorkspaceSettings, WorkspaceSettings>({
    queryKey: KEYS.workspace,
    request: (values) => {
      workspaceDb = values
    },
    update: (_old, values) => values,
    onSuccess: (values) => {
      patchSession((s) => ({ ...s, workspace: { ...s.workspace, name: values.name, initial: values.name.trim()[0]?.toUpperCase() ?? s.workspace.initial } }))
      toast.success('Workspace settings saved', { description: 'Teammates see the changes right away.' })
    },
  })
}

export function useUpdateProfile() {
  const patchSession = usePatchSession()
  return useOptimisticMutation<Profile, Profile>({
    queryKey: KEYS.profile,
    request: (values) => {
      profileDb = values
    },
    update: (_old, values) => values,
    onSuccess: (values) => {
      const name = values.fullName.trim()
      patchSession((s) => ({ ...s, user: { ...s.user, name, firstName: name.split(/\s+/)[0] ?? name, initials: initialsOf(name) } }))
      toast.success('Profile saved', { description: 'Your details are up to date.' })
    },
  })
}

export function useInviteMember() {
  const invitedBy = useSession().user.firstName
  const toMember = ({ email, role }: { email: string; role: AssignableRole }): TeamMember => ({
    id: `inv_${email}`,
    name: null,
    email,
    initials: email.slice(0, 2).toUpperCase(),
    role,
    access: 'all',
    lastActive: 'Pending',
    invite: { by: invitedBy, on: 'Today' },
  })
  return useOptimisticMutation<TeamMember[], { email: string; role: AssignableRole }>({
    queryKey: KEYS.team,
    request: (vars) => {
      teamDb = [...teamDb, toMember(vars)]
    },
    update: (old, vars) => [...old, toMember(vars)],
    onSuccess: ({ email }) => toast.success('Invite sent', { description: `${email} will get an email to join the workspace.` }),
  })
}

export function useChangeRole() {
  return useOptimisticMutation<TeamMember[], { member: TeamMember; role: AssignableRole }>({
    queryKey: KEYS.team,
    request: ({ member, role }) => {
      teamDb = teamDb.map((m) => (m.id === member.id ? { ...m, role } : m))
    },
    update: (old, { member, role }) => old.map((m) => (m.id === member.id ? { ...m, role } : m)),
    onSuccess: ({ member, role }) => toast.success('Role updated', { description: `${member.name ?? member.email} is now ${role === 'admin' ? 'an' : 'a'} ${ROLE_LABEL[role]}.` }),
    delay: 400,
  })
}

export function useRemoveMember() {
  const patchSession = usePatchSession()
  return useOptimisticMutation<TeamMember[], TeamMember>({
    queryKey: KEYS.team,
    request: (member) => {
      teamDb = teamDb.filter((m) => m.id !== member.id)
    },
    update: (old, member) => old.filter((m) => m.id !== member.id),
    onSuccess: (member) => {
      if (member.invite) {
        toast.success('Invite revoked', { description: `${member.email} can no longer join with that link.` })
        return
      }
      patchSession((s) => ({ ...s, workspace: { ...s.workspace, members: Math.max(1, s.workspace.members - 1) } }))
      toast.success('Member removed', { description: `${member.name} no longer has access to the workspace.` })
    },
  })
}

export function useResendInvite() {
  return useMutation({
    mutationFn: (member: TeamMember) => mockRequest(member, { delay: 500 }),
    onSuccess: (member) => toast.success('Invite resent', { description: `We emailed ${member.email} a fresh link.` }),
    onError: () => toast.error('Couldn’t resend the invite', SAVE_FAILED),
  })
}

const setChannel = (s: NotificationSettings, id: string, channel: NotificationChannel, on: boolean): NotificationSettings => ({
  ...s,
  events: s.events.map((e) => (e.id === id ? { ...e, channels: { ...e.channels, [channel]: on } } : e)),
})

export function useToggleNotification() {
  return useOptimisticMutation<NotificationSettings, { event: NotificationEvent; channel: NotificationChannel; on: boolean }>({
    queryKey: KEYS.notifications,
    request: ({ event, channel, on }) => {
      notificationsDb = setChannel(notificationsDb, event.id, channel, on)
    },
    update: (old, { event, channel, on }) => setChannel(old, event.id, channel, on),
    onSuccess: ({ event, channel, on }) => {
      const label = NOTIFICATION_CHANNELS.find((c) => c.id === channel)?.label ?? channel
      // One toast id, so flipping several switches updates a single toast instead of stacking.
      toast.success('Notification preferences saved', { id: 'notification-prefs', description: `${label} ${on ? 'on' : 'off'} · ${event.title}` })
    },
    delay: 300,
  })
}

export function useSetSlackChannel() {
  return useOptimisticMutation<NotificationSettings, string>({
    queryKey: KEYS.notifications,
    request: (channel) => {
      notificationsDb = { ...notificationsDb, slack: { ...notificationsDb.slack, channel } }
    },
    update: (old, channel) => ({ ...old, slack: { ...old.slack, channel } }),
    onSuccess: (channel) => toast.success('Slack channel updated', { description: `Notifications now post to ${channel}.` }),
  })
}

export function useUpdatePublishingDefault() {
  return useOptimisticMutation<IntegrationsData, { key: keyof PublishingDefaults; on: boolean }>({
    queryKey: KEYS.integrations,
    request: ({ key, on }) => {
      integrationsDb = { ...integrationsDb, defaults: { ...integrationsDb.defaults, [key]: on } }
    },
    update: (old, { key, on }) => ({ ...old, defaults: { ...old.defaults, [key]: on } }),
    onSuccess: ({ key, on }) => {
      const title = PUBLISHING_DEFAULTS.find((d) => d.key === key)?.title ?? key
      toast.success('Publishing defaults saved', { id: 'publishing-defaults', description: `${title} ${on ? 'on' : 'off'} for new posts.` })
    },
    delay: 300,
  })
}
