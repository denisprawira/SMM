import type { LinkProps } from '@tanstack/react-router'
import { Bell, Briefcase, Globe, HardDrive, User, Users, Zap, type LucideIcon } from 'lucide-react'

export type SettingsSection = 'profile' | 'notifications' | 'general' | 'team' | 'billing' | 'drive' | 'platforms'

export type SettingsNavItem = {
  id: SettingsSection
  label: string
  icon: LucideIcon
  to: LinkProps['to']
  /** Section anchor on a page that holds several sections (Profile & Notifications, Workspace & Team). */
  hash?: string
}

/** Figma "Settings nav" (28:4391) — three groups, Icon/<name> → lucide. */
export const SETTINGS_NAV: { label: string; items: SettingsNavItem[] }[] = [
  {
    label: 'Account',
    items: [
      { id: 'profile', label: 'Profile', icon: User, to: '/settings/profile' },
      { id: 'notifications', label: 'Notifications', icon: Bell, to: '/settings/profile', hash: 'notifications' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { id: 'general', label: 'General', icon: Briefcase, to: '/settings' },
      { id: 'team', label: 'Team members', icon: Users, to: '/settings', hash: 'team' },
      { id: 'billing', label: 'Billing', icon: Zap, to: '/settings/billing' },
    ],
  },
  {
    label: 'Integrations',
    items: [
      { id: 'drive', label: 'Google Drive', icon: HardDrive, to: '/settings/integrations/drive' },
      { id: 'platforms', label: 'Social platforms', icon: Globe, to: '/settings/integrations' },
    ],
  },
]

export const SETTINGS_SECTION_LABEL = Object.fromEntries(SETTINGS_NAV.flatMap((g) => g.items.map((i) => [i.id, i.label]))) as Record<SettingsSection, string>
