"use client";

import Link from "next/link";
import type { ProcessExecutionSummary } from "@/services/process.service";

type Props = {
  items: ProcessExecutionSummary[];
  listLoading: boolean;
  listError: string | null;
  createLoading: boolean;
  createError: string | null;
  onNewProcess: () => void;
};

export function ProcessesPanel({
  items,
  listLoading,
  listError,
  createLoading,
  createError,
  onNewProcess,
}: Props) {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">
          Novo processo administrativo
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600">
          Cria um processo de fluxo no tenant via{" "}
          <code className="rounded bg-neutral-100 px-1 text-xs">POST /api/process</code> e abre a
          condução operacional. Isso não passa pelo motor DECYON em modo execução completa — apenas
          inicializa o processo e a sessão de fluxo no backend.
        </p>
        <button
          type="button"
          onClick={onNewProcess}
          disabled={createLoading}
          className="mt-4 rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {createLoading ? "Criando…" : "Iniciar novo processo"}
        </button>
        {createError ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {createError}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">
          Execuções persistidas do motor
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600">
          Esta lista vem exclusivamente de{" "}
          <code className="rounded bg-neutral-100 px-1 text-xs">
            GET /api/process-executions
          </code>
          : trilhas de execução do motor de conformidade já gravadas no tenant (status final,
          módulos, vínculo opcional a <code className="rounded bg-neutral-100 px-1 text-xs">processId</code>
          ). Não é um inventário completo de todas as linhas da tabela de processos administrativos —
          o backend ainda não expõe um endpoint dedicado só para isso.
        </p>

        <div className="mt-6">
          {listLoading ? (
            <p className="text-sm text-neutral-600">Carregando execuções…</p>
          ) : null}

          {!listLoading && listError ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {listError}
            </p>
          ) : null}

          {!listLoading && !listError && items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-600">
              Nenhuma execução persistida neste tenant ainda. Execuções aparecem após corridas do
              motor que forem salvas pelo backend.
            </p>
          ) : null}

          {!listLoading && !listError && items.length > 0 ? (
            <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-100">
              {items.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-neutral-900">
                      Execução{" "}
                      <code className="rounded bg-neutral-100 px-1 text-xs">{row.id}</code>
                    </p>
                    {row.processId ? (
                      <p className="mt-0.5 text-neutral-600">
                        processId:{" "}
                        <Link
                          href={`/process/${encodeURIComponent(row.processId)}`}
                          className="font-medium text-neutral-900 underline underline-offset-2"
                        >
                          {row.processId}
                        </Link>
                      </p>
                    ) : (
                      <p className="mt-0.5 text-neutral-500">Sem processId vinculado</p>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500 sm:text-right">
                    <p>{formatDate(row.createdAt)}</p>
                    <p>
                      {row.finalStatus}
                      {row.halted ? " · interrompido" : ""} · HTTP {row.httpStatus}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}
