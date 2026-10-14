"use client";

import { useRef, useState } from "react";

import { getTextRow, indexTextRows, tokenizeJsonLine, type JsonTokenKind } from "@api-studio/core";

import { TEXT_PROBE_LENGTH, useTextMetrics } from "../../hooks/use-text-metrics";
import { getRowWindow } from "../../lib/row-window";

/** Rows rendered beyond each edge of the viewport, so fast scrolling shows no gaps. */
const OVERSCAN_ROWS = 20;

/** The font and spacing of a row, shared with the probe that measures it. */
const ROW_CLASSES = "px-3 font-mono text-xs leading-5 whitespace-pre";

/** Token colours, the same the code editor uses for JSON (monaco-theme.ts). */
const TOKEN_CLASSES: Readonly<Record<JsonTokenKind, string | undefined>> = {
  key: "text-primary",
  string: "text-success",
  number: "text-warning",
  keyword: "text-info",
  plain: undefined,
};

/** One row, coloured as JSON when asked. */
function TextRow({ text, highlightsJson }: { text: string; highlightsJson: boolean }) {
  if (!highlightsJson) return text;
  return tokenizeJsonLine(text).map((token, index) =>
    token.kind === "plain" ? (
      token.text
    ) : (
      <span key={index} className={TOKEN_CLASSES[token.kind]}>
        {token.text}
      </span>
    ),
  );
}

/** Props for {@link LargeTextView}. */
export type LargeTextViewProps = {
  text: string;
  /** Colour rows as JSON (the pretty view of a JSON body). */
  highlightsJson: boolean;
  "aria-label": string;
};

/**
 * Text of any size, shown row by row (performance.md#strategies). Lines are cut at exactly the
 * columns that fit, so every row is one line of known height: the rows in view follow from the
 * scroll position alone, and only they are sliced, highlighted and rendered. Selecting and
 * copying work on what is shown; "Copy body" copies everything.
 */
export function LargeTextView({
  text,
  highlightsJson,
  "aria-label": ariaLabel,
}: LargeTextViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const { columns, lineHeight, viewportHeight } = useTextMetrics(scrollRef, probeRef);
  const rows = indexTextRows(text, columns);
  const { scrollHeight, first, end, offset } = getRowWindow({
    scrollTop,
    viewportHeight,
    rowCount: rows.count,
    rowHeight: lineHeight,
    overscan: OVERSCAN_ROWS,
  });

  return (
    <div
      ref={scrollRef}
      // Read-only text, as the code editor presents a body; focusable, so it scrolls by keyboard.
      role="textbox"
      aria-readonly
      aria-multiline
      aria-label={ariaLabel}
      tabIndex={0}
      onScroll={(event) => {
        setScrollTop(event.currentTarget.scrollTop);
      }}
      className="relative h-full overflow-auto outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
    >
      <div aria-hidden className={`invisible absolute top-0 left-0 ${ROW_CLASSES}`}>
        <div ref={probeRef} className="w-max">
          {"0".repeat(TEXT_PROBE_LENGTH)}
        </div>
      </div>
      {/* The scrolling content; rows in view are placed in it where the window says. */}
      <div className="relative w-full overflow-hidden" style={{ height: scrollHeight }}>
        <div
          className="absolute inset-x-0 top-0"
          style={{ transform: `translateY(${String(offset)}px)` }}
        >
          {Array.from({ length: end - first }, (_value, position) => {
            const index = first + position;
            return (
              <div key={index} className={ROW_CLASSES} style={{ height: lineHeight }}>
                <TextRow text={getTextRow(rows, index)} highlightsJson={highlightsJson} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
