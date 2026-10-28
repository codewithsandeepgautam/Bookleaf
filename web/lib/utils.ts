import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const fmtDateTime = (d?: string | null) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
export const inr = (n?: number | null) => (n == null ? '—' : `₹${n.toLocaleString('en-IN')}`);
export const ageHours = (d: string) => (Date.now() - new Date(d).getTime()) / 3_600_000;
export function ageLabel(d: string) {
  const h = ageHours(d);
  return h < 1 ? 'just now' : h < 24 ? `${Math.floor(h)}h` : `${Math.floor(h / 24)}d`;
}
