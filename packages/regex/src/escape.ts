/** Escape metacharacters for Path of Exile's regex-like search. */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
