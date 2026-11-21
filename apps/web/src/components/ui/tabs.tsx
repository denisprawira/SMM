import { createLink, type LinkComponent } from '@tanstack/react-router'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { cn } from '@/lib/cn'

/** Row that holds Tabs; the 1px rule sits under the 2px indicators. */
export function TabList({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div role="tablist" className={cn('flex items-end gap-5 border-b', className)}>
      {children}
    </div>
  )
}

function TabInner({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <>
      <span className={cn('flex items-center gap-1.5 px-0.5 py-2.5 text-body font-medium whitespace-nowrap', active ? 'text-primary' : 'text-secondary group-hover:text-primary')}>
        {children}
      </span>
      <span className={cn('h-0.5 w-full', active ? 'bg-inverse' : 'bg-transparent')} />
    </>
  )
}

type TabProps = ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }

/** Figma "Tab" (state-driven). */
export function Tab({ active, className, children, type = 'button', ...props }: TabProps) {
  return (
    <button type={type} role="tab" aria-selected={active} className={cn('group -mb-px flex flex-col items-center outline-none', className)} {...props}>
      <TabInner active={active}>{children}</TabInner>
    </button>
  )
}

type TabAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & { ref?: Ref<HTMLAnchorElement>; 'data-status'?: string }

function TabAnchor({ className, children, ...props }: TabAnchorProps) {
  const active = props['data-status'] === 'active'
  return (
    <a role="tab" aria-selected={active} className={cn('group -mb-px flex flex-col items-center outline-none', className)} {...props}>
      <TabInner active={active}>{children}</TabInner>
    </a>
  )
}

const CreatedTabLink = createLink(TabAnchor)

/** Figma "Tab" bound to a route — active when the route matches. */
export const TabLink: LinkComponent<typeof TabAnchor> = (props) => <CreatedTabLink preload="intent" {...props} />
