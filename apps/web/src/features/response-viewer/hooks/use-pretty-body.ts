"use client";

import { useEffect, useState } from "react";

import { prettyPrintBody, type ResponseBodyFormat } from "@api-studio/core";

import { WORKER_BODY_THRESHOLD } from "../lib/body-size-limits";
import { getBodyTaskRunner } from "../lib/body-task-runners";

/** A body on its way to its pretty form. */
export type PrettyBody = { status: "formatting" } | { status: "ready"; text: string };

type FormattedBody = { source: string; format: ResponseBodyFormat; text: string };

/**
 * The last large body formatted. Switching to another view and back to Pretty shows it at once
 * instead of formatting it again; one body is kept, so memory stays bounded.
 */
let lastFormatted: FormattedBody | null = null;

function isFormattedFrom(
  formatted: FormattedBody | null,
  format: ResponseBodyFormat,
  text: string,
): formatted is FormattedBody {
  return formatted?.source === text && formatted.format === format;
}

/**
 * The pretty form of a body: formatted in place when it is small, in the body worker when it is
 * large, so formatting never blocks typing or scrolling. Formats without a formatter come back
 * as received.
 */
export function usePrettyBody(format: ResponseBodyFormat, text: string): PrettyBody {
  const isLarge = text.length > WORKER_BODY_THRESHOLD;
  const [formatted, setFormatted] = useState<FormattedBody | null>(null);

  useEffect(() => {
    if (!isLarge || isFormattedFrom(lastFormatted, format, text)) return;
    let isCurrent = true;
    const settle = (pretty: string | null) => {
      const result = { source: text, format, text: pretty ?? text };
      lastFormatted = result;
      if (isCurrent) setFormatted(result);
    };
    getBodyTaskRunner(text.length)
      .run("prettyPrint", { format, text })
      .then(settle, () => {
        settle(null);
      });
    return () => {
      isCurrent = false;
    };
  }, [format, text, isLarge]);

  if (!isLarge) return { status: "ready", text: prettyPrintBody(format, text) ?? text };
  if (isFormattedFrom(formatted, format, text)) return { status: "ready", text: formatted.text };
  if (isFormattedFrom(lastFormatted, format, text)) {
    return { status: "ready", text: lastFormatted.text };
  }
  return { status: "formatting" };
}
