import type { Variable } from "../models/key-value-entry.schema";

/** Where a variable is defined; later scopes override earlier ones (data-model.md#environments). */
export const VARIABLE_SCOPES = ["global", "collection", "environment"] as const;
export type VariableScope = (typeof VARIABLE_SCOPES)[number];

/** A variable's effective value after scopes are merged. */
export type ScopedVariable = {
  name: string;
  value: string;
  isSecret: boolean;
  scope: VariableScope;
};

/** Effective variables by name. */
export type VariableMap = ReadonlyMap<string, ScopedVariable>;

/** The variables of each scope in effect for a request. */
export type VariableSources = Partial<Record<VariableScope, readonly Variable[]>>;

/**
 * Merges variable scopes into the values a request sees: workspace globals, then the request's
 * collection, then the active environment, each overriding the one before. Disabled variables
 * and variables without a name are ignored; within one scope the last definition wins.
 */
export function mergeVariableScopes(sources: VariableSources): VariableMap {
  const merged = new Map<string, ScopedVariable>();
  for (const scope of VARIABLE_SCOPES) {
    for (const variable of sources[scope] ?? []) {
      const name = variable.key.trim();
      if (!variable.enabled || name === "") continue;
      merged.set(name, { name, value: variable.value, isSecret: variable.isSecret, scope });
    }
  }
  return merged;
}
