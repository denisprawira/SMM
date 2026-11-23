import { useState } from 'react'
import { GoogleDriveLogo } from '@/components/brand'
import { Thumbnail } from '@/components/thumbnail'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useSession } from '@/features/session/api'
import { DRIVE_IMAGES, type DriveImage } from '../api'

type DriveImagePickerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  value: DriveImage | null
  onSelect: (image: DriveImage) => void
}

/** Pick an image file from the connected Drive (used for the workspace logo and profile photo). */
export function DriveImagePicker({ open, onOpenChange, title, value, onSelect }: DriveImagePickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        {open && (
          <PickerBody
            title={title}
            value={value}
            onCancel={() => onOpenChange(false)}
            onSelect={(img) => {
              onSelect(img)
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function PickerBody({ title, value, onCancel, onSelect }: { title: string; value: DriveImage | null; onCancel: () => void; onSelect: (image: DriveImage) => void }) {
  const session = useSession()
  const [selected, setSelected] = useState(value?.id ?? '')
  const image = DRIVE_IMAGES.find((i) => i.id === selected)

  return (
    <>
      <DialogHeader className="pr-14">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>Images from your Drive. Relay shows the file from Drive and never keeps a copy.</DialogDescription>
      </DialogHeader>
      <div className="flex items-center gap-2 px-6 pt-4">
        <GoogleDriveLogo size={16} />
        <span className="truncate text-caption text-muted-foreground">{session.drive.email} · My Drive / Northwind / Brand</span>
      </div>
      <RadioGroup value={selected} onValueChange={setSelected} aria-label="Drive images" className="grid grid-cols-2 gap-3 px-6 pt-3 sm:grid-cols-3">
        {DRIVE_IMAGES.map((img) => (
          <label
            key={img.id}
            htmlFor={`drive-image-${img.id}`}
            className="flex min-w-0 cursor-pointer flex-col gap-2 rounded-xl border p-2 transition-colors hover:border-strong has-data-[state=checked]:border-primary has-data-[state=checked]:ring-[3px] has-data-[state=checked]:ring-ring/20"
          >
            <Thumbnail tone={img.tone} kind="image" ratio={1} className="aspect-square h-auto w-full rounded-lg" />
            <span className="flex min-w-0 items-center gap-2">
              <RadioGroupItem id={`drive-image-${img.id}`} value={img.id} />
              <span className="truncate text-caption font-medium text-foreground">{img.name}</span>
            </span>
          </label>
        ))}
      </RadioGroup>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" disabled={!image} onClick={() => image && onSelect(image)}>
          Use image
        </Button>
      </DialogFooter>
    </>
  )
}
