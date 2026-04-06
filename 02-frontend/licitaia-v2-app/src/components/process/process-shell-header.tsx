"use client";

import Link from "next/link";
import type { ProcessRecord } from "@/services/process.service";

type Props = {
  process: ProcessRecord;
};

export function ProcessShellHeader({ process }: Props) {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-5xl px-6 py-5">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-neutral-700 underline-offset-2 hover:underline"
        >
          ← Painel operacional
        </Link>
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Processo administrativo
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-900">
            Condução do fluxo
          </h1>
          <p className="mt-2 font-mono text-sm text-neutral-600">{process.id}</p>
        </div>
      </div>
    </header>
  );
}
