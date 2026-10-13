/**
 * The words a {@link KeyValueTable} shows and announces. Shared components take their text from
 * the feature that uses them, which reads it from the message catalog (ADR-0010).
 */
export type KeyValueTableLabels = {
  key: string;
  value: string;
  description: string;
  /** Header of the enabled column, read by screen readers only. */
  enabled: string;
  /** Header of the actions column, read by screen readers only. */
  actions: string;
  keyPlaceholder: string;
  valuePlaceholder: string;
  descriptionPlaceholder: string;
  newKey: string;
  newValue: string;
  newDescription: string;
  /** Names a row without a key in the labels below. */
  untitledRow: string;
  enableRow: (row: string) => string;
  keyOf: (row: string) => string;
  valueOf: (row: string) => string;
  descriptionOf: (row: string) => string;
  removeRow: (row: string) => string;
};
