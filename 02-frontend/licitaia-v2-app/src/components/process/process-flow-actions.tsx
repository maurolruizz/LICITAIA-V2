"use client";

import { deriveFlowSnapshotView } from "@/lib/flow-snapshot-presenter";

type Props = {
  state: Record<string, unknown>;
  executeLoading: boolean;
  executeError: string | null;
  executeSuccess: string | null;
  onExecuteAction: (action: string) => Promise<void>;
};

export function ProcessFlowActions({
  state,
  executeLoading,
  executeError,
  executeSuccess,
  onExecuteAction,
}: Props) {
  const view = deriveFlowSnapshotView(state);
  const hasActions = view.allowedActions.length > 0;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Ações operacionais
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        Ações permitidas pelo motor para o snapshot atual. A interface apenas executa o que o
        backend autorizar.
      </p>

      {!hasActions ? (
        <div className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          Nenhuma ação disponível neste momento. Verifique bloqueios ativos e a próxima ação
          requerida no estado do processo.
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {view.allowedActions.map((action) => (
            <button
              key={action}
              type="button"
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 font-mono text-xs font-medium text-neutral-900 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={executeLoading}
              onClick={() => void onExecuteAction(action)}
            >
              {executeLoading ? "Executando..." : action}
            </button>
          ))}
        </div>
      )}

      {executeSuccess ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {executeSuccess}
        </div>
      ) : null}

      {executeError ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {executeError}
        </div>
      ) : null}
    </section>
  );
}
