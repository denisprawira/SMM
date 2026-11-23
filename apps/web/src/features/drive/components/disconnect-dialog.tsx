import { TriangleAlert } from 'lucide-react'
import { useState, type ReactNode } from 'react'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDisconnectDrive } from '../api'

const CONFIRM_WORD = 'DISCONNECT'

/** States "Modal/Disconnect Drive" (30:795) — type DISCONNECT to confirm. */
export function DisconnectDriveDialog({ scheduledPosts, children }: { scheduledPosts: number; children: ReactNode }) {
  const disconnect = useDisconnectDrive()
  const [value, setValue] = useState('')
  const confirmed = value.trim() === CONFIRM_WORD
  return (
    <AlertDialog onOpenChange={(open) => !open && setValue('')}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[440px]">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Disconnect Google Drive?</AlertDialogTitle>
          <AlertDialogDescription>
            {scheduledPosts} scheduled posts use files from this Drive. They’ll be paused until you reconnect. Your files stay in Drive and are not affected.
          </AlertDialogDescription>
          <div className="flex w-full flex-col gap-1.5">
            <Label htmlFor="disconnect-confirm" className="text-caption font-medium text-muted-foreground">
              Type {CONFIRM_WORD} to confirm
            </Label>
            <Input
              id="disconnect-confirm"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="text-body-sm"
            />
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={!confirmed} onClick={() => disconnect.mutate()}>
            Disconnect and pause {scheduledPosts} posts
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
