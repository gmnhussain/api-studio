"use client";

import { Search, X } from "lucide-react";
import type { KeyboardEvent } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Props for {@link SearchInput}. */
export type SearchInputProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  /** Names the field, since the placeholder disappears while typing. */
  "aria-label": string;
  /** Names the clear button. */
  clearLabel: string;
  className?: string;
};

/**
 * A filter field (design-system.md#shared-composites): a search icon, a clear button while it
 * holds text, and Escape to clear it. Escape only clears; with an empty field it does what it
 * does elsewhere (cancel a request, close a dialog).
 */
export function SearchInput({
  value,
  onValueChange,
  placeholder,
  "aria-label": ariaLabel,
  clearLabel,
  className,
}: SearchInputProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape" || value === "") return;
    event.preventDefault();
    event.stopPropagation();
    onValueChange("");
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute start-2 size-3.5 text-muted-foreground"
      />
      <Input
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        onKeyDown={handleKeyDown}
        className="h-7 ps-7 pe-7 text-xs md:text-xs [&::-webkit-search-cancel-button]:hidden"
      />
      {value === "" ? null : (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={() => {
            onValueChange("");
          }}
          className="absolute end-1.5 flex size-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <X aria-hidden className="size-3.5" />
        </button>
      )}
    </div>
  );
}
