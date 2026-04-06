/**
 * Deriva apenas leitura para UI a partir do snapshot retornado pelo backend
 * (flowSession.snapshot — mesmo formato que o FlowController expõe em getState()).
 * Não aplica regra de negócio; só lê chaves quando existem e tipos são coerentes.
 */

export type FlowBlockingItem = {
  code?: string;
  severity?: string;
  step?: string;
  messageKey?: string;
  origin?: string;
  details?: unknown;
};

export type FlowSnapshotView = {
  currentStep: string | null;
  revision: number | null;
  renderTokenPreview: string | null;
  schemaVersion: string | null;
  nextRequiredAction: string | null;
  allowedActions: string[];
  activeBlockings: FlowBlockingItem[];
  reviewPhase: string | null;
  stepStatusEntries: Array<{ step: string; status: string }>;
};

const STEP_LABELS: Record<string, string> = {
  INIT: "Inicialização",
  CONTEXT: "Contexto institucional",
  REGIME: "Regime",
  DFD: "DFD",
  ETP: "ETP",
  TR: "Termo de Referência",
  PRICING: "Pesquisa de preços",
  REVIEW: "Revisão",
  OUTPUT: "Saída",
};

export function labelForStep(code: string | null): string | null {
  if (!code) return null;
  return STEP_LABELS[code] ?? code;
}

function emptyView(): FlowSnapshotView {
  return {
    currentStep: null,
    revision: null,
    renderTokenPreview: null,
    schemaVersion: null,
    nextRequiredAction: null,
    allowedActions: [],
    activeBlockings: [],
    reviewPhase: null,
    stepStatusEntries: [],
  };
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

export function deriveFlowSnapshotView(
  state: Record<string, unknown> | null | undefined,
): FlowSnapshotView {
  if (!state) return emptyView();

  const revision =
    typeof state.revision === "number"
      ? state.revision
      : typeof state.revision === "string"
        ? Number(state.revision)
        : null;

  const rt =
    typeof state.renderToken === "string" && state.renderToken.length > 0
      ? state.renderToken.length > 24
        ? `${state.renderToken.slice(0, 12)}…${state.renderToken.slice(-8)}`
        : state.renderToken
      : null;

  const schemaVersion =
    typeof state.schemaVersion === "string"
      ? state.schemaVersion
      : typeof state["_schemaVersion"] === "string"
        ? (state["_schemaVersion"] as string)
        : null;

  const currentStep = typeof state.currentStep === "string" ? state.currentStep : null;

  const nextRequiredAction =
    typeof state.nextRequiredAction === "string" ? state.nextRequiredAction : null;

  const allowedActions = Array.isArray(state.allowedActions)
    ? state.allowedActions.filter((a): a is string => typeof a === "string")
    : [];

  const activeBlockings: FlowBlockingItem[] = Array.isArray(state.activeBlockings)
    ? state.activeBlockings.map((b) => {
        const r = asRecord(b);
        if (!r) return {};
        return {
          code: typeof r.code === "string" ? r.code : undefined,
          severity: typeof r.severity === "string" ? r.severity : undefined,
          step: typeof r.step === "string" ? r.step : undefined,
          messageKey: typeof r.messageKey === "string" ? r.messageKey : undefined,
          origin: typeof r.origin === "string" ? r.origin : undefined,
          details: r.details,
        };
      })
    : [];

  let reviewPhase: string | null = null;
  const rr = asRecord(state.reviewResult);
  if (rr && typeof rr.phase === "string") {
    reviewPhase = rr.phase;
  }

  const stepStatusEntries: Array<{ step: string; status: string }> = [];
  const sm = asRecord(state.stepStatusMap);
  if (sm) {
    for (const [step, status] of Object.entries(sm)) {
      if (typeof status === "string") {
        stepStatusEntries.push({ step, status });
      }
    }
  }

  return {
    currentStep,
    revision: Number.isFinite(revision as number) ? (revision as number) : null,
    renderTokenPreview: rt,
    schemaVersion,
    nextRequiredAction,
    allowedActions,
    activeBlockings,
    reviewPhase,
    stepStatusEntries,
  };
}
