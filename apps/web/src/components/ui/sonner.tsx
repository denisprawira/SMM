import { CircleAlertIcon, CircleCheckIcon, InfoIcon, Loader2Icon, TriangleAlertIcon } from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

/**
 * Figma "Toast" (7:228): 360px, radius 10, border, shadow/lg, 18px status icon,
 * Body/Medium title + Body/Small secondary description. Bottom-right,
 * auto-dismiss 6s; errors persist (pass `duration: Infinity` from callers via
 * `toast.error`, which this Toaster defaults for you).
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      duration={6000}
      closeButton
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-[18px] text-success" />,
        info: <InfoIcon className="size-[18px] text-info" />,
        warning: <TriangleAlertIcon className="size-[18px] text-warning" />,
        error: <CircleAlertIcon className="size-[18px] text-danger" />,
        loading: <Loader2Icon className="size-[18px] animate-spin text-info" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "!w-[360px] !max-w-full !items-start !gap-2.5 !rounded-[10px] !border !border-border !bg-background !px-3.5 !py-3 !shadow-lg",
          icon: "!m-0 !mt-px !size-[18px]",
          title: "!text-body !font-medium !text-foreground",
          description: "!text-body-sm !text-muted-foreground",
          closeButton:
            "!left-auto !right-3 !top-3 !translate-0 !border-0 !bg-transparent !text-tertiary hover:!text-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
