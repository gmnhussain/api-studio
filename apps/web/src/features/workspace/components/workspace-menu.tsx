"use client";

import { Check, ChevronsUpDown, Pencil, Plus, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { routes } from "@/config/routes";

import { WorkspaceSwitcherSkeleton } from "./workspace-switcher-skeleton";
import { useWorkspaceBootstrap } from "../hooks/use-workspace-bootstrap";
import { useWorkspaceStore } from "../stores/workspace.store";

/** Dialogs load on demand, with the form libraries they need. */
const WorkspaceNameDialog = dynamic(() =>
  import("./workspace-name-dialog").then((module) => module.WorkspaceNameDialog),
);
const DeleteWorkspaceDialog = dynamic(() =>
  import("./delete-workspace-dialog").then((module) => module.DeleteWorkspaceDialog),
);

type OpenDialog = "create" | "rename" | "delete" | null;

/**
 * The workspace menu in the top bar: the active workspace's name, every workspace to switch to,
 * and create, rename and delete. Switching is navigation, so each workspace has its own URL.
 * Loaded by `WorkspaceSwitcher` after hydration, so its menu code is not in the initial bundle.
 */
export function WorkspaceMenu() {
  const t = useTranslations("workspace");
  const router = useRouter();
  const { service, status } = useWorkspaceBootstrap();
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
  const active = workspaces.find((workspace) => workspace.id === activeWorkspaceId);

  if (status !== "ready" || !service || !active) return <WorkspaceSwitcherSkeleton />;

  const closeDialog = () => {
    setOpenDialog(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              aria-label={t("switcher.label", { name: active.name })}
              className="max-w-56 gap-1.5 font-medium"
            />
          }
        >
          <span className="truncate">{active.name}</span>
          <ChevronsUpDown className="text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t("switcher.heading")}</DropdownMenuLabel>
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => {
                  router.push(routes.workspace(workspace.id));
                }}
              >
                <span className="truncate">{workspace.name}</span>
                {workspace.id === active.id ? <Check className="ml-auto text-primary" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setOpenDialog("create");
            }}
          >
            <Plus />
            {t("switcher.create")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setOpenDialog("rename");
            }}
          >
            <Pencil />
            {t("switcher.rename")}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            disabled={workspaces.length <= 1}
            onClick={() => {
              setOpenDialog("delete");
            }}
          >
            <Trash2 />
            {t("switcher.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {openDialog === "create" ? (
        <WorkspaceNameDialog
          mode="create"
          onOpenChange={closeDialog}
          onSubmit={service.createWorkspace}
          onSaved={(workspace) => {
            router.push(routes.workspace(workspace.id));
          }}
        />
      ) : null}
      {openDialog === "rename" ? (
        <WorkspaceNameDialog
          mode="rename"
          initialName={active.name}
          onOpenChange={closeDialog}
          onSubmit={(name) => service.renameWorkspace(active.id, name)}
        />
      ) : null}
      {openDialog === "delete" ? (
        <DeleteWorkspaceDialog
          workspace={active}
          onOpenChange={closeDialog}
          onConfirm={() => service.deleteWorkspace(active.id)}
          onDeleted={() => {
            router.push(routes.home());
          }}
        />
      ) : null}
    </>
  );
}
