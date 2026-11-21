import type { LinkProps } from '@tanstack/react-router'
import bottomActivity from '@/assets/figma/bottom-nav/activity.svg'
import bottomActivityActive from '@/assets/figma/bottom-nav/activity-active.svg'
import bottomCalendar from '@/assets/figma/bottom-nav/calendar.svg'
import bottomCalendarActive from '@/assets/figma/bottom-nav/calendar-active.svg'
import bottomHome from '@/assets/figma/bottom-nav/home.svg'
import bottomHomeActive from '@/assets/figma/bottom-nav/home-active.svg'
import bottomLibrary from '@/assets/figma/bottom-nav/library.svg'
import bottomLibraryActive from '@/assets/figma/bottom-nav/library-active.svg'
import navAccounts from '@/assets/figma/nav/accounts.svg'
import navAccountsActive from '@/assets/figma/nav/accounts-active.svg'
import navAnalytics from '@/assets/figma/nav/analytics.svg'
import navAnalyticsActive from '@/assets/figma/nav/analytics-active.svg'
import navCalendar from '@/assets/figma/nav/calendar.svg'
import navCalendarActive from '@/assets/figma/nav/calendar-active.svg'
import navLibrary from '@/assets/figma/nav/library.svg'
import navLibraryActive from '@/assets/figma/nav/library-active.svg'
import navMonitoring from '@/assets/figma/nav/monitoring.svg'
import navMonitoringActive from '@/assets/figma/nav/monitoring-active.svg'
import navOverview from '@/assets/figma/nav/overview.svg'
import navOverviewActive from '@/assets/figma/nav/overview-active.svg'
import navSettings from '@/assets/figma/nav/settings.svg'
import navSettingsActive from '@/assets/figma/nav/settings-active.svg'
import railAccounts from '@/assets/figma/rail/accounts.svg'
import railAnalytics from '@/assets/figma/rail/analytics.svg'
import railCalendar from '@/assets/figma/rail/calendar.svg'
import railLibrary from '@/assets/figma/rail/library.svg'
import railMonitoring from '@/assets/figma/rail/monitoring.svg'
import railOverviewActive from '@/assets/figma/rail/overview-active.svg'
import railSettings from '@/assets/figma/rail/settings.svg'

export type NavItem = {
  to: LinkProps['to']
  label: string
  /** Match the path exactly (Overview) instead of as a prefix. */
  exact?: boolean
  /** Desktop sidebar icons (16px). */
  icon: string
  activeIcon: string
  /** Tablet rail icons (18px). The design only specifies the Overview active state; others reuse the sidebar active glyph. */
  railIcon: string
  railActiveIcon: string
  showFailedCount?: boolean
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Overview', exact: true, icon: navOverview, activeIcon: navOverviewActive, railIcon: navOverview, railActiveIcon: railOverviewActive },
  { to: '/library', label: 'Content Library', icon: navLibrary, activeIcon: navLibraryActive, railIcon: railLibrary, railActiveIcon: navLibraryActive },
  { to: '/calendar', label: 'Publishing Calendar', icon: navCalendar, activeIcon: navCalendarActive, railIcon: railCalendar, railActiveIcon: navCalendarActive },
  { to: '/accounts', label: 'Social Accounts', icon: navAccounts, activeIcon: navAccountsActive, railIcon: railAccounts, railActiveIcon: navAccountsActive },
  { to: '/monitoring', label: 'Post Monitoring', icon: navMonitoring, activeIcon: navMonitoringActive, railIcon: railMonitoring, railActiveIcon: navMonitoringActive, showFailedCount: true },
  { to: '/analytics', label: 'Analytics', icon: navAnalytics, activeIcon: navAnalyticsActive, railIcon: railAnalytics, railActiveIcon: navAnalyticsActive },
  { to: '/settings', label: 'Settings', icon: navSettings, activeIcon: navSettingsActive, railIcon: railSettings, railActiveIcon: navSettingsActive },
]

export type BottomNavItem = { to: LinkProps['to']; label: string; exact?: boolean; icon: string; activeIcon: string }

/** Mobile bottom bar; the centre "+" (Create post) is rendered separately. */
export const BOTTOM_NAV_ITEMS: readonly BottomNavItem[] = [
  { to: '/', label: 'Home', exact: true, icon: bottomHome, activeIcon: bottomHomeActive },
  { to: '/library', label: 'Library', icon: bottomLibrary, activeIcon: bottomLibraryActive },
  { to: '/calendar', label: 'Calendar', icon: bottomCalendar, activeIcon: bottomCalendarActive },
  { to: '/monitoring', label: 'Activity', icon: bottomActivity, activeIcon: bottomActivityActive },
]
