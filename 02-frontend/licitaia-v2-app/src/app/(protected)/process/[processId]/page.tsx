"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useProcessStore } from "@/store/process.store";
import { ProcessShellHeader } from "@/components/process/process-shell-header";
import { ProcessOperationalFocus } from "@/components/process/process-operational-focus";
import { ProcessOperationalStatus } from "@/components/process/process-operational-status";
import { ProcessStepOverview } from "@/components/process/process-step-overview";
import { ProcessBlockings } from "@/components/process/process-blockings";
import { ProcessTechnicalDetails } from "@/components/process/process-technical-details";
import { ProcessFlowActions } from "@/components/process/process-flow-actions";

export default function ProcessPage() {
  const params = useParams();
  const processId =
    typeof params.processId === "string"
      ? params.processId
      : Array.isArray(params.processId)
        ? params.processId[0]
        : "";

  const loadProcess = useProcessStore((s) => s.loadProcess);
  const clearDetail = useProcessStore((s) => s.clearDetail);
  const current = useProcessStore((s) => s.current);
  const detailLoading = useProcessStore((s) => s.detailLoading);
  const detailError = useProcessStore((s) => s.detailError);
  const executeProcessAction = useProcessStore((s) => s.executeProcessAction);
  const executeLoading = useProcessStore((s) => s.executeLoading);
  const executeError = useProcessStore((s) => s.executeError);
  const executeSuccess = useProcessStore((s) => s.executeSuccess);
  const clearExecuteFeedback = useProcessStore((s) => s.clearExecuteFeedback);

  useEffect(() => {
    if (!processId) return;
    void loadProcess(processId);
    clearExecuteFeedback();
    return () => {
      clearDetail();
    };
  }, [processId, loadProcess, clearDetail, clearExecuteFeedback]);

  if (detailLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <p className="text-sm text-neutral-600">Carregando processo…</p>
        </div>
      </div>
    );
  }

  if (detailError) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-neutral-700 underline-offset-2 hover:underline"
          >
            ← Painel operacional
          </Link>
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {detailError}
          </div>
        </div>
      </div>
    );
  }

  if (!current) {
    return null;
  }

  const { process, state } = current;

  return (
    <div className="min-h-screen bg-neutral-50 pb-12">
      <ProcessShellHeader process={process} />

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <ProcessOperationalFocus state={state} />

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Identificação no domínio
          </h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-neutral-500">Criado em</dt>
              <dd className="mt-0.5 text-neutral-900">
                {formatIso(process.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Atualizado em</dt>
              <dd className="mt-0.5 text-neutral-900">
                {formatIso(process.updatedAt)}
              </dd>
            </div>
          </dl>
        </section>

        <ProcessOperationalStatus state={state} />
        <ProcessFlowActions
          state={state}
          executeLoading={executeLoading}
          executeError={executeError}
          executeSuccess={executeSuccess}
          onExecuteAction={executeProcessAction}
        />
        <ProcessStepOverview state={state} />
        <ProcessBlockings state={state} />
        <ProcessTechnicalDetails state={state} />
      </main>
    </div>
  );
}

function formatIso(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}
