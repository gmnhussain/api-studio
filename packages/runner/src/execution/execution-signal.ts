/** Options for {@link createExecutionSignal}. */
export type ExecutionSignalOptions = {
  /** Aborted when the user cancels; usually the incoming request's signal. */
  cancelSignal?: AbortSignal;
  /** Upper bound for the whole execution, including redirects. */
  timeoutMilliseconds: number;
};

/**
 * Creates the one signal an execution listens to: it aborts when the caller cancels
 * or when the timeout elapses, whichever comes first.
 *
 * Use {@link isTimeoutReason} on `signal.reason` to tell a timeout from a cancel.
 *
 * @throws {RangeError} When `timeoutMilliseconds` is not a positive integer.
 */
export function createExecutionSignal({
  cancelSignal,
  timeoutMilliseconds,
}: ExecutionSignalOptions): AbortSignal {
  if (!Number.isSafeInteger(timeoutMilliseconds) || timeoutMilliseconds <= 0) {
    throw new RangeError(
      `timeoutMilliseconds must be a positive integer, received ${String(timeoutMilliseconds)}`,
    );
  }

  const timeoutSignal = AbortSignal.timeout(timeoutMilliseconds);
  return cancelSignal ? AbortSignal.any([cancelSignal, timeoutSignal]) : timeoutSignal;
}

/**
 * Tells whether an abort reason came from a timeout rather than a cancel.
 * `AbortSignal.timeout()` aborts with a `TimeoutError` DOMException.
 *
 * @param reason The `reason` of an aborted signal.
 */
export function isTimeoutReason(reason: unknown): boolean {
  return reason instanceof DOMException && reason.name === "TimeoutError";
}
