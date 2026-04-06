"use client";

import {
  deriveFlowSnapshotView,
  labelForStep,
} from "@/lib/flow-snapshot-presenter";

type Props = {
  state: Record<string, unknown>;
};

/**
 * Destaque único da “próxima ação” e etapa atual — apenas leitura do snapshot.
 */
export function ProcessOperationalFocus({ state }: Props) {
  const view = deriveFlowSnapshotView(state);
  const hasNext = Boolean(view.nextRequiredAction);
  const hasStep = Boolean(view.currentStep);

  return (
    <section className="rounded-2xl border border-neutral-900 bg-neutral-900 px-6 py-5 text-white shadow-md">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
        Foco operacional
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-neutral-400">Próxima ação indicada pelo fluxo</p>
          <p className="mt-1 break-words font-mono text-base font-semibold leading-snug">
            {hasNext ? view.nextRequiredAction : "— (não informado no snapshot)"}
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">Etapa atual</p>
          <p className="mt-1 text-base font-semibold">
            {hasStep ? (
              <>
                {labelForStep(view.currentStep!)}{" "}
                <span className="font-mono text-sm font-normal text-neutral-300">
                  ({view.currentStep})
                </span>
              </>
            ) : (
              <span className="font-normal text-neutral-400">—</span>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
