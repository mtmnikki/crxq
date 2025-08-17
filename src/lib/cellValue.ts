/**
 * Helpers to safely read Airtable cell values for display
 * - Select fields may arrive as strings, objects ({ name, id, ... }), or arrays.
 * - These helpers coerce values to plain strings so React never receives raw objects as children.
 */

/**
 * Extract a human-readable string from a single- or multi-select cell value.
 * - Supports: string, array (first item), and objects with name/label/value.
 */
export function getSelectText(value: unknown): string | undefined {
  if (value == null) return undefined;

  // If it's an array of values, take the first meaningful item
  if (Array.isArray(value)) {
    if (value.length === 0) return undefined;
    return getSelectText(value[0]);
  }

  // If it's already a string
  if (typeof value === 'string') return value;

  // If Airtable returns select as object (name/id/color or similar)
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (typeof v.name === 'string') return v.name;
    if (typeof v.label === 'string') return v.label;
    if (typeof v.value === 'string' || typeof v.value === 'number') return String(v.value);
  }

  return undefined;
}

/**
 * Generic conversion: turn a wide variety of JSON-ish values into a readable string.
 * Useful as a fallback for unexpected shapes.
 */
export function toReadableString(value: unknown): string | undefined {
  if (value == null) return undefined;

  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return undefined;
    return toReadableString(value[0]);
  }

  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (typeof v.name === 'string') return v.name;
    if (typeof v.title === 'string') return v.title;
    if (typeof v.label === 'string') return v.label;
  }

  return undefined;
}
