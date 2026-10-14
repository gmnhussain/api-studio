import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

/**
 * Makes `@monaco-editor/react` use the bundled Monaco instead of fetching it from a CDN, so the
 * editor works offline and under a strict content security policy (local-first, ADR-0002).
 * Language services run in module workers bundled with the app.
 */
function setUpMonaco(): void {
  self.MonacoEnvironment = {
    getWorker: (_workerId, label) =>
      label === "json"
        ? new Worker(new URL("monaco-editor/language/json/json.worker.js", import.meta.url), {
            type: "module",
          })
        : new Worker(new URL("monaco-editor/editor/editor.worker.js", import.meta.url), {
            type: "module",
          }),
  };
  loader.config({ monaco });
}

setUpMonaco();

export { monaco };
