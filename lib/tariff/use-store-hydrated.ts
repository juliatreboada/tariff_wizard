"use client";

import { useEffect, useState } from "react";
import { useWizardStore } from "./store";

/** Wait for zustand persist before routing decisions (avoids flash redirect). */
export function useStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persistApi = useWizardStore.persist;
    if (!persistApi) {
      setHydrated(true);
      return;
    }

    if (persistApi.hasHydrated()) {
      setHydrated(true);
      return;
    }

    const unsub = persistApi.onFinishHydration(() => {
      setHydrated(true);
    });
    void persistApi.rehydrate();
    return unsub;
  }, []);

  return hydrated;
}
