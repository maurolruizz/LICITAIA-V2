"use client";

import { deriveFlowSnapshotView, labelForStep } from "@/lib/flow-snapshot-presenter";

type Props = {
  state: Record<string, unknown>;
};

export function ProcessStepOverview({ state }: Props) {
  const { stepStatusEntries } = deriveFlowSnapshotView(state);

  if (stepStatusEntries.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Etapas do fluxo
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          O snapshot não contém <code className="rounded bg-neutral-200 px-1 text-xs">stepStatusMap</code>{" "}
          legível.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        Etapas do fluxo
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        Mapa <code className="rounded bg-neutral-100 px-1 text-xs">stepStatusMap</code> do estado
        persistido.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs text-neutral-500">
              <th className="py-2 pr-4 font-medium">Etapa</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {stepStatusEntries.map(({ step, status }) => (
              <tr key={step} className="border-b border-neutral-100 last:border-0">
                <td className="py-2 pr-4">
                  <span className="font-medium text-neutral-900">
                    {labelForStep(step) ?? step}
                  </span>
                  <span className="ml-2 font-mono text-xs text-neutral-500">{step}</span>
                </td>
                <td className="py-2 font-mono text-xs text-neutral-800">{status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
