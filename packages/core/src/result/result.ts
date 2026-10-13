/** A successful outcome carrying a value. */
export type Ok<Value> = { readonly ok: true; readonly value: Value };

/** A failed outcome carrying an expected, typed error. */
export type Err<Failure> = { readonly ok: false; readonly error: Failure };

/**
 * The outcome of an operation that can fail in an expected way (an invalid import, an
 * unresolved variable). Unexpected failures are thrown instead (conventions.md#typescript).
 */
export type Result<Value, Failure> = Ok<Value> | Err<Failure>;

/** Wraps a value in a successful {@link Result}. */
export function ok<Value>(value: Value): Ok<Value> {
  return { ok: true, value };
}

/** Wraps an error in a failed {@link Result}. */
export function err<Failure>(error: Failure): Err<Failure> {
  return { ok: false, error };
}
