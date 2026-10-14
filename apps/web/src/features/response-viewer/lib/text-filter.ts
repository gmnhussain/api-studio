/**
 * Whether any field contains the filter text, ignoring case and surrounding spaces. An empty
 * filter matches everything.
 */
export function matchesTextFilter(filter: string, fields: readonly string[]): boolean {
  const query = filter.trim().toLowerCase();
  return query === "" || fields.some((field) => field.toLowerCase().includes(query));
}
