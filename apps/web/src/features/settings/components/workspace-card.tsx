import { useSuspenseQuery } from '@tanstack/react-query'
import { Folder } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Thumbnail } from '@/components/thumbnail'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { cn } from '@/lib/utils'
import { TIME_ZONES, WEEK_STARTS, useUpdateWorkspace, workspaceSettingsQueryOptions, type WorkspaceSettings } from '../api'
import { DriveImagePicker } from './drive-image-picker'
import { FieldShell, FormActions, SelectField, SettingsCardHeader, TextField } from './form'
import { fieldA11y, useSettingsForm } from './form-state'

const ID = 'workspace'

function validate(v: WorkspaceSettings) {
  const errors: Partial<Record<keyof WorkspaceSettings, string>> = {}
  const name = v.name.trim()
  if (!name) errors.name = 'Workspace name is required.'
  else if (name.length > 48) errors.name = 'Keep the name under 48 characters.'

  if (!v.slug) errors.slug = 'Workspace URL is required.'
  else if (!/^[a-z0-9-]+$/.test(v.slug)) errors.slug = 'Use only lowercase letters, numbers and dashes.'
  else if (v.slug.length < 3) errors.slug = 'Use at least 3 characters.'
  else if (v.slug.startsWith('-') || v.slug.endsWith('-')) errors.slug = 'The URL can’t start or end with a dash.'
  return errors
}

/** Figma "Workspace" card (28:4432): logo, name, URL, time zone, week start. */
export function WorkspaceCard({ className }: { className?: string }) {
  const { data } = useSuspenseQuery(workspaceSettingsQueryOptions)
  const form = useSettingsForm(data, validate)
  const update = useUpdateWorkspace()
  const [pickerOpen, setPickerOpen] = useState(false)
  const { values, errors } = form

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const valid = form.submit(ID)
    if (valid) update.mutate({ ...valid, name: valid.name.trim() }, { onSuccess: form.settle })
  }

  const removeLogo = () => {
    if (values.logo) form.set('logo', null)
    else toast.info('Using the workspace initial', { description: 'Choose an image from Drive to use a custom logo.' })
  }

  return (
    <form id="general" noValidate onSubmit={onSubmit} className={cn('scroll-mt-20 xl:scroll-mt-6', className)}>
      <Card>
        <SettingsCardHeader title="Workspace" description="Shown to teammates and on notifications." />
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-3.5">
            {values.logo ? (
              <Thumbnail tone={values.logo.tone} ratio={1} className="size-14 rounded-xl" />
            ) : (
              <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-inverse text-h2 text-primary-foreground">
                {values.name.trim()[0]?.toUpperCase() ?? data.name[0]}
              </span>
            )}
            <div className="flex min-w-0 flex-col gap-1.5">
              <p className="text-body-sm font-medium text-foreground">Workspace logo</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                  <Folder />
                  Choose from Drive
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={removeLogo}>
                  Remove
                </Button>
              </div>
              {values.logo && <p className="truncate text-caption text-tertiary">{values.logo.name}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              id={`${ID}-name`}
              label="Workspace name"
              helper="Shown to teammates and in notifications."
              error={errors.name}
              value={values.name}
              autoComplete="organization"
              onChange={(e) => form.set('name', e.target.value)}
              onBlur={() => form.touch('name')}
            />
            <FieldShell id={`${ID}-slug`} label="Workspace URL" helper="Lowercase letters, numbers and dashes." error={errors.slug}>
              <InputGroup className="rounded-lg bg-background">
                <InputGroupAddon className="pr-0 text-body font-normal text-foreground">relay.app/</InputGroupAddon>
                <InputGroupInput
                  {...fieldA11y(`${ID}-slug`, errors.slug)}
                  value={values.slug}
                  spellCheck={false}
                  autoCapitalize="none"
                  onChange={(e) => form.set('slug', e.target.value)}
                  onBlur={() => form.touch('slug')}
                  className="!pl-0"
                />
              </InputGroup>
            </FieldShell>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SelectField id={`${ID}-timeZone`} label="Default time zone" value={values.timeZone} options={TIME_ZONES} onValueChange={(v) => form.set('timeZone', v)} />
            <SelectField id={`${ID}-weekStart`} label="Week starts on" value={values.weekStart} options={WEEK_STARTS} onValueChange={(v) => form.set('weekStart', v)} />
          </div>
        </div>
        <FormActions dirty={form.dirty} pending={update.isPending} onCancel={form.reset} />
      </Card>

      <DriveImagePicker open={pickerOpen} onOpenChange={setPickerOpen} title="Choose a workspace logo" value={values.logo} onSelect={(img) => form.set('logo', img)} />
    </form>
  )
}
