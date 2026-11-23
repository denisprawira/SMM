import type { LinkProps } from '@tanstack/react-router'
import { Activity, Calendar, ChartColumn, Folder, LayoutDashboard, Settings, Users, type LucideIcon } from 'lucide-react'

export type NavItem = {
  to: LinkProps['to']
  label: string
  /** Match the path exactly (Overview) instead of as a prefix. */
  exact?: boolean
  icon: LucideIcon
  showFailedCount?: boolean
}

/** Figma "App Sidebar" nav (Icon/layout-dashboard, folder, calendar, users, activity, bar-chart, settings). */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Overview', exact: true, icon: LayoutDashboard },
  { to: '/library', label: 'Content Library', icon: Folder },
  { to: '/calendar', label: 'Publishing Calendar', icon: Calendar },
  { to: '/accounts', label: 'Social Accounts', icon: Users },
  { to: '/monitoring', label: 'Post Monitoring', icon: Activity, showFailedCount: true },
  { to: '/analytics', label: 'Analytics', icon: ChartColumn },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export type BottomNavItem = { to: LinkProps['to']; label: string; exact?: boolean; icon: LucideIcon }

/** Mobile bottom bar; the centre "+" (Create post) is rendered separately. */
export const BOTTOM_NAV_ITEMS: readonly BottomNavItem[] = [
  { to: '/', label: 'Home', exact: true, icon: LayoutDashboard },
  { to: '/library', label: 'Library', icon: Folder },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/monitoring', label: 'Activity', icon: Activity },
]
