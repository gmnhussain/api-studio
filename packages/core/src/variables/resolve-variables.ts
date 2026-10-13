import type { VariableMap } from "./variable-scopes";
import { findVariableReferences, replaceVariableReferences } from "./variable-template";

/** How deep variables may reference other variables before resolution stops. */
export const MAX_VARIABLE_NESTING_DEPTH = 10;

/** Why a reference could not be resolved. */
export type UnresolvedReason = "undefined" | "cycle" | "too_deep";

export type UnresolvedVariable = { name: string; reason: UnresolvedReason };

/** The resolved text and every reference that stayed as written. */
export type VariableResolution = {
  value: string;
  unresolved: UnresolvedVariable[];
  /** Whether a secret value went into the result (so callers can redact it in history). */
  usesSecrets: boolean;
};

/**
 * Replaces `{{name}}` references with their values. A value may itself contain references
 * (`{{baseUrl}}` = `https://{{host}}`); they resolve recursively up to
 * {@link MAX_VARIABLE_NESTING_DEPTH} levels. A reference that is undefined, part of a cycle or too
 * deep stays literal and is reported, so the editor can highlight it and sending can refuse.
 */
export function resolveVariables(text: string, variables: VariableMap): VariableResolution {
  const unresolved = new Map<string, UnresolvedReason>();
  let usesSecrets = false;

  const resolveName = (name: string, chain: readonly string[]): string | undefined => {
    const variable = variables.get(name);
    if (!variable) {
      unresolved.set(name, "undefined");
      return undefined;
    }
    if (chain.includes(name)) {
      unresolved.set(name, "cycle");
      return undefined;
    }
    if (chain.length >= MAX_VARIABLE_NESTING_DEPTH) {
      unresolved.set(name, "too_deep");
      return undefined;
    }
    if (variable.isSecret) usesSecrets = true;
    const nextChain = [...chain, name];
    return replaceVariableReferences(variable.value, (nested) => resolveName(nested, nextChain));
  };

  const value = replaceVariableReferences(text, (name) => resolveName(name, []));
  return {
    value,
    unresolved: [...unresolved].map(([name, reason]) => ({ name, reason })),
    usesSecrets,
  };
}

/** Whether text references any variable that is not defined (for highlighting). */
export function hasUndefinedVariables(text: string, variables: VariableMap): boolean {
  return findVariableReferences(text).some((name) => !variables.has(name));
}
