import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  helper?: string
  error?: string
}

/** Figma "Text Field" — label, 36px field, helper or error text. */
export function TextField({ label, helper, error, className, id, ...props }: TextFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const hint = error ?? helper
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="text-body-sm font-medium text-primary">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint ? `${inputId}-hint` : undefined}
        className={cn(
          'h-9 w-full rounded-lg border bg-surface px-3 text-body text-primary shadow-xs outline-none placeholder:text-tertiary focus:border-accent focus:shadow-focus',
          error && 'border-danger',
        )}
        {...props}
      />
      {hint && (
        <p id={`${inputId}-hint`} className={cn('text-caption', error ? 'text-danger-text' : 'text-tertiary')}>
          {hint}
        </p>
      )}
    </div>
  )
}
