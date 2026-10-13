/** A task that runs once after calls to `schedule` stop for a while. */
export type DebouncedTask = {
  /** Runs the task after the delay, restarting the delay if it is already waiting. */
  schedule: () => void;
  /** Runs a waiting task now (when the page is hidden, before a reload); resolves when done. */
  flush: () => Promise<void>;
  /** Drops a waiting run. */
  cancel: () => void;
};

/**
 * Creates a {@link DebouncedTask} for auto-save (F-25): bursts of edits become one write, and
 * `flush` makes sure the last edit is written when the page goes away. Runs never overlap: a run
 * that is due while another is in progress starts after it.
 *
 * @param run The work, such as writing pending changes; a rejection is passed to `onError`.
 * @param delayMilliseconds How long the task waits for calls to stop.
 */
export function createDebouncedTask(
  run: () => Promise<void>,
  delayMilliseconds: number,
  onError: (error: unknown) => void = () => undefined,
): DebouncedTask {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<void> = Promise.resolve();

  const execute = (): Promise<void> => {
    timer = undefined;
    running = running.then(run).catch(onError);
    return running;
  };

  return {
    schedule: () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => void execute(), delayMilliseconds);
    },
    flush: () => {
      if (timer === undefined) return running;
      clearTimeout(timer);
      return execute();
    },
    cancel: () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    },
  };
}
