import type {
  AdministrativeDecisionTrace,
  AdministrativeDecisionStep,
  SupportingElement,
} from './administrative-decision-trace.types';
import type {
  AdministrativeDecisionExplanation,
  ExplanationBlock,
  ExplanationBlockType,
} from './administrative-decision-explanation.types';

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asString(value: unknown): string {
  if (value === undefined || value === null) return '';
  return typeof value === 'string' ? value : String(value);
}

function stableGeneratedAt(): string {
  return new Date(0).toISOString();
}

function stableExplanationId(trace: AdministrativeDecisionTrace): string {
  return `EXPLAIN:${trace.moduleId}:${trace.targetType}:${trace.targetId}`;
}

function mapStepTypeToBlockType(stepType: AdministrativeDecisionStep['stepType']): ExplanationBlockType {
  return stepType;
}

function buildBlockDescription(step: AdministrativeDecisionStep, elementsById: Map<string, SupportingElement>): string {
  const ids = asArray<string>(step.supportingElementIds).map(asString).filter((s) => s.length > 0);
  const excerpts = ids
    .map((id) => elementsById.get(id))
    .filter((e): e is SupportingElement => Boolean(e))
    .map((e) => asString(e.excerpt).trim())
    .filter((t) => t.length > 0);

  const base = asString(step.description).trim();
  if (excerpts.length === 0) return base;
  return `${base} | ${excerpts.join(' ; ')}`;
}

function buildSummary(blocks: ExplanationBlock[]): string {
  return blocks
    .map((b) => `${b.blockType}: ${asString(b.description).trim()}`)
    .filter((s) => s.length > 0)
    .join(' | ');
}

function buildExplanationForTrace(trace: AdministrativeDecisionTrace): AdministrativeDecisionExplanation {
  const supportingElements = asArray<SupportingElement>(trace.supportingElements);
  const elementsById = new Map<string, SupportingElement>();
  for (const el of supportingElements) {
    const id = asString(el?.id).trim();
    if (id) elementsById.set(id, el);
  }

  const steps = asArray<AdministrativeDecisionStep>(trace.decisionSteps);
  const blocks: ExplanationBlock[] = steps.map((step) => {
    const blockType = mapStepTypeToBlockType(step.stepType);
    const supportingReferences = asArray<string>(step.supportingElementIds)
      .map(asString)
      .filter((s) => s.length > 0);

    return {
      blockType,
      title: blockType,
      description: buildBlockDescription(step, elementsById),
      supportingReferences,
    };
  });

  return {
    explanationId: stableExplanationId(trace),
    targetType: trace.targetType,
    targetId: trace.targetId,
    summary: buildSummary(blocks),
    explanationBlocks: blocks,
    hasInconsistency: Boolean(trace.hasInconsistency),
    hasIncomplete: !Boolean(trace.isComplete),
    generatedAt: stableGeneratedAt(),
  };
}

export function executeAdministrativeDecisionExplanationEngine(
  traces: AdministrativeDecisionTrace[]
): AdministrativeDecisionExplanation[] {
  const safe = asArray<AdministrativeDecisionTrace>(traces);

  // Agrupar por target (process/item/lot). Em cenários normais, já existe 1 trace por target,
  // mas o motor deve ser estável se múltiplos traces forem fornecidos.
  const byTarget = new Map<string, AdministrativeDecisionTrace[]>();
  for (const t of safe) {
    const key = `${asString(t.targetType)}:${asString(t.targetId)}`;
    const list = byTarget.get(key) ?? [];
    list.push(t);
    byTarget.set(key, list);
  }

  const explanations: AdministrativeDecisionExplanation[] = [];
  const keys = Array.from(byTarget.keys()).sort((a, b) => a.localeCompare(b));
  for (const key of keys) {
    const group = byTarget.get(key) ?? [];
    // determinismo: escolher sempre o primeiro trace pela ordenação estável de moduleId
    group.sort((a, b) => asString(a.moduleId).localeCompare(asString(b.moduleId)));
    const chosen = group[0];
    if (!chosen) continue;
    explanations.push(buildExplanationForTrace(chosen));
  }

  // determinismo: ordenação estável por (targetType, targetId)
  explanations.sort((a, b) => {
    const t = a.targetType.localeCompare(b.targetType);
    if (t !== 0) return t;
    return a.targetId.localeCompare(b.targetId);
  });

  return explanations;
}

