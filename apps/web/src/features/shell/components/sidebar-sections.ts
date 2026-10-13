import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

import { CollectionsIllustration } from "@/components/illustrations/collections-illustration";
import { EnvironmentsIllustration } from "@/components/illustrations/environments-illustration";
import { HistoryIllustration } from "@/components/illustrations/history-illustration";
import type { IllustrationProps } from "@/components/illustrations/illustration-frame";
import { VariablesIllustration } from "@/components/illustrations/variables-illustration";
import { CONCEPT_ICONS } from "@/config/icons";

import type { SidebarSectionId } from "../shell.constants";

/** What the shell needs to show one sidebar section. */
export type SidebarSectionDefinition = {
  icon: LucideIcon;
  Illustration: ComponentType<IllustrationProps>;
};

/**
 * Sidebar sections (docs/architecture/extensibility.md#registries). Each section shows its empty
 * state until its feature contributes real content: collections and history in M6, environments
 * and variables in M6.
 */
export const SIDEBAR_SECTION_DEFINITIONS: Readonly<
  Record<SidebarSectionId, SidebarSectionDefinition>
> = {
  collections: { icon: CONCEPT_ICONS.collections, Illustration: CollectionsIllustration },
  history: { icon: CONCEPT_ICONS.history, Illustration: HistoryIllustration },
  environments: { icon: CONCEPT_ICONS.environments, Illustration: EnvironmentsIllustration },
  variables: { icon: CONCEPT_ICONS.variables, Illustration: VariablesIllustration },
};
