"use client";

import dynamic from "next/dynamic";

import { WorkspaceSwitcherSkeleton } from "./workspace-switcher-skeleton";

/**
 * The workspace switcher in the top bar. Workspaces live in IndexedDB, so the menu can only
 * render in the browser; it loads after hydration with its menu library, keeping both out of the
 * initial bundle (performance.md#how-the-javascript-budget-is-set). Until then a skeleton holds
 * its place, as it would while the workspace list loads anyway.
 */
export const WorkspaceSwitcher = dynamic(
  () => import("./workspace-menu").then((module) => module.WorkspaceMenu),
  { ssr: false, loading: () => <WorkspaceSwitcherSkeleton /> },
);
