/**
 * The part of a Zustand store a service uses: read the state and follow its changes. Services
 * take stores in this shape, so tests pass the real store and nothing else is needed.
 */
export type ObservableStore<State> = {
  getState: () => State;
  subscribe: (listener: (state: State, previous: State) => void) => () => void;
};
