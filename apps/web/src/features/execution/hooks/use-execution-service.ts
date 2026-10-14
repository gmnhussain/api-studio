"use client";

import { useEffect, useState } from "react";

import type { ExecutionService } from "../services/execution.service";
import { loadExecutionService } from "../services/load-execution-service";

/** The execution service, loaded after mount; `null` until then. Every caller shares one. */
export function useExecutionService(): ExecutionService | null {
  const [service, setService] = useState<ExecutionService | null>(null);
  useEffect(() => {
    let isMounted = true;
    void loadExecutionService().then((loaded) => {
      if (isMounted) setService(loaded);
    });
    return () => {
      isMounted = false;
    };
  }, []);
  return service;
}
