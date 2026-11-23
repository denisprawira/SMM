import { useState } from 'react'

/** aria wiring for a control inside `FieldShell` (helper/error message id). */
export const fieldA11y = (id: string, error?: string, hasMessage = true) => ({
  id,
  'aria-invalid': error ? true : undefined,
  'aria-describedby': hasMessage ? `${id}-message` : undefined,
})

/* ── Form state ────────────────────────────────────────────────────── */

type Errors<T> = Partial<Record<keyof T, string>>

/**
 * Local form state over server data: dirty tracking against the saved value,
 * errors shown per field after blur or after the first submit attempt.
 */
export function useSettingsForm<T extends Record<string, unknown>>(saved: T, validate: (values: T) => Errors<T>) {
  const [values, setValues] = useState<T>(saved)
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)

  const allErrors = validate(values)
  const errors: Errors<T> = {}
  for (const key of Object.keys(allErrors) as (keyof T)[]) {
    if (submitted || touched[key]) errors[key] = allErrors[key]
  }

  return {
    values,
    errors,
    dirty: JSON.stringify(values) !== JSON.stringify(saved),
    set: <K extends keyof T>(key: K, value: T[K]) => setValues((v) => ({ ...v, [key]: value })),
    touch: (key: keyof T) => setTouched((t) => ({ ...t, [key]: true })),
    reset: () => {
      setValues(saved)
      setTouched({})
      setSubmitted(false)
    },
    /** Marks the form submitted; returns the values when valid, else focuses the first invalid field. */
    submit: (idPrefix: string): T | null => {
      setSubmitted(true)
      const first = Object.keys(allErrors)[0]
      if (first) {
        document.getElementById(`${idPrefix}-${first}`)?.focus()
        return null
      }
      return values
    },
    settle: () => {
      setTouched({})
      setSubmitted(false)
    },
  }
}
