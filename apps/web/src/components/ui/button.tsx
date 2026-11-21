import { createLink, type LinkComponent } from '@tanstack/react-router'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './icon'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
export type ButtonSize = 'md' | 'sm'

type ButtonStyleProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

/** Figma "Button" — Primary for the main action per view, Secondary for neutral, Ghost for toolbar, Destructive for disconnect/delete. */
export function buttonClasses({ variant = 'primary', size = 'md', className }: ButtonStyleProps = {}) {
  return cn(
    'inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium transition-colors outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-50',
    size === 'md' ? 'h-9 gap-2 rounded-lg px-3.5 text-body' : 'h-[30px] gap-1.5 rounded-md px-2.5 text-body-sm',
    {
      primary: 'bg-accent text-inverse hover:bg-accent-hover',
      secondary: 'border bg-surface text-primary shadow-xs hover:bg-subtle',
      ghost: 'text-secondary hover:bg-subtle hover:text-primary',
      destructive: 'bg-danger text-inverse hover:bg-danger-text',
    }[variant],
    className,
  )
}

/** Icon slot: pass an imported SVG URL, or any node. */
type IconSlot = string | ReactNode

function renderIcon(icon: IconSlot) {
  if (!icon) return null
  return typeof icon === 'string' ? <Icon src={icon} size={16} /> : icon
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonStyleProps & {
    icon?: IconSlot
    trailingIcon?: IconSlot
    ref?: Ref<HTMLButtonElement>
  }

export function Button({ variant, size, className, icon, trailingIcon, children, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses({ variant, size, className })} {...props}>
      {renderIcon(icon)}
      {children}
      {renderIcon(trailingIcon)}
    </button>
  )
}

type ButtonAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  ButtonStyleProps & {
    icon?: IconSlot
    trailingIcon?: IconSlot
    ref?: Ref<HTMLAnchorElement>
  }

function ButtonAnchor({ variant, size, className, icon, trailingIcon, children, ...props }: ButtonAnchorProps) {
  return (
    <a className={buttonClasses({ variant, size, className })} {...props}>
      {renderIcon(icon)}
      {children}
      {renderIcon(trailingIcon)}
    </a>
  )
}

const CreatedButtonLink = createLink(ButtonAnchor)

/** A router `<Link>` styled as a Button (type-safe `to`, params, search). */
export const ButtonLink: LinkComponent<typeof ButtonAnchor> = (props) => (
  <CreatedButtonLink preload="intent" {...props} />
)

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: string
  label: string
  iconSize?: number
  /** `outline` = bordered 32px (desktop topbar); `plain` = borderless. */
  appearance?: 'outline' | 'plain'
}

export function IconButton({ icon, label, iconSize = 16, appearance = 'outline', className, type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg transition-colors outline-none focus-visible:shadow-focus',
        appearance === 'outline' ? 'size-8 border bg-surface hover:bg-subtle' : 'size-9 hover:bg-subtle',
        className,
      )}
      {...props}
    >
      <Icon src={icon} size={iconSize} />
    </button>
  )
}
