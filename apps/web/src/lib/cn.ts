import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge only knows Tailwind's default font sizes, so it would treat
 * `text-h1` and `text-primary` as the same group and drop one. Register the
 * design-system type styles as font sizes.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        { text: ['display', 'h1', 'h2', 'h3', 'metric', 'body', 'body-sm', 'caption', 'overline'] },
      ],
      shadow: [{ shadow: ['focus'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
