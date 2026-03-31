import {
  FLOW_STEP_ORDER,
  type FlowStep,
  type ImmutableHistoryItem,
  type OperationalStateContract,
  type StepFieldId,
} from './flow-controller.types';
import { getRequiredFieldsForStep, getStepFieldSpec } from './flow-step-definitions';

const SCHEMA_VERSION = '1.0.0';
const FIELD_CATALOG_VERSION = '1.0.0';

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function createSha256(value: unknown): string {
  const input = stableStringify(value);
  const rightRotate = (n: number, x: number) => (x >>> n) | (x << (32 - n));
  const words: number[] = [];
  const inputBytes = unescape(encodeURIComponent(input));
  const bitLength = inputBytes.length * 8;
  for (let i = 0; i < inputBytes.length; i += 1) {
    const j = i >> 2;
    words[j] = (words[j] ?? 0) | (inputBytes.charCodeAt(i) << (24 - (i % 4) * 8));
  }
  const lastIndex = inputBytes.length >> 2;
  words[lastIndex] = (words[lastIndex] ?? 0) | (0x80 << (24 - (inputBytes.length % 4) * 8));
  words[((inputBytes.length + 8) >> 6 << 4) + 15] = bitLength;

  const hash = [
    0x6a09e667,
    0xbb67ae85,
    0x3c6ef372,
    0xa54ff53a,
    0x510e527f,
    0x9b05688c,
    0x1f83d9ab,
    0x5be0cd19,
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
    0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
    0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
    0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
    0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
    0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
    0xc67178f2,
  ];
  const w = new Array<number>(64);

  for (let i = 0; i < words.length; i += 16) {
    for (let t = 0; t < 16; t += 1) w[t] = words[i + t] ?? 0;
    for (let t = 16; t < 64; t += 1) {
      const s0 = rightRotate(7, w[t - 15]) ^ rightRotate(18, w[t - 15]) ^ (w[t - 15] >>> 3);
      const s1 = rightRotate(17, w[t - 2]) ^ rightRotate(19, w[t - 2]) ^ (w[t - 2] >>> 10);
      w[t] = (((w[t - 16] + s0) | 0) + ((w[t - 7] + s1) | 0)) | 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let t = 0; t < 64; t += 1) {
      const s1 = rightRotate(6, e) ^ rightRotate(11, e) ^ rightRotate(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (((((h + s1) | 0) + ((ch + k[t]) | 0)) | 0) + w[t]) | 0;
      const s0 = rightRotate(2, a) ^ rightRotate(13, a) ^ rightRotate(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }
  return hash.map((n) => (n >>> 0).toString(16).padStart(8, '0')).join('');
}

function buildStepFields(step: FlowStep) {
  return getRequiredFieldsForStep(step).map((fieldId: StepFieldId) => ({
    fieldId,
    value: null,
    isValid: null,
    validationTrace: null,
  }));
}

export function createMetadataHash(event: Omit<ImmutableHistoryItem, 'metadataHash'>): string {
  return createSha256(event);
}

export function createInitialOperationalState(processId: string): OperationalStateContract {
  const now = new Date().toISOString();
  const initFields = buildStepFields('INIT');

  const state: OperationalStateContract = {
    schemaVersion: SCHEMA_VERSION,
    fieldCatalogVersion: FIELD_CATALOG_VERSION,
    processId,
    flowVersion: 'v1',
    revision: 1,
    generatedAt: now,
    stepOrder: [...FLOW_STEP_ORDER] as [
      FlowStep,
      FlowStep,
      FlowStep,
      FlowStep,
      FlowStep,
      FlowStep,
      FlowStep,
      FlowStep,
      FlowStep,
    ],
    currentStep: 'INIT',
    stepStatusMap: {
      INIT: 'IN_PROGRESS',
      CONTEXT: 'LOCKED',
      REGIME: 'LOCKED',
      DFD: 'LOCKED',
      ETP: 'LOCKED',
      TR: 'LOCKED',
      PRICING: 'LOCKED',
      REVIEW: 'LOCKED',
      OUTPUT: 'LOCKED',
    },
    allowedActions: ['EDIT_CURRENT_STEP', 'SAVE_CURRENT_STEP'],
    nextRequiredAction: 'FILL_REQUIRED_FIELDS',
    activeBlockings: [],
    snapshots: {
      INIT: null,
      CONTEXT: null,
      REGIME: null,
      DFD: null,
      ETP: null,
      TR: null,
      PRICING: null,
      REVIEW: null,
      OUTPUT: null,
    },
    immutableHistory: [],
    reviewResult: { phase: 'PRE_REVIEW' },
    currentStepForm: {
      mode: 'CONDUCTION_STEP_FORM',
      step: 'INIT',
      formId: 'FORM_COND_INIT_V1',
      stepTitleMessageKey: 'CONDUCAO_STEP_INIT',
      stepInstructionMessageKey: 'CONDUCAO_INSTRUCTION_FILL_REQUIRED_FIELDS',
      fields: initFields.map((state) => ({
        spec: getStepFieldSpec(state.fieldId),
        state,
      })),
    },
    renderToken: '',
  };
  state.renderToken = createRenderToken(state);
  return state;
}

export function createRenderToken(state: OperationalStateContract): string {
  const activeBlockingsCanonical = state.activeBlockings
    .map((blocking) => ({
      code: blocking.code,
      severity: blocking.severity,
      origin: blocking.origin,
      step: blocking.step,
      messageKey: blocking.messageKey,
      detailsHash: createSha256(blocking.details),
    }))
    .sort((a, b) => {
      const left = `${a.code}|${a.step}|${a.detailsHash}`;
      const right = `${b.code}|${b.step}|${b.detailsHash}`;
      return left.localeCompare(right);
    });

  const reviewResultCanonical =
    state.reviewResult.phase === 'PRE_REVIEW'
      ? { phase: 'PRE_REVIEW' as const }
      : {
          phase: 'POST_REVIEW' as const,
          finalStatus: state.reviewResult.finalStatus,
          validationsCanonical: state.reviewResult.validations.map((validation) => ({
            issueTraceFingerprint: createSha256((validation.issueTrace ?? []).join('|')),
            severity: validation.severity,
          })),
          executedModules: state.reviewResult.executedModules,
          reviewSnapshotHash: state.reviewResult.reviewSnapshotHash,
        };

  const basis = {
    schemaVersion: state.schemaVersion,
    fieldCatalogVersion: state.fieldCatalogVersion,
    processId: state.processId,
    flowVersion: state.flowVersion,
    revision: state.revision,
    currentStep: state.currentStep,
    stepStatusMap: state.stepStatusMap,
    allowedActions: [...state.allowedActions].sort(),
    nextRequiredAction: state.nextRequiredAction,
    currentStepFormCanonicalHash: createSha256(state.currentStepForm),
    activeBlockingsCanonical,
    reviewResultCanonical,
  };
  return createSha256(basis);
}

