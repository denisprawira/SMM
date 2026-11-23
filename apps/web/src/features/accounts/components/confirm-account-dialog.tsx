import { TriangleAlert } from 'lucide-react'
import { useState } from 'react'
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
import { useSession } from '@/features/session/api'
import { PLATFORM_LABEL } from '@/lib/types'
import { accountLabel, useDisconnectAccount, useRemoveAccount, type SocialAccount } from '../api'

export type ConfirmKind = 'disconnect' | 'remove'

/** Destructive confirmation (Figma States "Destructive confirmation" 30:795 pattern). */
export function ConfirmAccountDialog({ account, kind, onOpenChange }: { account: SocialAccount; kind: ConfirmKind | null; onOpenChange: (open: boolean) => void }) {
  const session = useSession()
  const disconnect = useDisconnectAccount()
  const remove = useRemoveAccount()
  const label = accountLabel(account)
  const platform = PLATFORM_LABEL[account.platform]

  // Keep the last copy while the dialog animates out (kind is already null then).
  const [shownKind, setShownKind] = useState<ConfirmKind>(kind ?? 'disconnect')
  if (kind !== null && kind !== shownKind) setShownKind(kind)

  const copy =
    shownKind === 'remove'
      ? {
          title: `Remove ${account.name}?`,
          body: `${label} will be removed from ${session.workspace.name}. Published posts stay on ${platform}, and you can connect the account again anytime.`,
          action: 'Remove account',
        }
      : {
          title: `Disconnect ${label}?`,
          body: `Relay will stop publishing to this ${platform} account. Scheduled posts to it are paused until you reconnect. Published posts stay on ${platform}.`,
          action: 'Disconnect',
        }

  return (
    <AlertDialog open={kind !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[440px]">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => (shownKind === 'remove' ? remove.mutate(account) : disconnect.mutate(account))}>
            {copy.action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
