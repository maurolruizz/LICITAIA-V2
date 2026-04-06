"use client";

type Props = {
  state: Record<string, unknown>;
};

export function ProcessTechnicalDetails({ state }: Props) {
  return (
    <details className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <summary className="cursor-pointer text-sm font-medium text-neutral-700">
        Dados técnicos do snapshot (JSON completo)
      </summary>
      <p className="mt-2 text-xs text-neutral-500">
        Uso de apoio para auditoria e desenvolvimento; a operação deve usar os blocos acima.
      </p>
      <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-neutral-950 p-4 text-xs text-neutral-100">
        {JSON.stringify(state, null, 2)}
      </pre>
    </details>
  );
}
