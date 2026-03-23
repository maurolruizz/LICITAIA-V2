/**
 * Fase 31 — Motor de Consolidação de Documentos Administrativos.
 * Documento ancorado no TRACE (base). Estrutura/conteúdo das seções da explanation.
 * Se não houver trace correspondente ao target → não gera document.
 */

import { ModuleId } from '../../core/enums/module-id.enum';
import type { AdministrativeDecisionTrace } from './administrative-decision-trace.types';
import type {
  AdministrativeDecisionExplanation,
  ExplanationBlock,
  ExplanationBlockType,
} from './administrative-decision-explanation.types';
import type {
  AdministrativeDocumentModel,
  DocumentSection,
  DocumentSectionType,
} from './administrative-document.types';
import { DOCUMENT_STRUCTURE_RULES, type DocumentClassificationContext } from './administrative-document-structure';

const SECTION_ORDER: DocumentSectionType[] = [
  'IDENTIFICATION',
  'NEED',
  'STRUCTURE',
  'CALCULATION',
  'JUSTIFICATION',
  'STRATEGY',
  'COHERENCE',
];

const STABLE_GENERATED_AT = new Date(0).toISOString();

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asString(value: unknown): string {
  if (value === undefined || value === null) return '';
  return typeof value === 'string' ? value : String(value);
}

function readValueByPath(snapshot: Record<string, unknown>, path: string): unknown {
  if (path.includes('.')) {
    const chunks = path.split('.');
    let cursor: unknown = snapshot;
    for (const chunk of chunks) {
      if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor)) return undefined;
      cursor = (cursor as Record<string, unknown>)[chunk];
    }
    return cursor;
  }
  return snapshot[path];
}

function toPrintable(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.length > 0 ? JSON.stringify(value) : '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function extractFromSnapshot(snapshot: Record<string, unknown>, paths: string[]): string {
  const values: string[] = [];
  for (const path of paths) {
    if (path.startsWith('trace.') || path === 'validations') continue;
    const raw = readValueByPath(snapshot, path);
    const printable = toPrintable(raw);
    if (printable !== '') values.push(`${path}=${printable}`);
  }
  return values.join(' | ').trim();
}

function targetKey(targetType: string, targetId: string): string {
  return `${asString(targetType)}:${asString(targetId)}`;
}

function stableDocumentId(moduleId: ModuleId, targetType: 'process' | 'item' | 'lot', targetId: string): string {
  return `DOC:${moduleId}:${targetType}:${targetId}`;
}

function buildIdentificationContent(moduleId: ModuleId, targetType: string, targetId: string): string {
  return `moduleId=${asString(moduleId)} | targetType=${targetType} | targetId=${targetId}`;
}

function blockTypeToSectionType(blockType: ExplanationBlockType): DocumentSectionType {
  return blockType;
}

function getBlockByType(blocks: ExplanationBlock[], sectionType: DocumentSectionType): ExplanationBlock | undefined {
  return blocks.find((b) => blockTypeToSectionType(b.blockType) === sectionType);
}

function buildClassificationContext(
  snapshot: Record<string, unknown>,
  targetType: 'process' | 'item' | 'lot'
): DocumentClassificationContext {
  const legalRegime = asString(snapshot['legalRegime']).toUpperCase();
  const objectType = asString(snapshot['objectType']).toUpperCase();
  const objectStructure = asString(snapshot['objectStructure']).toUpperCase();
  const executionForm = asString(snapshot['executionForm']).toUpperCase();
  const hasCalculationData =
    Boolean(snapshot['calculationMemory']) ||
    (Array.isArray(snapshot['calculationMemories']) && snapshot['calculationMemories'].length > 0);
  const hasPricingData =
    snapshot['estimatedUnitValue'] !== undefined ||
    snapshot['estimatedTotalValue'] !== undefined ||
    Boolean(snapshot['pricingSourceDescription']) ||
    Boolean(snapshot['pricingJustification']);
  return {
    legalRegime,
    objectType,
    objectStructure,
    executionForm,
    targetType,
    hasCalculationData,
    hasPricingData,
  };
}

function buildSectionContent(
  sectionType: DocumentSectionType,
  moduleId: ModuleId,
  targetType: string,
  targetId: string,
  blocks: ExplanationBlock[],
  snapshot: Record<string, unknown>,
  ruleSourcePaths: string[],
  hasInconsistency: boolean,
  isComplete: boolean
): string {
  if (sectionType === 'IDENTIFICATION') {
    return buildIdentificationContent(moduleId, targetType, targetId);
  }
  if (sectionType === 'COHERENCE') {
    return `trace.hasInconsistency=${hasInconsistency} | trace.isComplete=${isComplete}`;
  }
  const block = getBlockByType(blocks, sectionType);
  if (block) {
    return asString(block.description).trim();
  }
  return extractFromSnapshot(snapshot, ruleSourcePaths);
}

function buildSection(
  sectionType: DocumentSectionType,
  moduleId: ModuleId,
  targetType: string,
  targetId: string,
  blocks: ExplanationBlock[],
  processSnapshot: Record<string, unknown>,
  hasInconsistency: boolean,
  isComplete: boolean
): DocumentSection {
  const rule = DOCUMENT_STRUCTURE_RULES[moduleId][sectionType];
  const classification = buildClassificationContext(processSnapshot, targetType as 'process' | 'item' | 'lot');
  const block = getBlockByType(blocks, sectionType);
  let applicability = rule.getApplicability(classification);
  if (applicability === 'not_applicable' && block) {
    applicability = 'conditional';
  }
  const isApplicable = applicability === 'required' || applicability === 'conditional';
  const content = isApplicable
    ? buildSectionContent(
        sectionType,
        moduleId,
        targetType,
        targetId,
        blocks,
        processSnapshot,
        rule.sourcePaths,
        hasInconsistency,
        isComplete
      )
    : '';
  return {
    sectionType,
    blockId: rule.blockId,
    title: rule.title,
    content,
    supportingReferences: block ? [...asArray<string>(block.supportingReferences).map(asString)] : [],
    sourceOfTruth: rule.sourceOfTruth,
    sourcePaths: rule.sourcePaths,
    coherenceChecks: rule.coherenceChecks,
    applicability: isApplicable ? applicability : 'not_applicable',
  };
}

/**
 * Constrói um documento a partir do trace (base) e da explanation (estrutura das seções).
 * moduleId, targetType, targetId e flags vêm do trace.
 */
function buildDocumentForTrace(
  trace: AdministrativeDecisionTrace,
  explanation: AdministrativeDecisionExplanation | undefined,
  processSnapshot: Record<string, unknown>
): AdministrativeDocumentModel {
  const blocks = explanation ? asArray<ExplanationBlock>(explanation.explanationBlocks) : [];
  const sections: DocumentSection[] = SECTION_ORDER.map((sectionType) =>
    buildSection(
      sectionType,
      trace.moduleId,
      trace.targetType,
      trace.targetId,
      blocks,
      processSnapshot,
      Boolean(trace.hasInconsistency),
      Boolean(trace.isComplete)
    )
  );

  return {
    documentId: stableDocumentId(trace.moduleId, trace.targetType, trace.targetId),
    moduleId: trace.moduleId,
    targetType: trace.targetType,
    targetId: trace.targetId,
    sections,
    hasInconsistency: Boolean(trace.hasInconsistency),
    hasIncomplete: !Boolean(trace.isComplete),
    generatedAt: STABLE_GENERATED_AT,
  };
}

/**
 * Agrupa traces por target (targetType + targetId). Para cada target, escolhe um trace
 * de forma determinística (ordena por moduleId, toma o primeiro).
 * Só gera document quando existe trace para o target.
 */
export function executeAdministrativeDocumentEngine(
  traces: AdministrativeDecisionTrace[],
  explanations: AdministrativeDecisionExplanation[],
  processSnapshot: Record<string, unknown> = {}
): AdministrativeDocumentModel[] {
  const safeTraces = asArray<AdministrativeDecisionTrace>(traces);
  const safeExplanations = asArray<AdministrativeDecisionExplanation>(explanations);

  const byTarget = new Map<string, AdministrativeDecisionTrace[]>();
  for (const t of safeTraces) {
    const key = targetKey(t.targetType, t.targetId);
    const list = byTarget.get(key) ?? [];
    list.push(t);
    byTarget.set(key, list);
  }

  const explanationByTarget = new Map<string, AdministrativeDecisionExplanation>();
  for (const e of safeExplanations) {
    explanationByTarget.set(targetKey(e.targetType, e.targetId), e);
  }

  const documents: AdministrativeDocumentModel[] = [];
  const keys = Array.from(byTarget.keys()).sort((a, b) => a.localeCompare(b));
  for (const key of keys) {
    const group = byTarget.get(key) ?? [];
    group.sort((a, b) => asString(a.moduleId).localeCompare(asString(b.moduleId)));
    const trace = group[0];
    if (!trace) continue;
    const explanation = explanationByTarget.get(key);
    documents.push(buildDocumentForTrace(trace, explanation, processSnapshot));
  }

  documents.sort((a, b) => {
    const t = a.targetType.localeCompare(b.targetType);
    if (t !== 0) return t;
    return a.targetId.localeCompare(b.targetId);
  });

  return documents;
}
