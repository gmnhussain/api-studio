import { getVariableCompletion, type ScopedVariable, type VariableMap } from "@api-studio/core";

/** One completion the popup offers, with the text it produces when picked. */
export type CompletionOption =
  | {
      kind: "variable";
      id: string;
      label: string;
      variable: ScopedVariable;
      /** The whole input value after picking the option. */
      nextValue: string;
      /** Where the caret goes after picking it. */
      caret: number;
    }
  | { kind: "suggestion"; id: string; label: string; nextValue: string; caret: number };

/** What decides the completions: the text, the caret and what can be completed. */
export type CompletionInput = {
  value: string;
  caret: number;
  variables: VariableMap;
  /** Whole-value suggestions, such as common header names (F-05). */
  suggestions?: readonly string[];
};

/**
 * The completions for the text at the caret (F-28). Inside an open `{{` they are the matching
 * variables, and picking one writes `{{name}}`, replacing a partial name and any closing braces
 * already there. Elsewhere they are the suggestions that start with the whole value, ignoring
 * case; an exact match is not offered again.
 */
export function getCompletionOptions({
  value,
  caret,
  variables,
  suggestions = [],
}: CompletionInput): CompletionOption[] {
  const completion = getVariableCompletion(value, caret, variables);
  if (completion) {
    return completion.candidates.map((variable) => {
      const inserted = `${variable.name}}}`;
      return {
        kind: "variable",
        id: `variable:${variable.name}`,
        label: variable.name,
        variable,
        nextValue: value.slice(0, completion.from) + inserted + value.slice(completion.to),
        caret: completion.from + inserted.length,
      };
    });
  }

  const typed = value.trim().toLowerCase();
  if (typed === "") return [];
  return suggestions
    .filter((suggestion) => suggestion.toLowerCase().startsWith(typed) && suggestion !== value)
    .map((suggestion) => ({
      kind: "suggestion",
      id: `suggestion:${suggestion}`,
      label: suggestion,
      nextValue: suggestion,
      caret: suggestion.length,
    }));
}
