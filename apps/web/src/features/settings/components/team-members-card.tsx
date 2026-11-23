import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Ellipsis, Link as LinkIcon, Plus, Send, Trash2, User, UserCog } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ASSIGNABLE_ROLES, ROLE_LABEL, teamQueryOptions, useChangeRole, useResendInvite, type AssignableRole, type TeamMember } from '../api'
import { SettingsCardHeader } from './form'
import { InviteMemberDialog, RemoveMemberDialog } from './team-dialogs'

const accessLabel = (m: TeamMember) => (m.access === 'all' ? 'All accounts' : `${m.access} ${m.access === 1 ? 'account' : 'accounts'}`)
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/*
 * Column widths from Figma (28:4499): Member flex · Role 150 · Accounts access 170 · Last active 110 · actions 32.
 * Accounts access folds under the email below 1024px; role + last active fold below 768px.
 */
const COL = {
  role: 'hidden w-[150px] shrink-0 md:flex',
  access: 'hidden w-[170px] shrink-0 lg:flex',
  lastActive: 'hidden w-[110px] shrink-0 md:flex',
}

/** Figma "Team members" card (28:4493): member table, invite, role change, remove. */
export function TeamMembersCard({ className }: { className?: string }) {
  const { data: members } = useSuspenseQuery(teamQueryOptions)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null)
  const [removeOpen, setRemoveOpen] = useState(false)

  const active = members.filter((m) => !m.invite).length
  const pending = members.length - active

  const askRemove = (member: TeamMember) => {
    setRemoveTarget(member)
    setRemoveOpen(true)
  }

  return (
    <section id="team" aria-labelledby="team-title" className={cn('scroll-mt-20 xl:scroll-mt-6', className)}>
      <Card>
        <SettingsCardHeader
          title={<span id="team-title">Team members</span>}
          description={pending > 0 ? `${plural(active, 'member', 'members')} · ${plural(pending, 'pending invite', 'pending invites')}` : plural(active, 'member', 'members')}
          action={
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <Plus />
              Invite member
            </Button>
          }
        />

        <div aria-hidden className="flex h-9 items-center gap-3 border-b bg-canvas px-5 text-caption font-medium text-tertiary">
          <span className="min-w-0 flex-1">Member</span>
          <span className={COL.role}>Role</span>
          <span className={COL.access}>Accounts access</span>
          <span className={COL.lastActive}>Last active</span>
          <span className="w-8 shrink-0" />
        </div>

        <ul aria-label="Team members">
          {members.map((member) => (
            <MemberRow key={member.id} member={member} onRemove={askRemove} />
          ))}
        </ul>

        <dl className="grid grid-cols-2 gap-x-5 gap-y-3 border-t bg-canvas px-5 py-3 text-caption md:flex">
          {ASSIGNABLE_ROLES.map((r) => (
            <div key={r.value} className="flex min-w-0 flex-1 flex-col gap-px">
              <dt className="font-medium text-foreground">{r.label}</dt>
              <dd className="text-tertiary md:truncate" title={r.description}>
                {r.description}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} members={members} />
      <RemoveMemberDialog member={removeTarget} open={removeOpen} onOpenChange={setRemoveOpen} />
    </section>
  )
}

function MemberRow({ member, onRemove }: { member: TeamMember; onRemove: (m: TeamMember) => void }) {
  const changeRole = useChangeRole()
  const invited = Boolean(member.invite)
  const label = member.name ?? member.email

  const setRole = (role: AssignableRole) => {
    if (role !== member.role) changeRole.mutate({ member, role })
  }

  return (
    <li className="flex items-center gap-3 border-b px-5 py-2.5 last:border-b-0">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <Avatar className={cn(invited && 'opacity-50')}>
          <AvatarFallback>{member.initials}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className={cn('truncate text-body-sm font-medium', invited ? 'text-muted-foreground' : 'text-foreground')}>{label}</span>
            {member.you && <Badge>You</Badge>}
            {invited && <Badge variant="accent">Invite sent</Badge>}
          </div>
          <p className="truncate text-caption text-tertiary">{member.invite ? `Invited by ${member.invite.by} · ${member.invite.on}` : member.email}</p>
          <p className="truncate text-caption text-tertiary lg:hidden">
            <span className="md:hidden">{ROLE_LABEL[member.role]} · </span>
            {accessLabel(member)}
            <span className="md:hidden"> · {member.lastActive}</span>
          </p>
        </div>
      </div>

      <div className={cn(COL.role, 'items-center')}>
        {member.role === 'owner' ? (
          <span className="text-body-sm text-muted-foreground">{ROLE_LABEL.owner}</span>
        ) : (
          <Select value={member.role} onValueChange={(v) => setRole(v as AssignableRole)}>
            <SelectTrigger aria-label={`Role for ${label}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              {ASSIGNABLE_ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <span className={cn(COL.access, 'text-body-sm text-muted-foreground')}>{accessLabel(member)}</span>
      <span className={cn(COL.lastActive, 'text-body-sm', member.lastActive === 'Now' ? 'text-success-text' : 'text-tertiary')}>{member.lastActive}</span>

      <MemberActions member={member} onRole={setRole} onRemove={() => onRemove(member)} />
    </li>
  )
}

function MemberActions({ member, onRole, onRemove }: { member: TeamMember; onRole: (role: AssignableRole) => void; onRemove: () => void }) {
  const resend = useResendInvite()
  const label = member.name ?? member.email

  const copyInvite = async () => {
    const url = `https://relay.app/join/${member.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Invite link copied', { description: url })
    } catch {
      toast.error('Couldn’t copy the link', { description: url, duration: Infinity })
    }
  }

  return (
    // Non-modal so the AlertDialog it opens doesn't inherit a stale pointer-events lock.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${label}`} className="shrink-0">
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {member.role === 'owner' ? (
          <DropdownMenuItem asChild>
            <Link to="/settings/profile">
              <User />
              Edit your profile
            </Link>
          </DropdownMenuItem>
        ) : (
          <>
            {member.invite && (
              <>
                <DropdownMenuItem onSelect={() => resend.mutate(member)}>
                  <Send />
                  Resend invite
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={copyInvite}>
                  <LinkIcon />
                  Copy invite link
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2 [&_svg:not([class*='text-'])]:text-muted-foreground">
                <UserCog className="size-4" />
                Change role
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={member.role} onValueChange={(v) => onRole(v as AssignableRole)}>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <DropdownMenuRadioItem key={r.value} value={r.value}>
                      {r.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onRemove}>
              <Trash2 />
              {member.invite ? 'Revoke invite' : 'Remove from workspace'}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
