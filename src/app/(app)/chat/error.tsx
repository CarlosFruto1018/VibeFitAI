"use client";

import { useEffect } from "react";
import { PageError } from "@/components/ui/PageStates";
import { logger } from "@/lib/logger";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    logger.error("page-error", "Error no controlado en la página", error);
  }, [error]);

  return <PageError reset={reset} />;
}
