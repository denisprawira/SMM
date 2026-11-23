import type { ReactNode } from 'react'
import { Topbar } from '@/components/layout/topbar'
import { PageContent, PageHeader } from '@/components/page'
import { SETTINGS_SECTION_LABEL, type SettingsSection } from './nav-items'
import { SettingsNav } from './settings-nav'

/**
 * Shared Settings chrome (Figma frames 14–16): breadcrumb, "Settings" page
 * header, and the Settings nav beside the content. Rendered by each settings
 * page — deliberately not a layout route, so full-width pages under
 * /settings (e.g. Google Drive) don't inherit the nav.
 */
export function SettingsLayout({ active, children }: { active: SettingsSection; children: ReactNode }) {
  return (
    <>
      <Topbar breadcrumb={[{ label: 'Settings', to: '/settings' }, { label: SETTINGS_SECTION_LABEL[active] }]} mobileTitle="Settings" />
      <PageContent className="xl:gap-5">
        <PageHeader title="Settings" description="Manage your profile, workspace, team and integrations." />
        <SettingsNav variant="scroller" active={active} className="xl:hidden" />
        <div className="flex items-start gap-8">
          <SettingsNav variant="column" active={active} className="hidden xl:flex" />
          <div className="flex min-w-0 flex-1 flex-col gap-4 md:gap-5">{children}</div>
        </div>
      </PageContent>
    </>
  )
}
