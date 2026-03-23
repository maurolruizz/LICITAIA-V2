import { ModuleId } from '../../core/enums/module-id.enum';
import type {
  AdministrativeDecisionTrace,
  AdministrativeDecisionStep,
  SupportingElement,
  SupportingElementType,
} from './administrative-decision-trace.types';

type TargetType = 'process' | 'item' | 'lot';

type StructureLike = {
  moduleId?: ModuleId;
  structureType?: string;
  structure?: {
    items?: { id: string; description?: string }[];
    lots?: { id: string; description?: string; items?: { id: string; description?: string }[] }[];
  };
};

type NeedLike = {
  entries?: { targetType?: string; targetId?: string; problemDescription?: string; administrativeNeed?: string; expectedOutcome?: string; publicBenefit?: string }[];
};

type JustificationLike = {
  entries?: { targetType?: string; targetId?: string; problemStatement?: string; administrativeNeed?: string; expectedOutcome?: string; legalBasis?: string }[];
};

type StrategyLike = {
  entries?: { targetType?: string; targetId?: string; procurementModality?: string; divisionStrategy?: string; contractingJustification?: string; competitionStrategy?: string }[];
};

type CalculationLike = {
  entries?: { targetType?: string; targetId?: string; calculationType?: string; result?: unknown; formula?: string; justification?: string }[];
};

/** Element type for NeedLike.entries (avoids index signature issues under strict compilation). */
type NeedEntry = { targetType?: string; targetId?: string; problemDescription?: string; administrativeNeed?: string; expectedOutcome?: string; publicBenefit?: string };
/** Element type for CalculationLike.entries */
type CalculationEntry = { targetType?: string; targetId?: string; calculationType?: string; result?: unknown; formula?: string; justification?: string };
/** Element type for JustificationLike.entries */
type JustificationEntry = { targetType?: string; targetId?: string; problemStatement?: string; administrativeNeed?: string; expectedOutcome?: string; legalBasis?: string };
/** Element type for StrategyLike.entries */
type StrategyEntry = { targetType?: string; targetId?: string; procurementModality?: string; divisionStrategy?: string; contractingJustification?: string; competitionStrategy?: string };

type DocumentConsistencyLike = {
  hasIssues?: boolean;
  issueTypes?: string[];
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asString(value: unknown): string {
  if (value === undefined || value === null) return '';
  return typeof value === 'string' ? value : String(value);
}

function excerpt(value: unknown, max = 160): string {
  const t = asString(value).trim();
  if (!t) return '';
  return t.length <= max ? t : t.slice(0, max);
}

function stableGeneratedAt(): string {
  return new Date(0).toISOString();
}

function stableTraceId(moduleId: ModuleId, targetType: TargetType, targetId: string): string {
  return `TRACE:${moduleId}:${targetType}:${targetId}`;
}

function supportingElementId(type: SupportingElementType, referenceId: string): string {
  return `${type}:${referenceId}`;
}

function computePrefixByTarget(
  targetType: TargetType,
  targetId: string,
  structure: StructureLike
): { prefix: string; indexLabel: string } {
  if (targetType === 'process') return { prefix: 'process', indexLabel: 'process' };

  const structureType = asString(structure.structureType);
  const items = asArray<{ id: string }>(structure.structure?.items);
  const lots = asArray<{ id: string; items?: { id: string }[] }>(structure.structure?.lots);

  if (targetType === 'item') {
    if (structureType === 'multiple_items') {
      const idx = items.findIndex((i) => asString(i.id) === targetId);
      return { prefix: idx >= 0 ? `items[${idx}]` : `items[?]`, indexLabel: idx >= 0 ? String(idx) : '?' };
    }
    if (structureType === 'lot') {
      for (let l = 0; l < lots.length; l++) {
        const lot = lots[l]!;
        const lotItems = asArray<{ id: string }>(lot.items);
        const idx = lotItems.findIndex((i) => asString(i.id) === targetId);
        if (idx >= 0) return { prefix: `lots[${l}].items[${idx}]`, indexLabel: `${l}.${idx}` };
      }
      return { prefix: 'items[?]', indexLabel: '?' };
    }
    return { prefix: 'items[0]', indexLabel: '0' };
  }

  // lot
  if (structureType === 'lot') {
    const idx = lots.findIndex((l) => asString(l.id) === targetId);
    return { prefix: idx >= 0 ? `lots[${idx}]` : `lots[?]`, indexLabel: idx >= 0 ? String(idx) : '?' };
  }
  return { prefix: 'lots[?]', indexLabel: '?' };
}

function buildSupportingElementsForTarget(args: {
  targetType: TargetType;
  targetId: string;
  structure: StructureLike;
  need: NeedLike;
  calculation: CalculationLike;
  justification: JustificationLike;
  strategy: StrategyLike;
}): { elements: SupportingElement[]; idsByType: Record<string, string[]> } {
  const { targetType, targetId, structure, need, calculation, justification, strategy } = args;
  const { prefix, indexLabel } = computePrefixByTarget(targetType, targetId, structure);
  const targetRef = targetType === 'process' ? 'process' : `${targetType}:${indexLabel}`;

  const elements: SupportingElement[] = [];
  const idsByType: Record<string, string[]> = {
    need: [],
    structure: [],
    calculation: [],
    justification: [],
    strategy: [],
    coherence: [],
  };

  // STRUCTURE element (sempre existe como “evidência”, mesmo se vazio)
  {
    const referenceId = `structure:${targetRef}`;
    const id = supportingElementId('structure', referenceId);
    elements.push({
      id,
      type: 'structure',
      referenceId,
      sourceReference: `${prefix}.structure`,
      excerpt: excerpt(structure.structureType) || excerpt(structure.structure?.items?.length) || excerpt(structure.structure?.lots?.length),
    });
    idsByType.structure.push(id);
  }

  // NEED elements
  const needEntries = asArray<NeedEntry>(need.entries);
  const needMatches = needEntries
    .map((e, idx) => ({ e, idx }))
    .filter(({ e }) => {
      const tt = asString(e.targetType);
      const tid = asString(e.targetId);
      if (targetType === 'process') return tt === 'process';
      if (targetType === 'item') return tt === 'item' && tid === targetId;
      return tt === 'lot' && tid === targetId;
    });
  for (const { e, idx } of needMatches) {
    const referenceId = `need:${targetRef}`;
    const id = supportingElementId('need', `${referenceId}:${idx}`);
    const src = targetType === 'process'
      ? `process.administrativeNeed.entries[${idx}].problemDescription`
      : `${prefix}.administrativeNeed.entries[${idx}].problemDescription`;
    elements.push({
      id,
      type: 'need',
      referenceId,
      sourceReference: src,
      excerpt: excerpt(e.problemDescription) || excerpt(e.administrativeNeed) || excerpt(e.expectedOutcome) || excerpt(e.publicBenefit),
    });
    idsByType.need.push(id);
  }

  // CALCULATION elements
  const calcEntries = asArray<CalculationEntry>(calculation.entries);
  const calcMatches = calcEntries
    .map((e, idx) => ({ e, idx }))
    .filter(({ e }) => {
      const tt = asString(e.targetType).toUpperCase();
      const tid = asString(e.targetId);
      if (targetType === 'item') return tt === 'ITEM' && tid === targetId;
      if (targetType === 'lot') return tt === 'LOT' && tid === targetId;
      return false;
    });
  for (const { e, idx } of calcMatches) {
    const referenceId = `calc:${targetRef}`;
    const id = supportingElementId('calculation', `${referenceId}:${idx}`);
    const src = `${prefix}.calculationMemory.entries[${idx}].result`;
    elements.push({
      id,
      type: 'calculation',
      referenceId,
      sourceReference: src,
      excerpt: excerpt(e.result) || excerpt(e.calculationType) || excerpt(e.formula) || excerpt(e.justification),
    });
    idsByType.calculation.push(id);
  }

  // JUSTIFICATION elements
  const justEntries = asArray<JustificationEntry>(justification.entries);
  const justMatches = justEntries
    .map((e, idx) => ({ e, idx }))
    .filter(({ e }) => {
      const tt = asString(e.targetType);
      const tid = asString(e.targetId);
      if (targetType === 'process') return tt === 'process';
      if (targetType === 'item') return tt === 'item' && tid === targetId;
      return tt === 'lot' && tid === targetId;
    });
  for (const { e, idx } of justMatches) {
    const referenceId = `justification:${targetRef}`;
    const id = supportingElementId('justification', `${referenceId}:${idx}`);
    const src = targetType === 'process'
      ? `process.justification.entries[${idx}].problemStatement`
      : `${prefix}.justification.entries[${idx}].problemStatement`;
    elements.push({
      id,
      type: 'justification',
      referenceId,
      sourceReference: src,
      excerpt: excerpt(e.problemStatement) || excerpt(e.administrativeNeed) || excerpt(e.expectedOutcome) || excerpt(e.legalBasis),
    });
    idsByType.justification.push(id);
  }

  // STRATEGY elements
  const strategyEntries = asArray<StrategyEntry>(strategy.entries);
  const strategyMatches = strategyEntries
    .map((e, idx) => ({ e, idx }))
    .filter(({ e }) => {
      const tt = asString(e.targetType);
      const tid = asString(e.targetId);
      if (targetType === 'process') return tt === 'process';
      if (targetType === 'item') return (tt === 'item' && tid === targetId) || tt === 'process';
      return (tt === 'lot' && tid === targetId) || tt === 'process';
    });
  for (const { e, idx } of strategyMatches) {
    const referenceId = `strategy:${targetRef}`;
    const id = supportingElementId('strategy', `${referenceId}:${idx}`);
    const src = targetType === 'process'
      ? `process.strategy.entries[${idx}].procurementModality`
      : `${prefix}.strategy.entries[${idx}].procurementModality`;
    elements.push({
      id,
      type: 'strategy',
      referenceId,
      sourceReference: src,
      excerpt: excerpt(e.procurementModality) || excerpt(e.divisionStrategy) || excerpt(e.contractingJustification) || excerpt(e.competitionStrategy),
    });
    idsByType.strategy.push(id);
  }

  // COHERENCE evidence: não existe entrada explícita no input do motor (por especificação).
  // Para cumprir Regra 2 (evidência), o step de COHERENCE referencia elementos já existentes (structure/calculation/justification).
  idsByType.coherence = [...idsByType.structure, ...idsByType.calculation, ...idsByType.justification];

  return { elements, idsByType };
}

function buildStep(args: {
  stepType: AdministrativeDecisionStep['stepType'];
  description: string;
  sourceReference: string;
  supportingElementIds: string[];
}): AdministrativeDecisionStep {
  return {
    stepType: args.stepType,
    description: args.description,
    sourceReference: args.sourceReference,
    supportingElementIds: args.supportingElementIds,
  };
}

function hasAny(ids: string[]): boolean {
  return Array.isArray(ids) && ids.length > 0;
}

function isStrategyApplicableForTarget(targetType: TargetType, strategy: StrategyLike): boolean {
  const entries = asArray<StrategyEntry>(strategy.entries);
  if (entries.length === 0) return false;
  if (targetType === 'process') return true;
  return true;
}

function computeCompleteness(args: {
  targetType: TargetType;
  idsByType: Record<string, string[]>;
  strategy: StrategyLike;
}): { isComplete: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!hasAny(args.idsByType.need)) missing.push('need');
  if (!hasAny(args.idsByType.calculation) && args.targetType !== 'process') missing.push('calculation');
  if (!hasAny(args.idsByType.justification)) missing.push('justification');
  if (isStrategyApplicableForTarget(args.targetType, args.strategy) && !hasAny(args.idsByType.strategy)) missing.push('strategy');
  return { isComplete: missing.length === 0, missing };
}

function determineTargets(structure: StructureLike): { targetType: TargetType; targetId: string }[] {
  const targets: { targetType: TargetType; targetId: string }[] = [{ targetType: 'process', targetId: 'process' }];
  const structureType = asString(structure.structureType);
  const items = asArray<{ id: string }>(structure.structure?.items);
  const lots = asArray<{ id: string; items?: { id: string }[] }>(structure.structure?.lots);

  if (structureType === 'multiple_items') {
    for (const it of items) targets.push({ targetType: 'item', targetId: asString(it.id) });
  } else if (structureType === 'lot') {
    for (const lot of lots) {
      targets.push({ targetType: 'lot', targetId: asString(lot.id) });
      for (const it of asArray<{ id: string }>(lot.items)) targets.push({ targetType: 'item', targetId: asString(it.id) });
    }
  } else if (structureType === 'single_item') {
    // Não há id no extractor de single_item; não inventar. Apenas process.
  }

  return targets;
}

function summarizeDecision(args: {
  targetType: TargetType;
  targetId: string;
  idsByType: Record<string, string[]>;
  hasInconsistency: boolean;
  missing: string[];
}): string {
  const parts: string[] = [];
  parts.push(`target=${args.targetType}:${args.targetId}`);
  parts.push(`need=${args.idsByType.need.length}`);
  parts.push(`calc=${args.idsByType.calculation.length}`);
  parts.push(`just=${args.idsByType.justification.length}`);
  parts.push(`strategy=${args.idsByType.strategy.length}`);
  parts.push(`inconsistency=${args.hasInconsistency ? 'yes' : 'no'}`);
  parts.push(`complete=${args.missing.length === 0 ? 'yes' : 'no'}`);
  return parts.join(' | ');
}

export function executeAdministrativeDecisionTraceEngine(input: {
  structure: unknown;
  calculationMemory: unknown;
  administrativeNeed: unknown;
  administrativeJustification: unknown;
  procurementStrategy: unknown;
  documentConsistency: unknown;
}): AdministrativeDecisionTrace[] {
  const structure = (input.structure ?? {}) as StructureLike;
  const calculation = (input.calculationMemory ?? {}) as CalculationLike;
  const need = (input.administrativeNeed ?? {}) as NeedLike;
  const justification = (input.administrativeJustification ?? {}) as JustificationLike;
  const strategy = (input.procurementStrategy ?? {}) as StrategyLike;
  const documentConsistency = (input.documentConsistency ?? {}) as DocumentConsistencyLike;

  const moduleId = structure.moduleId ?? ModuleId.DFD;

  const hasInconsistency = Boolean(documentConsistency.hasIssues);
  const inconsistencyReasons = asArray<string>(documentConsistency.issueTypes).map(asString).filter((s) => s.length > 0);

  const traces: AdministrativeDecisionTrace[] = [];
  const targets = determineTargets(structure);

  for (const t of targets) {
    const { elements, idsByType } = buildSupportingElementsForTarget({
      targetType: t.targetType,
      targetId: t.targetId,
      structure,
      need,
      calculation,
      justification,
      strategy,
    });

    const completeness = computeCompleteness({ targetType: t.targetType, idsByType, strategy });

    const { prefix } = computePrefixByTarget(t.targetType, t.targetId, structure);
    const steps: AdministrativeDecisionStep[] = [
      buildStep({
        stepType: 'NEED',
        description: `NEED: ${idsByType.need.length} evidência(s).`,
        sourceReference: `${prefix}.administrativeNeed`,
        supportingElementIds: idsByType.need.length > 0 ? idsByType.need : [...idsByType.structure],
      }),
      buildStep({
        stepType: 'STRUCTURE',
        description: `STRUCTURE: structureType=${asString(structure.structureType) || 'unknown'}.`,
        sourceReference: `${prefix}.structure`,
        supportingElementIds: idsByType.structure,
      }),
      buildStep({
        stepType: 'CALCULATION',
        description: `CALCULATION: ${idsByType.calculation.length} evidência(s).`,
        sourceReference: `${prefix}.calculationMemory`,
        supportingElementIds: idsByType.calculation.length > 0 ? idsByType.calculation : [...idsByType.structure],
      }),
      buildStep({
        stepType: 'JUSTIFICATION',
        description: `JUSTIFICATION: ${idsByType.justification.length} evidência(s).`,
        sourceReference: `${prefix}.administrativeJustification`,
        supportingElementIds: idsByType.justification.length > 0 ? idsByType.justification : [...idsByType.structure],
      }),
      buildStep({
        stepType: 'COHERENCE',
        description: `COHERENCE: evidências referenciadas (structure+calculation+justification).`,
        sourceReference: `process.coherence`,
        supportingElementIds: idsByType.coherence,
      }),
      buildStep({
        stepType: 'STRATEGY',
        description: `STRATEGY: ${idsByType.strategy.length} evidência(s).`,
        sourceReference: `${prefix}.procurementStrategy`,
        supportingElementIds: idsByType.strategy.length > 0 ? idsByType.strategy : [...idsByType.structure],
      }),
    ];

    const trace: AdministrativeDecisionTrace = {
      traceId: stableTraceId(moduleId, t.targetType, t.targetId),
      moduleId,
      targetType: t.targetType,
      targetId: t.targetId,
      decisionSummary: summarizeDecision({
        targetType: t.targetType,
        targetId: t.targetId,
        idsByType,
        hasInconsistency,
        missing: completeness.missing,
      }),
      decisionSteps: steps,
      supportingElements: elements,
      hasInconsistency,
      inconsistencyReasons: hasInconsistency ? inconsistencyReasons : undefined,
      isComplete: completeness.isComplete,
      generatedAt: stableGeneratedAt(),
    };

    traces.push(trace);
  }

  // determinismo: ordenação estável por (targetType, targetId)
  traces.sort((a, b) => {
    const t = a.targetType.localeCompare(b.targetType);
    if (t !== 0) return t;
    return a.targetId.localeCompare(b.targetId);
  });

  return traces;
}

