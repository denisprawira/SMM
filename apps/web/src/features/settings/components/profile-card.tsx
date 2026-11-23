import { useSuspenseQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Thumbnail } from '@/components/thumbnail'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { DATE_FORMATS, TIME_ZONES, profileQueryOptions, useUpdateProfile, workspaceSettingsQueryOptions, type Profile } from '../api'
import { DriveImagePicker } from './drive-image-picker'
import { FormActions, SelectField, SettingsCardHeader, TextField } from './form'
import { useSettingsForm } from './form-state'

const ID = 'profile'

function validate(v: Profile) {
  const errors: Partial<Record<keyof Profile, string>> = {}
  const name = v.fullName.trim()
  if (!name) errors.fullName = 'Full name is required.'
  else if (name.length > 60) errors.fullName = 'Keep your name under 60 characters.'
  return errors
}

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

/** Figma "Profile" card (28:4822): photo, name, Google email, time zone, date format. */
export function ProfileCard({ className }: { className?: string }) {
  const { data } = useSuspenseQuery(profileQueryOptions)
  const { data: workspace } = useSuspenseQuery(workspaceSettingsQueryOptions)
  const form = useSettingsForm(data, validate)
  const update = useUpdateProfile()
  const [pickerOpen, setPickerOpen] = useState(false)
  const { values, errors } = form

  const workspaceZone = TIME_ZONES.find((z) => z.value === workspace.timeZone)?.short ?? 'EST'
  const timeZones = [{ value: 'workspace' as const, label: `Use workspace default (${workspaceZone})` }, ...TIME_ZONES]

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const valid = form.submit(ID)
    if (valid) update.mutate({ ...valid, fullName: valid.fullName.trim() }, { onSuccess: form.settle })
  }

  return (
    <form id="profile" noValidate onSubmit={onSubmit} className={cn('scroll-mt-20 xl:scroll-mt-6', className)}>
      <Card>
        <SettingsCardHeader title="Profile" description="Your personal details." />
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start">
          <div className="flex shrink-0 items-center gap-3 md:flex-col md:gap-2">
            {values.photo ? (
              <Thumbnail tone={values.photo.tone} ratio={1} className="size-16 rounded-full" />
            ) : (
              <Avatar className="size-16">
                <AvatarFallback className="text-body">{initialsOf(values.fullName) || initialsOf(data.fullName)}</AvatarFallback>
              </Avatar>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={() => setPickerOpen(true)}>
              Change
            </Button>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3.5">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                id={`${ID}-fullName`}
                label="Full name"
                helper=" "
                error={errors.fullName}
                value={values.fullName}
                autoComplete="name"
                onChange={(e) => form.set('fullName', e.target.value)}
                onBlur={() => form.touch('fullName')}
              />
              <TextField id={`${ID}-email`} label="Email" helper="Signed in with Google" value={values.email} readOnly type="email" autoComplete="email" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField id={`${ID}-timeZone`} label="Your time zone" value={values.timeZone} options={timeZones} onValueChange={(v) => form.set('timeZone', v)} />
              <SelectField id={`${ID}-dateFormat`} label="Date format" value={values.dateFormat} options={DATE_FORMATS} onValueChange={(v) => form.set('dateFormat', v)} />
            </div>
          </div>
        </div>
        <FormActions dirty={form.dirty} pending={update.isPending} onCancel={form.reset} />
      </Card>

      <DriveImagePicker open={pickerOpen} onOpenChange={setPickerOpen} title="Choose a profile photo" value={values.photo} onSelect={(img) => form.set('photo', img)} />
    </form>
  )
}
