/**
 * Tells whether two JSON-like values (primitives, arrays, plain objects) are structurally equal.
 * Used to compare a draft with its saved request, so the dirty state is derived, never stored.
 * Object key order does not matter; array order does. Properties holding `undefined` count as
 * present, matching how records are compared before they are serialized.
 */
export function isDeepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (typeof left !== "object" || typeof right !== "object" || left === null || right === null) {
    return false;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
      return false;
    }
    return left.every((value, index) => isDeepEqual(value, right[index]));
  }

  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord);
  if (leftKeys.length !== Object.keys(rightRecord).length) return false;
  return leftKeys.every(
    (key) => Object.hasOwn(rightRecord, key) && isDeepEqual(leftRecord[key], rightRecord[key]),
  );
}
