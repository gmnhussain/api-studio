"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

import { EmptyState } from "./empty-state";

/** Props for {@link ErrorView}. */
export type ErrorViewProps = {
  title: string;
  description: string;
  retryLabel: string;
  onRetry: () => void;
};

/**
 * A full-height failure message with a retry, for route error boundaries. Announced to screen
 * readers as an alert.
 */
export function ErrorView({ title, description, retryLabel, onRetry }: ErrorViewProps) {
  return (
    <div role="alert" className="flex min-h-dvh items-center justify-center bg-background p-6">
      <EmptyState
        title={title}
        description={description}
        actions={
          <Button variant="outline" onClick={onRetry}>
            <RotateCcw data-icon="inline-start" />
            {retryLabel}
          </Button>
        }
      />
    </div>
  );
}
