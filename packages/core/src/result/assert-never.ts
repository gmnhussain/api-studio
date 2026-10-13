/**
 * Marks a branch that the type system proves unreachable, typically the `default` of an
 * exhaustive `switch` over a union. Reaching it at runtime means data bypassed validation.
 *
 * @throws {Error} Always.
 */
export function assertNever(value: never, context: string): never {
  throw new Error(`Unexpected ${context}: ${JSON.stringify(value)}`);
}
