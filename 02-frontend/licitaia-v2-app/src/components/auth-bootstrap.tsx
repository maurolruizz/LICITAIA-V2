"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const initialized = useAuthStore((s) => s.initialized);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void bootstrap();
  }, [bootstrap]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-sm text-neutral-600">
        Carregando sessão…
      </div>
    );
  }

  return <>{children}</>;
}
