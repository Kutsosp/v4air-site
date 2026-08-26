import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Base-aware path to a file in public/ (works at / and at /v4air-site/) */
export const asset = (p: string) => import.meta.env.BASE_URL + p
