import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Tailwind class-larını konflikt olmadan birləşdirir */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
