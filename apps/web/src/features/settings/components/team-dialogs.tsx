import { MailX, UserMinus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useSession } from '@/features/session/api'
import { ASSIGNABLE_ROLES, useInviteMember, useRemoveMember, type AssignableRole, type TeamMember } from '../api'
import { TextField } from './form'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/* ── Invite member ─────────────────────────────────────────────────── */

export function InviteMemberDialog({ open, onOpenChange, members }: { open: boolean; onOpenChange: (open: boolean) => void; members: TeamMember[] }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">{open && <InviteForm members={members} onDone={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  )
}

function InviteForm({ members, onDone }: { members: TeamMember[]; onDone: () => void }) {
  const session = useSession()
  const invite = useInviteMember()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AssignableRole>('editor')
  const [showError, setShowError] = useState(false)

  const normalized = email.trim().toLowerCase()
  const existing = members.find((m) => m.email.toLowerCase() === normalized)
  const error = !normalized
    ? 'Enter an email address.'
    : !EMAIL_RE.test(normalized)
      ? 'Enter a valid email, like name@company.com.'
      : existing
        ? existing.invite
          ? `${normalized} already has a pending invite.`
          : `${existing.name ?? normalized} is already on the team.`
        : undefined

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setShowError(true)
    if (error) {
      document.getElementById('invite-email')?.focus()
      return
    }
    invite.mutate({ email: normalized, role })
    onDone()
  }

  return (
    <form noValidate onSubmit={onSubmit}>
      <DialogHeader className="pr-14">
        <DialogTitle>Invite member</DialogTitle>
        <DialogDescription>They’ll get an email invite to join {session.workspace.name}.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4 px-6 pt-5">
        <TextField
          id="invite-email"
          label="Email"
          type="email"
          autoComplete="off"
          autoFocus
          placeholder="name@company.com"
          helper="Use the address they sign in to Google with."
          error={showError ? error : undefined}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => email && setShowError(true)}
        />
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-body-sm font-medium text-foreground">Role</legend>
          <RadioGroup value={role} onValueChange={(v) => setRole(v as AssignableRole)} className="gap-2">
            {ASSIGNABLE_ROLES.map((r) => (
              <label
                key={r.value}
                htmlFor={`invite-role-${r.value}`}
                className="flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-subtle has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary-subtle/50"
              >
                <RadioGroupItem id={`invite-role-${r.value}`} value={r.value} className="mt-px" />
                <span className="flex min-w-0 flex-col gap-px">
                  <span className="text-body-sm font-medium text-foreground">{r.label}</span>
                  <span className="text-caption text-tertiary">{r.description}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </fieldset>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Send invite</Button>
      </DialogFooter>
    </form>
  )
}

/* ── Remove member / revoke invite ─────────────────────────────────── */

export function RemoveMemberDialog({ member, open, onOpenChange }: { member: TeamMember | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const session = useSession()
  const remove = useRemoveMember()
  if (!member) return null
  const invite = Boolean(member.invite)
  const name = member.name ?? member.email
  const first = member.name?.split(' ')[0] ?? member.email

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[440px]">
        <AlertDialogHeader>
          <AlertDialogMedia>{invite ? <MailX /> : <UserMinus />}</AlertDialogMedia>
          <AlertDialogTitle>{invite ? 'Revoke invite?' : `Remove ${name}?`}</AlertDialogTitle>
          <AlertDialogDescription>
            {invite
              ? `${member.email} won’t be able to join ${session.workspace.name} with this invite.`
              : `${first} loses access to ${session.workspace.name} right away. Posts they scheduled stay scheduled.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="ghost">Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => remove.mutate(member)}>
            {invite ? 'Revoke invite' : 'Remove member'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
