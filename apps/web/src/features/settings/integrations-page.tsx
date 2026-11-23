import { DriveCard, PlatformsCard, PublishingDefaultsCard } from './components/integrations-cards'
import { SettingsLayout } from './components/settings-layout'

/** Figma 16 "Settings · Social integrations" — `/settings/integrations` (Social platforms). */
export function IntegrationsSettingsPage() {
  return (
    <SettingsLayout active="platforms">
      <DriveCard />
      <PlatformsCard />
      <PublishingDefaultsCard />
    </SettingsLayout>
  )
}
