"use client";

import { deriveFlowSnapshotView, type FlowSnapshotView } from "@/lib/flow-snapshot-presenter";

type Props = {
  state: Record<string, unknown>;
};

export function ProcessOperationalStatus({ state }: Props) {
  const view = deriveFlowSnapshotView(state);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Detalhe do estado operacional
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        Complemento ao foco acima: campos do snapshot retornado pelo backend (FlowController).
      </p>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-neutral-500">Revisão do fluxo</dt>
          <dd className="mt-1 font-mono text-neutral-900">
            {view.revision !== null ? view.revision : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-neutral-500">Fase de revisão</dt>
          <dd className="mt-1 font-mono text-sm text-neutral-900">
            {view.reviewPhase ?? "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <p className="text-xs font-medium text-neutral-500">Ações permitidas (motor)</p>
        <div className="mt-2">
          {view.allowedActions.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {view.allowedActions.map((a) => (
                <li
                  key={a}
                  className="rounded-lg bg-neutral-100 px-2 py-1 font-mono text-xs text-neutral-800"
                >
                  {a}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-sm text-neutral-500">Nenhuma listada no snapshot</span>
          )}
        </div>
      </div>

      <MetaLine view={view} />
    </section>
  );
}

function MetaLine({ view }: { view: FlowSnapshotView }) {
  return (
    <p className="mt-4 border-t border-neutral-100 pt-4 text-xs text-neutral-500">
      {view.schemaVersion ? (
        <>Schema {view.schemaVersion}</>
      ) : (
        <>Versão de schema não indicada no snapshot</>
      )}
      {view.renderTokenPreview ? (
        <>
          {" "}
          · renderToken:{" "}
          <span className="font-mono text-neutral-700">{view.renderTokenPreview}</span>
        </>
      ) : null}
    </p>
  );
}
