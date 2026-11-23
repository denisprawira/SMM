import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

/**
 * Figma "Button" (7:44). Variant map: Primary → default, Secondary → outline,
 * Ghost → ghost, Destructive → destructive. Size map: md → default (36px),
 * sm → sm (30px). Icon buttons (Figma "IconButton/…"): outline + icon (32px).
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        destructive:
          "bg-destructive text-white hover:bg-danger-text focus-visible:ring-destructive/20",
        outline:
          "border bg-background text-foreground shadow-xs hover:bg-subtle aria-expanded:bg-subtle",
        secondary: "bg-subtle text-foreground hover:bg-muted",
        ghost:
          "text-muted-foreground hover:bg-subtle hover:text-foreground aria-expanded:bg-subtle aria-expanded:text-foreground",
        link: "text-primary-text underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-2 rounded-lg px-3.5 text-body",
        sm: "h-[30px] gap-1.5 rounded-md px-2.5 text-body-sm",
        xs: "h-6 gap-1 rounded-md px-2 text-caption [&_svg:not([class*='size-'])]:size-3",
        lg: "h-10 gap-2 rounded-lg px-4 text-body",
        icon: "size-8 rounded-lg",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-7 rounded-md",
        "icon-lg": "size-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
