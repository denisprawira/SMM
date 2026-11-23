import { Link } from '@tanstack/react-router'
import type { ComponentProps } from 'react'
import type { Platform } from '@/lib/types'

/**
 * Opens the Connect modal (`/accounts/connect`) over the page, keeping the
 * current platform tab and scroll position. Use with `<Button asChild>`.
 */
export function ConnectLink({ platform, ...props }: Omit<ComponentProps<'a'>, 'href' | 'ref'> & { platform?: Platform }) {
  return <Link {...props} from="/accounts" to="/accounts/connect" search={(prev) => ({ tab: prev.tab, platform })} resetScroll={false} />
}
