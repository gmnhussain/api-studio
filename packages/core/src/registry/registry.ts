/** Undoes a registration. Calling it twice is harmless. */
export type Disposable = { dispose: () => void };

/** A contribution to a registry: anything with a unique, stable id. */
export type Contribution = { readonly id: string };

/**
 * A typed list of contributions for one extension point: protocols, auth schemes, code
 * generators, importers, response viewers, commands (extensibility.md#registries). Built-in
 * features register exactly the way plugins will.
 */
export type Registry<Item extends Contribution> = {
  /** Adds a contribution; returns a handle that removes it again. */
  register: (item: Item) => Disposable;
  /** The contribution with this id, if registered. */
  get: (id: Item["id"]) => Item | undefined;
  /** Every contribution, in registration order. */
  list: () => readonly Item[];
};

/**
 * Creates an empty registry.
 *
 * @param name The extension point's name, used in error messages.
 */
export function createRegistry<Item extends Contribution>(name: string): Registry<Item> {
  const items = new Map<string, Item>();
  let snapshot: readonly Item[] = [];

  const refreshSnapshot = () => {
    snapshot = Object.freeze([...items.values()]);
  };

  return {
    register: (item) => {
      if (items.has(item.id)) {
        throw new Error(`${name} registry already has a contribution with id "${item.id}"`);
      }
      items.set(item.id, item);
      refreshSnapshot();
      return {
        dispose: () => {
          if (items.get(item.id) !== item) return;
          items.delete(item.id);
          refreshSnapshot();
        },
      };
    },
    get: (id) => items.get(id),
    list: () => snapshot,
  };
}
