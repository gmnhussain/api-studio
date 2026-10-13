import { Braces, History, Layers, Library, Settings, type LucideIcon } from "lucide-react";

/**
 * One icon per product concept, so a concept never appears with two different icons
 * (design-system.md#icons).
 */
export const CONCEPT_ICONS = {
  collections: Library,
  history: History,
  environments: Layers,
  variables: Braces,
  settings: Settings,
} as const satisfies Record<string, LucideIcon>;
