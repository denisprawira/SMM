import type { ComponentProps, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { fieldA11y } from './form-state'

/* ── Card chrome ───────────────────────────────────────────────────── */

/** Settings "Card header": H3 + tertiary subtitle, divider below (Figma px-20 py-16, border-b). */
export function SettingsCardHeader({
  title,
  description,
  action,
  stackActionOnMobile,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  /** Below 768px, put the action under a long description instead of squeezing it. */
  stackActionOnMobile?: boolean
}) {
  return (
    <CardHeader className={cn('border-b', stackActionOnMobile && 'max-md:grid-cols-1!')}>
      <CardTitle>{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
      {action && (
        <CardAction className={cn(stackActionOnMobile && 'max-md:col-start-1 max-md:row-span-1 max-md:row-start-3 max-md:mt-2.5 max-md:justify-self-start')}>{action}</CardAction>
      )}
    </CardHeader>
  )
}

/** Canvas-tinted footer bar (Figma bg/canvas, border-t, px-20 py-12). */
export function SettingsCardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('flex items-center gap-2 border-t bg-canvas px-5 py-3', className)}>{children}</div>
}

/** Cancel + Save changes. Save is enabled only when the form is dirty. */
export function FormActions({ dirty, pending, onCancel }: { dirty: boolean; pending: boolean; onCancel: () => void }) {
  return (
    <SettingsCardFooter className="justify-end">
      <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
        Cancel
      </Button>
      <Button type="submit" size="sm" disabled={!dirty || pending}>
        {pending && <Spinner />}
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </SettingsCardFooter>
  )
}

/* ── Fields (Figma "Text Field" 7:140; error state = States 30:881) ── */

type FieldShellProps = {
  id: string
  label: ReactNode
  /** Tertiary helper under the control. Pass " " to reserve the line (Figma does). */
  helper?: ReactNode
  /** Replaces the helper; turns the control border danger. */
  error?: string
  className?: string
  children: ReactNode
}

export function FieldShell({ id, label, helper, error, className, children }: FieldShellProps) {
  const message = error ?? helper
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="text-body-sm text-foreground">
        {label}
      </Label>
      {children}
      {message !== undefined && (
        <p id={`${id}-message`} role={error ? 'alert' : undefined} className={cn(
            'min-h-4 text-caption',
            error ? 'text-danger-text' : 'text-tertiary',
            // A blank helper only keeps side-by-side fields aligned; drop it when fields stack.
            !error && typeof message === 'string' && !message.trim() && 'max-md:hidden',
          )}>
          {message}
        </p>
      )}
    </div>
  )
}

type TextFieldProps = Omit<FieldShellProps, 'children'> &
  Omit<ComponentProps<typeof Input>, 'id' | 'className' | 'children'> & { inputClassName?: string }

export function TextField({ id, label, helper, error, className, inputClassName, ...input }: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} helper={helper} error={error} className={className}>
      <Input {...input} {...fieldA11y(id, error, (error ?? helper) !== undefined)} className={inputClassName} />
    </FieldShell>
  )
}

type Option<V extends string> = { value: V; label: string }

/** Labelled Select; the trigger hugs its text with the chevron right after it (Figma Select 7:128). */
export function SelectField<V extends string>({
  id,
  label,
  value,
  options,
  onValueChange,
  className,
}: {
  id: string
  label: ReactNode
  value: V
  options: readonly Option<V>[]
  onValueChange: (value: V) => void
  className?: string
}) {
  return (
    <FieldShell id={id} label={label} className={className}>
      <Select value={value} onValueChange={(v) => onValueChange(v as V)}>
        <SelectTrigger id={id} className="w-full justify-start">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  )
}

/** Title + description with a Switch on the right (Publishing defaults rows). */
export function SwitchRow({ id, title, description, checked, onCheckedChange }: { id: string; title: string; description: string; checked: boolean; onCheckedChange: (on: boolean) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-px">
        <label htmlFor={id} className="text-body-sm font-medium text-foreground">
          {title}
        </label>
        <p id={`${id}-description`} className="text-caption text-tertiary">
          {description}
        </p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} aria-describedby={`${id}-description`} />
    </div>
  )
}
