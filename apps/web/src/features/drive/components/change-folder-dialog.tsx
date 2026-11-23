import { Folder } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useChangeDriveFolder, type DriveState } from '../api'
import { DRIVE_FOLDERS, DRIVE_ROOT_ID, folderChain } from '../data'
import { formatCount } from '../format'
import { cn } from '@/lib/utils'

/** Folders that can hold the Library: everything under My Drive, depth-first. */
function folderOptions() {
  const out: { id: string; name: string; depth: number; files: number }[] = []
  const walk = (parentId: string, depth: number) => {
    for (const f of DRIVE_FOLDERS.filter((x) => x.parentId === parentId)) {
      out.push({ id: f.id, name: f.name, depth, files: f.counts.videos + f.counts.images })
      walk(f.id, depth + 1)
    }
  }
  walk(DRIVE_ROOT_ID, 0)
  return out
}

const INDENT = ['pl-3', 'pl-7', 'pl-11', 'pl-15'] as const

/** "Change folder" — pick the Drive folder the Content Library lists (read-only; nothing is moved). */
export function ChangeFolderDialog({ drive, open, onOpenChange }: { drive: DriveState; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        {/* Content unmounts on close, so the picked value resets to the current folder on every open. */}
        <ChangeFolderBody drive={drive} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function ChangeFolderBody({ drive, onDone }: { drive: DriveState; onDone: () => void }) {
  const change = useChangeDriveFolder()
  const [value, setValue] = useState(drive.folderId)
  const options = folderOptions()
  return (
    <>
      <DialogHeader>
        <DialogTitle>Change content folder</DialogTitle>
        <DialogDescription>Relay only lists media inside this folder and its subfolders. Nothing in your Drive is moved or copied.</DialogDescription>
      </DialogHeader>
      <RadioGroup value={value} onValueChange={setValue} aria-label="Content folder" className="mt-4 max-h-[360px] gap-0.5 overflow-y-auto px-6">
        {options.map((o) => (
          <label
            key={o.id}
            className={cn(
              'flex h-10 cursor-pointer items-center gap-2.5 rounded-lg pr-3 transition-colors hover:bg-subtle has-data-[state=checked]:bg-primary-subtle',
              INDENT[Math.min(o.depth, INDENT.length - 1)],
            )}
          >
            <RadioGroupItem value={o.id} />
            <Folder aria-hidden className="size-4 shrink-0 text-warning" />
            <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-foreground">{o.name}</span>
            <span className="shrink-0 text-caption text-tertiary">{formatCount(o.files)} files</span>
          </label>
        ))}
      </RadioGroup>
      <DialogFooter>
        <p className="mr-auto hidden min-w-0 truncate text-caption text-tertiary sm:block">{folderChain(value).map((f) => f.name).join(' / ')}</p>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button
          disabled={value === drive.folderId}
          onClick={() => {
            change.mutate(value)
            onDone()
          }}
        >
          Use this folder
        </Button>
      </DialogFooter>
    </>
  )
}
