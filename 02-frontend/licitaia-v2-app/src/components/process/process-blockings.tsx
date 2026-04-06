"use client";

import { deriveFlowSnapshotView } from "@/lib/flow-snapshot-presenter";

type Props = {
  state: Record<string, unknown>;
};

export function ProcessBlockings({ state }: Props) {
  const { activeBlockings } = deriveFlowSnapshotView(state);

  if (activeBlockings.length === 0) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Bloqueios e travas
        </h2>
        <p className="mt-2 text-sm text-neutral-700">
          Nenhum item em <code className="rounded bg-neutral-100 px-1 text-xs">activeBlockings</code>{" "}
          neste snapshot.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-900">
        Bloqueios ativos
      </h2>
      <p className="mt-1 text-sm text-amber-950/80">
        Lista derivada de <code className="rounded bg-amber-100/80 px-1 text-xs">activeBlockings</code>{" "}
        no estado do fluxo.
      </p>
      <ul className="mt-4 space-y-3">
        {activeBlockings.map((b, i) => (
          <li
            key={`${b.code ?? "block"}-${i}`}
            className="rounded-xl border border-amber-200/80 bg-white p-4 text-sm"
          >
            <div className="flex flex-wrap items-baseline gap-2">
              {b.code ? (
                <span className="font-mono font-semibold text-neutral-900">{b.code}</span>
              ) : null}
              {b.severity ? (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                  {b.severity}
                </span>
              ) : null}
            </div>
            <dl className="mt-2 grid gap-1 text-xs text-neutral-600">
              {b.step ? (
                <div>
                  <span className="text-neutral-500">Etapa: </span>
                  <span className="font-mono">{b.step}</span>
                </div>
              ) : null}
              {b.messageKey ? (
                <div>
                  <span className="text-neutral-500">messageKey: </span>
                  <span className="font-mono">{b.messageKey}</span>
                </div>
              ) : null}
              {b.origin ? (
                <div>
                  <span className="text-neutral-500">origin: </span>
                  <span className="font-mono">{b.origin}</span>
                </div>
              ) : null}
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
