import { useLocation } from '@tanstack/react-router'
import { SettingsLayout } from './components/settings-layout'
import { TeamMembersCard } from './components/team-members-card'
import { WorkspaceCard } from './components/workspace-card'

/** Figma 14 "Settings · Workspace & Team" — `/settings` (General) and `/settings#team` (Team members). */
export function WorkspaceSettingsPage() {
  const hash = useLocation({ select: (l) => l.hash })
  return (
    <SettingsLayout active={hash === 'team' ? 'team' : 'general'}>
      <WorkspaceCard />
      <TeamMembersCard />
    </SettingsLayout>
  )
}
