import { useLocation } from '@tanstack/react-router'
import { NotificationsCard } from './components/notifications-card'
import { ProfileCard } from './components/profile-card'
import { SettingsLayout } from './components/settings-layout'

/** Figma 15 "Settings · Profile & Notifications" — `/settings/profile` (Profile) and `/settings/profile#notifications`. */
export function ProfileSettingsPage() {
  const hash = useLocation({ select: (l) => l.hash })
  return (
    <SettingsLayout active={hash === 'notifications' ? 'notifications' : 'profile'}>
      <ProfileCard />
      <NotificationsCard />
    </SettingsLayout>
  )
}
