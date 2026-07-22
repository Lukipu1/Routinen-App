/** Immutably moves an item from one index to another. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const result = items.slice();
  if (from < 0 || from >= result.length) return result;
  const clampedTo = Math.max(0, Math.min(result.length - 1, to));
  const [moved] = result.splice(from, 1);
  if (moved === undefined) return result;
  result.splice(clampedTo, 0, moved);
  return result;
}

/** Clamps a number into the inclusive range [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Sums a list of numbers. */
export function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
