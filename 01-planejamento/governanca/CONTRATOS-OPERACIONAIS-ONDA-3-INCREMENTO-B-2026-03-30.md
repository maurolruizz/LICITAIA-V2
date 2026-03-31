# CONTRATOS OPERACIONAIS — ONDA 3 — INCREMENTO B (CANONICO)

## 1. Identificacao

| Campo | Conteudo |
|--------|-----------|
| **Nome do artefato** | Contratos operacionais canônicos — Onda 3 — Incremento B |
| **Data de emissao** | 2026-03-30 |
| **Sistema** | DECYON V2 / LICITAIA V2 |
| **Objetivo do documento** | Congelar **todos** os contratos e catálogos operacionais necessários para a condução operacional da Onda 3, de modo que a UI **não** interprete regras e que qualquer bloqueio sempre possua ação corretiva e mensagem institucional associada. |
| **Vinculo com Onda 3** | A Onda 3 é a camada de condução operacional e o FlowController é uma máquina de estados determinística do processo administrativo. A base técnica do FlowController (v1) está encerrada em 10/10; este documento congela contratos para a continuidade. |
| **Vinculo com Plano Mestre / Matriz** | Respeita a fronteira da Etapa E / Frente 6: UI conduz, não decide; comportamento vem do núcleo e do FlowController. |

## 2. Regra de escopo (sem código de lógica)

Este documento define apenas contratos (forma estrutural canônica), enumerações fechadas, catálogos canônicos e semântica determinística de sincronização. Nenhuma regra jurídica, validação ou lógica de negócio é criada neste arquivo.

## 2.1 Catálogo derivado de campos (versionado e auditável)

O mapeamento `StepFieldId` → pares `(labelMessageKey, helpMessageKey)` é **finito**, **explícito** e **versionado** independentemente do `schemaVersion` do estado operacional, para permitir auditoria de alterações apenas no dicionário de UI de campos.

| Constante | Semântica | Formato |
|-----------|-----------|---------|
| `fieldCatalogVersion` | Versão do catálogo de campos e das chaves `CONDUCAO_FIELD_*` | SemVer `MAJOR.MINOR.PATCH` |

Regras de evolução de `fieldCatalogVersion`:

1. **MAJOR**: remoção ou renomeação de qualquer `StepFieldId`; remoção de qualquer `MessageKey` de campo; alteração de etapa permitida de um `StepFieldId`.
2. **MINOR**: inclusão de novo `StepFieldId` e das correspondentes entradas na tabela 2.2; inclusão de novas chaves `MessageKey` exclusivamente para o novo campo.
3. **PATCH**: correção textual institucional sem mudança de semântica (a chave permanece a mesma; o conteúdo resolvido no pacote de internacionalização é que muda).

`OperationalStateContract` inclui obrigatoriamente `fieldCatalogVersion` (ver seção 3.2).

### 2.2 Tabela canônica `StepFieldId` → label / help (fechada)

| StepFieldId | Etapa aplicável (`FlowStep`) | labelMessageKey | helpMessageKey |
|-------------|------------------------------|-----------------|----------------|
| `INIT_CONFIRM` | INIT | `CONDUCAO_FIELD_LABEL_INIT_CONFIRM` | `CONDUCAO_FIELD_HELP_INIT_CONFIRM` |
| `CTX_TENANT_SLUG` | CONTEXT | `CONDUCAO_FIELD_LABEL_CTX_TENANT_SLUG` | `CONDUCAO_FIELD_HELP_CTX_TENANT_SLUG` |
| `CTX_OPERATOR_NOTE` | CONTEXT | `CONDUCAO_FIELD_LABEL_CTX_OPERATOR_NOTE` | `CONDUCAO_FIELD_HELP_CTX_OPERATOR_NOTE` |
| `REG_LEGAL_REGIME` | REGIME | `CONDUCAO_FIELD_LABEL_REG_LEGAL_REGIME` | `CONDUCAO_FIELD_HELP_REG_LEGAL_REGIME` |
| `REG_PROCUREMENT_STRATEGY` | REGIME | `CONDUCAO_FIELD_LABEL_REG_PROCUREMENT_STRATEGY` | `CONDUCAO_FIELD_HELP_REG_PROCUREMENT_STRATEGY` |
| `DFD_OBJECT_TYPE` | DFD | `CONDUCAO_FIELD_LABEL_DFD_OBJECT_TYPE` | `CONDUCAO_FIELD_HELP_DFD_OBJECT_TYPE` |
| `DFD_OBJECT_STRUCTURE` | DFD | `CONDUCAO_FIELD_LABEL_DFD_OBJECT_STRUCTURE` | `CONDUCAO_FIELD_HELP_DFD_OBJECT_STRUCTURE` |
| `ETP_STRATEGY_NOTE` | ETP | `CONDUCAO_FIELD_LABEL_ETP_STRATEGY_NOTE` | `CONDUCAO_FIELD_HELP_ETP_STRATEGY_NOTE` |
| `TR_TERMS_NOTE` | TR | `CONDUCAO_FIELD_LABEL_TR_TERMS_NOTE` | `CONDUCAO_FIELD_HELP_TR_TERMS_NOTE` |
| `PRC_BASE_VALUE` | PRICING | `CONDUCAO_FIELD_LABEL_PRC_BASE_VALUE` | `CONDUCAO_FIELD_HELP_PRC_BASE_VALUE` |

Conjunto finito de `StepFieldId` válidos **por etapa** (derivado mecanicamente da coluna «Etapa aplicável»):

- `INIT`: apenas `INIT_CONFIRM`
- `CONTEXT`: `CTX_TENANT_SLUG`, `CTX_OPERATOR_NOTE`
- `REGIME`: `REG_LEGAL_REGIME`, `REG_PROCUREMENT_STRATEGY`
- `DFD`: `DFD_OBJECT_TYPE`, `DFD_OBJECT_STRUCTURE`
- `ETP`: `ETP_STRATEGY_NOTE`
- `TR`: `TR_TERMS_NOTE`
- `PRICING`: `PRC_BASE_VALUE`
- `REVIEW`, `OUTPUT`: nenhum `StepFieldId` (painéis dedicados; ver `CurrentStepFormContract`)

Regra de fechamento: **não** existe `labelMessageKey` ou `helpMessageKey` fora das chaves listadas na coluna desta tabela para campos de condução. A UI **não** concatena identificadores para formar chaves.

### 2.3 Mapeamento fechado `FlowStep` (condução) → `ConductionFormId`

| FlowStep | ConductionFormId obrigatório |
|----------|-------------------------------|
| INIT | `FORM_COND_INIT_V1` |
| CONTEXT | `FORM_COND_CONTEXT_V1` |
| REGIME | `FORM_COND_REGIME_V1` |
| DFD | `FORM_COND_DFD_V1` |
| ETP | `FORM_COND_ETP_V1` |
| TR | `FORM_COND_TR_V1` |
| PRICING | `FORM_COND_PRICING_V1` |

Invariante: em todo `StepFormConductionContract`, o par `(step, formId)` deve coincidir com exatamente uma linha desta tabela.

## 3. OperationalStateContract (forma canônica, tipagem fechada)

### 3.1 Enumeracoes fechadas

```ts
/* Fluxo v1 obrigatório da Onda 3 */
export type FlowStep =
  | 'INIT'
  | 'CONTEXT'
  | 'REGIME'
  | 'DFD'
  | 'ETP'
  | 'TR'
  | 'PRICING'
  | 'REVIEW'
  | 'OUTPUT';

export type FlowVersion = 'v1';

export type StepStatus =
  | 'LOCKED'
  | 'AVAILABLE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'INVALIDATED';

export type BlockingSeverity = 'HARD' | 'SOFT';

export type BlockingOrigin = 'MOTOR' | 'FLUXO' | 'UI';

/* Ações permitidas explicitamente no contrato (UI) */
export type AllowedAction =
  | 'EDIT_CURRENT_STEP'
  | 'SAVE_CURRENT_STEP'
  | 'ADVANCE_TO_NEXT_STEP'
  | 'RETURN_TO_PREVIOUS_STEP'
  | 'TRIGGER_REVIEW'
  | 'VIEW_OUTPUT';

/* Próxima ação requerida (determinística; UI) */
export type NextRequiredAction =
  | 'FILL_REQUIRED_FIELDS'
  | 'RESOLVE_BLOCKINGS'
  | 'RUN_REVIEW'
  | 'VIEW_RESULT';

export type RenderToken = string;

/* Códigos de bloqueio: catálogo estritamente fechado */
export type FlowBlockingCode =
  | 'FLOW_INVALID_TRANSITION'
  | 'FLOW_REVIEW_NOT_AVAILABLE'
  | 'FLOW_OUTPUT_NOT_AVAILABLE'
  | 'FLOW_REGIME_FROZEN'
  | 'FLOW_INVALIDATED_DOWNSTREAM';

export type UiBlockingCode =
  | 'UI_STATE_STALE'
  | 'UI_RENDER_TOKEN_MISMATCH_ON_COMMAND';

export type MotorBlockingCode =
  | 'MOTOR_HALTED_BY_VALIDATION'
  | 'MOTOR_HALTED_BY_DEPENDENCY'
  | 'MOTOR_HALTED_BY_MODULE'
  | 'MOTOR_CLASSIFICATION_PREFLIGHT';

export type BlockingReasonCode = FlowBlockingCode | UiBlockingCode | MotorBlockingCode;

/* Motivo normativo fechado para invalidação em cadeia; traços opacos do motor permanecem em details */
export type FlowInvalidationReasonCode =
  | 'INVALIDATION_EXPLICIT_SEGMENT_RESET'
  | 'INVALIDATION_REGIME_OR_CONTEXT_REOPEN';

/* Catálogo fechado de MessageKey */
export type MessageKey =
  /* Títulos de etapa */
  | 'CONDUCAO_STEP_INIT'
  | 'CONDUCAO_STEP_CONTEXT'
  | 'CONDUCAO_STEP_REGIME'
  | 'CONDUCAO_STEP_DFD'
  | 'CONDUCAO_STEP_ETP'
  | 'CONDUCAO_STEP_TR'
  | 'CONDUCAO_STEP_PRICING'
  | 'CONDUCAO_STEP_REVIEW'
  | 'CONDUCAO_STEP_OUTPUT'
  /* Instruções globais */
  | 'CONDUCAO_INSTRUCTION_FILL_REQUIRED_FIELDS'
  | 'CONDUCAO_INSTRUCTION_RESOLVE_BLOCKINGS'
  | 'CONDUCAO_INSTRUCTION_RUN_REVIEW'
  | 'CONDUCAO_INSTRUCTION_VIEW_RESULT'
  /* Erro de sincronização */
  | 'ERROR_STATE_STALE'
  | 'ERROR_RENDER_TOKEN_MISMATCH'
  /* Bloqueios de fluxo */
  | 'BLOCKING_STATE_INVALID_TRANSITION'
  | 'BLOCKING_STATE_REVIEW_NOT_AVAILABLE'
  | 'BLOCKING_STATE_OUTPUT_NOT_AVAILABLE'
  | 'BLOCKING_STATE_REGIME_FROZEN'
  | 'BLOCKING_STATE_INVALIDATED_DOWNSTREAM'
  /* Bloqueios de UI (catálogo específico) */
  | 'BLOCKING_UI_STATE_STALE'
  | 'BLOCKING_UI_RENDER_TOKEN_MISMATCH'
  /* Bloqueios de motor: mensagem por família; detalhes opacos em details */
  | 'BLOCKING_MOTOR_HALTED_BY_VALIDATION'
  | 'BLOCKING_MOTOR_HALTED_BY_DEPENDENCY'
  | 'BLOCKING_MOTOR_HALTED_BY_MODULE'
  | 'BLOCKING_MOTOR_CLASSIFICATION_PREFLIGHT'
  /* Rótulos e textos de ajuda de campo (tabela 2.2) */
  | 'CONDUCAO_FIELD_LABEL_INIT_CONFIRM'
  | 'CONDUCAO_FIELD_HELP_INIT_CONFIRM'
  | 'CONDUCAO_FIELD_LABEL_CTX_TENANT_SLUG'
  | 'CONDUCAO_FIELD_HELP_CTX_TENANT_SLUG'
  | 'CONDUCAO_FIELD_LABEL_CTX_OPERATOR_NOTE'
  | 'CONDUCAO_FIELD_HELP_CTX_OPERATOR_NOTE'
  | 'CONDUCAO_FIELD_LABEL_REG_LEGAL_REGIME'
  | 'CONDUCAO_FIELD_HELP_REG_LEGAL_REGIME'
  | 'CONDUCAO_FIELD_LABEL_REG_PROCUREMENT_STRATEGY'
  | 'CONDUCAO_FIELD_HELP_REG_PROCUREMENT_STRATEGY'
  | 'CONDUCAO_FIELD_LABEL_DFD_OBJECT_TYPE'
  | 'CONDUCAO_FIELD_HELP_DFD_OBJECT_TYPE'
  | 'CONDUCAO_FIELD_LABEL_DFD_OBJECT_STRUCTURE'
  | 'CONDUCAO_FIELD_HELP_DFD_OBJECT_STRUCTURE'
  | 'CONDUCAO_FIELD_LABEL_ETP_STRATEGY_NOTE'
  | 'CONDUCAO_FIELD_HELP_ETP_STRATEGY_NOTE'
  | 'CONDUCAO_FIELD_LABEL_TR_TERMS_NOTE'
  | 'CONDUCAO_FIELD_HELP_TR_TERMS_NOTE'
  | 'CONDUCAO_FIELD_LABEL_PRC_BASE_VALUE'
  | 'CONDUCAO_FIELD_HELP_PRC_BASE_VALUE'
  /* Painel REVIEW: somente leitura e disparo */
  | 'REVIEW_PANEL_TITLE'
  | 'REVIEW_PANEL_INSTRUCTION_PRE_EXEC'
  | 'REVIEW_PANEL_INSTRUCTION_POST_EXEC'
  | 'REVIEW_BLOCK_STATIC_SUMMARY'
  | 'REVIEW_BLOCK_OUTCOME_LINE'
  | 'REVIEW_BLOCK_MODULES_LINE'
  | 'REVIEW_TRIGGER_PRIMARY_LABEL'
  /* Painel OUTPUT */
  | 'OUTPUT_PANEL_TITLE'
  | 'OUTPUT_PANEL_INSTRUCTION_VIEW'
  | 'OUTPUT_BLOCK_RESULT_SUMMARY';

export type CorrectionAction =
  | 'RELOAD_STATE_FROM_SERVER'
  | 'RETURN_TO_PREVIOUS_STEP'
  | 'FILL_REQUIRED_FIELDS'
  | 'TRIGGER_REVIEW'
  | 'VIEW_OUTPUT';
```

### 3.2 Contratos públicos de estado (sem campos abertos incompatíveis com congelamento)

```ts
export interface BlockingReason {
  /* Identificador canônico: exclusivamente literal de BlockingReasonCode */
  code: BlockingReasonCode;
  severity: BlockingSeverity;
  step: FlowStep;
  origin: BlockingOrigin;
  messageKey: MessageKey;
  correctionAction: CorrectionAction;
  details:
    | { kind: 'STATE_STALE'; expectedRenderToken: RenderToken; currentRenderToken: RenderToken; serverRevision: number }
    | { kind: 'RENDER_TOKEN_MISMATCH_ON_COMMAND'; expectedRenderToken: RenderToken; currentRenderToken: RenderToken; serverRevision: number }
    | { kind: 'FLOW_INVALID_TRANSITION'; fromStep: FlowStep; toStep: FlowStep }
    | { kind: 'FLOW_REVIEW_NOT_AVAILABLE'; currentStep: FlowStep }
    | { kind: 'FLOW_OUTPUT_NOT_AVAILABLE'; currentStep: FlowStep }
    | { kind: 'FLOW_REGIME_FROZEN'; frozenAfterStep: FlowStep; attemptedField: 'REG_LEGAL_REGIME' | 'REG_PROCUREMENT_STRATEGY' }
    | { kind: 'FLOW_INVALIDATED_DOWNSTREAM'; invalidatedSteps: FlowStep[]; reasonCode: FlowInvalidationReasonCode }
    | { kind: 'MOTOR_HALTED_BY_VALIDATION'; motorOpaqueHaltSegments: readonly string[]; haltedByModuleToken: string | null }
    | { kind: 'MOTOR_HALTED_BY_DEPENDENCY'; motorOpaqueHaltSegments: readonly string[]; haltedByModuleToken: string | null; dependencySegments: readonly string[] }
    | { kind: 'MOTOR_HALTED_BY_MODULE'; motorOpaqueHaltSegments: readonly string[]; haltedByModuleToken: string | null }
    | { kind: 'MOTOR_CLASSIFICATION_PREFLIGHT'; preflightSegments: readonly string[] };
}

export type FieldValue =
  | { valueType: 'STRING'; value: string }
  | { valueType: 'NUMBER'; value: number }
  | { valueType: 'BOOLEAN'; value: boolean };

export type StepFieldId =
  | 'INIT_CONFIRM'
  | 'CTX_TENANT_SLUG'
  | 'CTX_OPERATOR_NOTE'
  | 'REG_LEGAL_REGIME'
  | 'REG_PROCUREMENT_STRATEGY'
  | 'DFD_OBJECT_TYPE'
  | 'DFD_OBJECT_STRUCTURE'
  | 'ETP_STRATEGY_NOTE'
  | 'TR_TERMS_NOTE'
  | 'PRC_BASE_VALUE';

/* Identificador estável de formulário por etapa de condução (catálogo fechado) */
export type ConductionFormId =
  | 'FORM_COND_INIT_V1'
  | 'FORM_COND_CONTEXT_V1'
  | 'FORM_COND_REGIME_V1'
  | 'FORM_COND_DFD_V1'
  | 'FORM_COND_ETP_V1'
  | 'FORM_COND_TR_V1'
  | 'FORM_COND_PRICING_V1';

export type StepFieldSpec =
  | {
      fieldId: StepFieldId;
      fieldType: 'STRING';
      required: boolean;
      labelMessageKey: MessageKey;
      helpMessageKey: MessageKey;
    }
  | {
      fieldId: StepFieldId;
      fieldType: 'NUMBER';
      required: boolean;
      labelMessageKey: MessageKey;
      helpMessageKey: MessageKey;
    }
  | {
      fieldId: StepFieldId;
      fieldType: 'BOOLEAN';
      required: boolean;
      labelMessageKey: MessageKey;
      helpMessageKey: MessageKey;
    };

export interface StepFieldState {
  fieldId: StepFieldId;
  value: FieldValue | null;
  isValid: boolean | null;
  /* Traço opaco emitido pelo motor; sem semântica de catálogo para a UI */
  validationTrace: readonly string[] | null;
}

export interface StepSnapshot {
  step: FlowStep;
  status: StepStatus;
  version: number;
  snapshotHash: string;
  producedAt: string;
  producedBy: 'USER_ACTION' | 'SYSTEM_TRANSITION';
  frozenFields: {
    legalRegimeFrozen: boolean;
    procurementStrategyFrozen: boolean;
  };
}

/* Resultado da revisão: ramos PRE_REVIEW e POST_REVIEW mutuamente exclusivos */

export type ReviewResultFinalStatus =
  | 'SUCCESS'
  | 'HALTED_BY_VALIDATION'
  | 'HALTED_BY_DEPENDENCY'
  | 'HALTED_BY_MODULE';

export type ReviewHaltedOrigin =
  | 'DEPENDENCY'
  | 'CROSS_VALIDATION'
  | 'LEGAL_VALIDATION'
  | 'MODULE_SIGNAL'
  | 'CLASSIFICATION_PREFLIGHT'
  | 'REGIME_BEHAVIOR_ENGINE';

export type ReviewResultContract =
  | {
      phase: 'PRE_REVIEW';
    }
  | {
      phase: 'POST_REVIEW';
      finalStatus: ReviewResultFinalStatus;
      haltedDetail:
        | {
            type: 'DEPENDENCY' | 'VALIDATION' | 'MODULE';
            origin: ReviewHaltedOrigin;
            motorOpaqueSegments: readonly string[];
            haltedByModuleToken: string | null;
          }
        | null;
      validations: ReadonlyArray<{ issueTrace: readonly string[]; severity: 'ERROR' | 'BLOCK' }>;
      executedModules: readonly string[];
      reviewSnapshotHash: string;
    };

/* Painéis REVIEW e OUTPUT: somente leitura; sem StepFieldId */

export type ReviewPanelTitleKey = 'REVIEW_PANEL_TITLE' | 'CONDUCAO_STEP_REVIEW';

export type ReviewPanelInstructionKey =
  | 'REVIEW_PANEL_INSTRUCTION_PRE_EXEC'
  | 'REVIEW_PANEL_INSTRUCTION_POST_EXEC';

export type ReviewReadOnlyBlock =
  | { blockKind: 'STATIC_SECTION'; sectionTitleMessageKey: 'REVIEW_BLOCK_STATIC_SUMMARY' }
  | {
      blockKind: 'KEY_VALUE';
      rowId: 'REVIEW_ROW_OUTCOME';
      labelMessageKey: 'REVIEW_BLOCK_OUTCOME_LINE';
      valueDisplay: { kind: 'OPAQUE_TEXT'; text: string };
    }
  | {
      blockKind: 'KEY_VALUE';
      rowId: 'REVIEW_ROW_MODULES';
      labelMessageKey: 'REVIEW_BLOCK_MODULES_LINE';
      valueDisplay: { kind: 'OPAQUE_TEXT'; text: string };
    };

export interface ReviewPanelContract {
  mode: 'REVIEW_PANEL';
  step: 'REVIEW';
  formId: 'FORM_REVIEW_PANEL_V1';
  stepTitleMessageKey: ReviewPanelTitleKey;
  stepInstructionMessageKey: ReviewPanelInstructionKey;
  reviewExecutionPhase: 'PRE_REVIEW' | 'POST_REVIEW';
  readOnlyBlocks: readonly ReviewReadOnlyBlock[];
  reviewTriggerControl: {
    visible: boolean;
    disabled: boolean;
    labelMessageKey: 'REVIEW_TRIGGER_PRIMARY_LABEL';
  };
}

export type OutputPanelTitleKey = 'OUTPUT_PANEL_TITLE' | 'CONDUCAO_STEP_OUTPUT';

export type OutputPanelInstructionKey = 'OUTPUT_PANEL_INSTRUCTION_VIEW';

export type OutputReadOnlyBlock =
  | { blockKind: 'STATIC_SECTION'; sectionTitleMessageKey: 'OUTPUT_BLOCK_RESULT_SUMMARY' }
  | {
      blockKind: 'KEY_VALUE';
      rowId: 'OUTPUT_ROW_SUMMARY';
      labelMessageKey: 'OUTPUT_BLOCK_RESULT_SUMMARY';
      valueDisplay: { kind: 'OPAQUE_TEXT'; text: string };
    };

export interface OutputPanelContract {
  mode: 'OUTPUT_PANEL';
  step: 'OUTPUT';
  formId: 'FORM_OUTPUT_PANEL_V1';
  stepTitleMessageKey: OutputPanelTitleKey;
  stepInstructionMessageKey: OutputPanelInstructionKey;
  readOnlyBlocks: readonly OutputReadOnlyBlock[];
}

export interface StepFormConductionContract {
  mode: 'CONDUCTION_STEP_FORM';
  step: Exclude<FlowStep, 'REVIEW' | 'OUTPUT'>;
  formId: ConductionFormId;
  stepTitleMessageKey: MessageKey;
  stepInstructionMessageKey: MessageKey;
  fields: ReadonlyArray<{
    spec: StepFieldSpec;
    state: StepFieldState;
  }>;
}

export type CurrentStepFormContract =
  | StepFormConductionContract
  | ReviewPanelContract
  | OutputPanelContract;

export interface OperationalStateContract {
  schemaVersion: string;
  fieldCatalogVersion: string;

  processId: string;
  flowVersion: FlowVersion;

  revision: number;
  generatedAt: string;

  stepOrder: [FlowStep, FlowStep, FlowStep, FlowStep, FlowStep, FlowStep, FlowStep, FlowStep, FlowStep];
  currentStep: FlowStep;
  stepStatusMap: Record<FlowStep, StepStatus>;

  allowedActions: AllowedAction[];
  nextRequiredAction: NextRequiredAction;

  activeBlockings: BlockingReason[];

  snapshots: Record<FlowStep, StepSnapshot | null>;

  immutableHistory: ReadonlyArray<{
    revision: number;
    type:
      | 'STEP_SAVED'
      | 'STEP_ADVANCED'
      | 'STEP_RETURNED'
      | 'STEP_INVALIDATED'
      | 'REVIEW_EXECUTED'
      | 'OUTPUT_EXPOSED';
    step: FlowStep;
    timestamp: string;
    metadataHash: string;
  }>;

  reviewResult: ReviewResultContract;

  currentStepForm: CurrentStepFormContract;

  renderToken: RenderToken;
}
```

### 3.3 Invariantes contratuais mínimas (derivadas do contrato)

1. `stepOrder` é sempre exatamente `['INIT','CONTEXT','REGIME','DFD','ETP','TR','PRICING','REVIEW','OUTPUT']`.
2. Só existe uma etapa `currentStep`.
3. `allowedActions` e `nextRequiredAction` são apenas valores enumerados e **sempre** coerentes com `currentStep`, com `activeBlockings` e com `reviewResult.phase` (ver seção 7).
4. `renderToken` muda exclusivamente quando muda o conjunto de campos da seção 8 (definição formal).
5. `reviewResult.phase === 'POST_REVIEW'` se e somente se o núcleo declara revisão **vigente** para o `revision` corrente (isto é, existe execução de revisão cuja conclusão ainda governa `allowedActions`/`nextRequiredAction`). O `immutableHistory` observa política de somente anexação: podem existir eventos `REVIEW_EXECUTED` arquivados após `STEP_RETURNED` que invalidou a vigência; tais eventos **não** forçam `POST_REVIEW` no estado atual (seções 11.6 e 13).
6. `reviewResult.phase === 'PRE_REVIEW'` implica que nenhuma execução de revisão está vigente no `revision` corrente, independentemente de eventos `REVIEW_EXECUTED` remanescentes no histórico como registro auditável.
7. `currentStepForm` discrimina o modo pela propriedade `mode` e:
   - se `mode === 'CONDUCTION_STEP_FORM'`, então `currentStepForm.step === currentStep` e `currentStep` ∉ `{ 'REVIEW', 'OUTPUT' }`;
   - se `mode === 'REVIEW_PANEL'`, então `currentStep === 'REVIEW'` e `currentStepForm.step === 'REVIEW'` e `currentStepForm.reviewExecutionPhase === reviewResult.phase`;
   - se `mode === 'OUTPUT_PANEL'`, então `currentStep === 'OUTPUT'` e `currentStepForm.step === 'OUTPUT'`.
8. Todo `StepFieldSpec` em `CONDUCTION_STEP_FORM` usa exclusivamente `fieldId` permitidos para `currentStep` conforme tabela 2.2 e `labelMessageKey`/`helpMessageKey` iguais ao par da mesma linha; o `formId` satisfaz a tabela 2.3.
9. Todo `BlockingReason.code` pertence a `BlockingReasonCode`; não existe código de bloqueio fora do catálogo.

## 4. Catálogo de BlockingReason.code (canônico, fechado)

### 4.1 Regras de unicidade e origem

- O campo `BlockingReason.code` é **sempre** um literal do tipo `BlockingReasonCode`. Não existe concatenação dinâmica, sufixo ou prefixo variável no campo `code`.
- Informação opaca proveniente do motor (segmentos de validação, de paragem, de dependência ou de verificação prévia classificatória) reside **apenas** em `details`, nos campos `motorOpaqueHaltSegments`, `dependencySegments` ou `preflightSegments`, conforme o `kind` de `details`. A UI **exibe** esses traços apenas como dados opacos associados à mensagem institucional do `messageKey`, sem inferir regra.
- Para deduplicação e `renderToken`, usa-se o par `(code, detailsHash)` onde `detailsHash` é hash canônico do JSON normalizado de `details` (ordem de chaves fixa, arrays ordenados quando a semântica for conjunto).

### 4.2 Itens do catálogo (definições fechadas)

```md
[1] code: FLOW_INVALID_TRANSITION
    severity: HARD
    step: `fromStep` em `details`
    origem: FLUXO
    messageKey: BLOCKING_STATE_INVALID_TRANSITION
    correctionAction: RETURN_TO_PREVIOUS_STEP
    details.kind: FLOW_INVALID_TRANSITION

[2] code: FLOW_REVIEW_NOT_AVAILABLE
    severity: HARD
    step: `currentStep` em `details`
    origem: FLUXO
    messageKey: BLOCKING_STATE_REVIEW_NOT_AVAILABLE
    correctionAction: FILL_REQUIRED_FIELDS
    details.kind: FLOW_REVIEW_NOT_AVAILABLE

[3] code: FLOW_OUTPUT_NOT_AVAILABLE
    severity: HARD
    step: `currentStep` em `details`
    origem: FLUXO
    messageKey: BLOCKING_STATE_OUTPUT_NOT_AVAILABLE
    correctionAction: `TRIGGER_REVIEW` se a revisão estiver pendente e permitida em `allowedActions`; caso contrário `FILL_REQUIRED_FIELDS` quando exigido pelo contrato emitido
    details.kind: FLOW_OUTPUT_NOT_AVAILABLE

[4] code: FLOW_REGIME_FROZEN
    severity: HARD
    step: REGIME
    origem: FLUXO
    messageKey: BLOCKING_STATE_REGIME_FROZEN
    correctionAction: RETURN_TO_PREVIOUS_STEP
    details.kind: FLOW_REGIME_FROZEN

[5] code: FLOW_INVALIDATED_DOWNSTREAM
    severity: HARD
    step: primeiro elemento de `invalidatedSteps` quando a lista não for vazia; caso contrário `currentStep` da emissão
    origem: FLUXO
    messageKey: BLOCKING_STATE_INVALIDATED_DOWNSTREAM
    correctionAction: RETURN_TO_PREVIOUS_STEP
    details.kind: FLOW_INVALIDATED_DOWNSTREAM

[6] code: UI_STATE_STALE
    severity: HARD
    step: `currentStep` associado à operação que falhou
    origem: UI
    messageKey: BLOCKING_UI_STATE_STALE
    correctionAction: RELOAD_STATE_FROM_SERVER
    details.kind: STATE_STALE

[7] code: UI_RENDER_TOKEN_MISMATCH_ON_COMMAND
    severity: HARD
    step: `currentStep` associado à operação que falhou
    origem: UI
    messageKey: BLOCKING_UI_RENDER_TOKEN_MISMATCH
    correctionAction: RELOAD_STATE_FROM_SERVER
    details.kind: RENDER_TOKEN_MISMATCH_ON_COMMAND

[8] code: MOTOR_HALTED_BY_VALIDATION
    severity: HARD
    step: REVIEW
    origem: MOTOR
    messageKey: BLOCKING_MOTOR_HALTED_BY_VALIDATION
    correctionAction: FILL_REQUIRED_FIELDS
    details.kind: MOTOR_HALTED_BY_VALIDATION

[9] code: MOTOR_HALTED_BY_DEPENDENCY
    severity: HARD
    step: REVIEW
    origem: MOTOR
    messageKey: BLOCKING_MOTOR_HALTED_BY_DEPENDENCY
    correctionAction: FILL_REQUIRED_FIELDS
    details.kind: MOTOR_HALTED_BY_DEPENDENCY

[10] code: MOTOR_HALTED_BY_MODULE
     severity: HARD
     step: REVIEW
     origem: MOTOR
     messageKey: BLOCKING_MOTOR_HALTED_BY_MODULE
     correctionAction: FILL_REQUIRED_FIELDS
     details.kind: MOTOR_HALTED_BY_MODULE

[11] code: MOTOR_CLASSIFICATION_PREFLIGHT
     severity: HARD
     step: REVIEW
     origem: MOTOR
     messageKey: BLOCKING_MOTOR_CLASSIFICATION_PREFLIGHT
     correctionAction: FILL_REQUIRED_FIELDS
     details.kind: MOTOR_CLASSIFICATION_PREFLIGHT
```

## 5. Catálogo congelado de messageKey (auditável por chave)

Cada linha corresponde a um literal do tipo `MessageKey`. Os parâmetros estruturais permitidos limitam-se aos indicados na coluna «Parâmetros»: `details` do bloqueio, `valueDisplay.text` em blocos somente leitura, ou nenhum parâmetro adicional.

| messageKey | Semântica | Etapa(s) aplicável(eis) | Parâmetros estruturais permitidos | Origem de renderização |
|------------|-----------|-------------------------|-------------------------------------|-------------------------|
| CONDUCAO_STEP_INIT | Título institucional da etapa INIT | INIT | nenhum | cabeçalho de etapa em `CONDUCTION_STEP_FORM` |
| CONDUCAO_STEP_CONTEXT | Título institucional da etapa CONTEXT | CONTEXT | nenhum | cabeçalho de etapa |
| CONDUCAO_STEP_REGIME | Título institucional da etapa REGIME | REGIME | nenhum | cabeçalho de etapa |
| CONDUCAO_STEP_DFD | Título institucional da etapa DFD | DFD | nenhum | cabeçalho de etapa |
| CONDUCAO_STEP_ETP | Título institucional da etapa ETP | ETP | nenhum | cabeçalho de etapa |
| CONDUCAO_STEP_TR | Título institucional da etapa TR | TR | nenhum | cabeçalho de etapa |
| CONDUCAO_STEP_PRICING | Título institucional da etapa PRICING | PRICING | nenhum | cabeçalho de etapa |
| CONDUCAO_STEP_REVIEW | Título institucional da etapa REVIEW | REVIEW | nenhum | cabeçalho de etapa; combinação com `REVIEW_PANEL_TITLE` conforme `ReviewPanelTitleKey` |
| CONDUCAO_STEP_OUTPUT | Título institucional da etapa OUTPUT | OUTPUT | nenhum | painel OUTPUT |
| CONDUCAO_INSTRUCTION_FILL_REQUIRED_FIELDS | Instrução: completar campos obrigatórios | todas exceto OUTPUT pós-sucesso | nenhum | faixa de instrução |
| CONDUCAO_INSTRUCTION_RESOLVE_BLOCKINGS | Instrução: resolver bloqueios | todas | nenhum | faixa de instrução |
| CONDUCAO_INSTRUCTION_RUN_REVIEW | Instrução: executar revisão | REVIEW | nenhum | faixa de instrução |
| CONDUCAO_INSTRUCTION_VIEW_RESULT | Instrução: consultar resultado | OUTPUT | nenhum | faixa de instrução |
| ERROR_STATE_STALE | Erro de protocolo ou contrato por estado obsoleto | qualquer | `StateStaleErrorContract` | resposta de erro e bloqueio global |
| ERROR_RENDER_TOKEN_MISMATCH | Erro por divergência de token de renderização em comando | qualquer | mesmos campos que `details.kind === 'RENDER_TOKEN_MISMATCH_ON_COMMAND'` | resposta de erro |
| BLOCKING_STATE_INVALID_TRANSITION | Bloqueio: transição inválida | conforme `details.fromStep` | `fromStep`, `toStep` | lista de bloqueios |
| BLOCKING_STATE_REVIEW_NOT_AVAILABLE | Bloqueio: REVIEW indisponível | conforme `details.currentStep` | `currentStep` | lista de bloqueios |
| BLOCKING_STATE_OUTPUT_NOT_AVAILABLE | Bloqueio: OUTPUT indisponível | conforme `details.currentStep` | `currentStep` | lista de bloqueios |
| BLOCKING_STATE_REGIME_FROZEN | Bloqueio: regime congelado | REGIME | `frozenAfterStep`, `attemptedField` | lista de bloqueios |
| BLOCKING_STATE_INVALIDATED_DOWNSTREAM | Bloqueio: invalidação a jusante | conforme primeira etapa invalidada | `invalidatedSteps[]`, `reasonCode` | lista de bloqueios |
| BLOCKING_UI_STATE_STALE | Bloqueio UI: estado obsoleto | corrente | tokens + revision | lista de bloqueios |
| BLOCKING_UI_RENDER_TOKEN_MISMATCH | Bloqueio UI: token de comando divergente | corrente | tokens + revision | lista de bloqueios |
| BLOCKING_MOTOR_HALTED_BY_VALIDATION | Bloqueio motor: validação | REVIEW | `motorOpaqueHaltSegments`, `haltedByModuleToken` | lista de bloqueios |
| BLOCKING_MOTOR_HALTED_BY_DEPENDENCY | Bloqueio motor: dependência | REVIEW | `motorOpaqueHaltSegments`, `haltedByModuleToken`, `dependencySegments` | lista de bloqueios |
| BLOCKING_MOTOR_HALTED_BY_MODULE | Bloqueio motor: módulo | REVIEW | `motorOpaqueHaltSegments`, `haltedByModuleToken` | lista de bloqueios |
| BLOCKING_MOTOR_CLASSIFICATION_PREFLIGHT | Bloqueio motor: verificação prévia classificatória | REVIEW | `preflightSegments` | lista de bloqueios |
| CONDUCAO_FIELD_LABEL_INIT_CONFIRM | Rótulo institucional do campo `INIT_CONFIRM` | INIT | nenhum | rótulo de campo em `CONDUCTION_STEP_FORM` |
| CONDUCAO_FIELD_HELP_INIT_CONFIRM | Texto de ajuda do campo `INIT_CONFIRM` | INIT | nenhum | ajuda de campo |
| CONDUCAO_FIELD_LABEL_CTX_TENANT_SLUG | Rótulo institucional do campo `CTX_TENANT_SLUG` | CONTEXT | nenhum | rótulo de campo |
| CONDUCAO_FIELD_HELP_CTX_TENANT_SLUG | Texto de ajuda do campo `CTX_TENANT_SLUG` | CONTEXT | nenhum | ajuda de campo |
| CONDUCAO_FIELD_LABEL_CTX_OPERATOR_NOTE | Rótulo institucional do campo `CTX_OPERATOR_NOTE` | CONTEXT | nenhum | rótulo de campo |
| CONDUCAO_FIELD_HELP_CTX_OPERATOR_NOTE | Texto de ajuda do campo `CTX_OPERATOR_NOTE` | CONTEXT | nenhum | ajuda de campo |
| CONDUCAO_FIELD_LABEL_REG_LEGAL_REGIME | Rótulo institucional do campo `REG_LEGAL_REGIME` | REGIME | nenhum | rótulo de campo |
| CONDUCAO_FIELD_HELP_REG_LEGAL_REGIME | Texto de ajuda do campo `REG_LEGAL_REGIME` | REGIME | nenhum | ajuda de campo |
| CONDUCAO_FIELD_LABEL_REG_PROCUREMENT_STRATEGY | Rótulo institucional do campo `REG_PROCUREMENT_STRATEGY` | REGIME | nenhum | rótulo de campo |
| CONDUCAO_FIELD_HELP_REG_PROCUREMENT_STRATEGY | Texto de ajuda do campo `REG_PROCUREMENT_STRATEGY` | REGIME | nenhum | ajuda de campo |
| CONDUCAO_FIELD_LABEL_DFD_OBJECT_TYPE | Rótulo institucional do campo `DFD_OBJECT_TYPE` | DFD | nenhum | rótulo de campo |
| CONDUCAO_FIELD_HELP_DFD_OBJECT_TYPE | Texto de ajuda do campo `DFD_OBJECT_TYPE` | DFD | nenhum | ajuda de campo |
| CONDUCAO_FIELD_LABEL_DFD_OBJECT_STRUCTURE | Rótulo institucional do campo `DFD_OBJECT_STRUCTURE` | DFD | nenhum | rótulo de campo |
| CONDUCAO_FIELD_HELP_DFD_OBJECT_STRUCTURE | Texto de ajuda do campo `DFD_OBJECT_STRUCTURE` | DFD | nenhum | ajuda de campo |
| CONDUCAO_FIELD_LABEL_ETP_STRATEGY_NOTE | Rótulo institucional do campo `ETP_STRATEGY_NOTE` | ETP | nenhum | rótulo de campo |
| CONDUCAO_FIELD_HELP_ETP_STRATEGY_NOTE | Texto de ajuda do campo `ETP_STRATEGY_NOTE` | ETP | nenhum | ajuda de campo |
| CONDUCAO_FIELD_LABEL_TR_TERMS_NOTE | Rótulo institucional do campo `TR_TERMS_NOTE` | TR | nenhum | rótulo de campo |
| CONDUCAO_FIELD_HELP_TR_TERMS_NOTE | Texto de ajuda do campo `TR_TERMS_NOTE` | TR | nenhum | ajuda de campo |
| CONDUCAO_FIELD_LABEL_PRC_BASE_VALUE | Rótulo institucional do campo `PRC_BASE_VALUE` | PRICING | nenhum | rótulo de campo |
| CONDUCAO_FIELD_HELP_PRC_BASE_VALUE | Texto de ajuda do campo `PRC_BASE_VALUE` | PRICING | nenhum | ajuda de campo |
| REVIEW_PANEL_TITLE | Título do painel de revisão | REVIEW | nenhum | cabeçalho do painel REVIEW |
| REVIEW_PANEL_INSTRUCTION_PRE_EXEC | Instrução antes da execução do motor | REVIEW | nenhum | corpo do painel |
| REVIEW_PANEL_INSTRUCTION_POST_EXEC | Instrução após execução | REVIEW | nenhum | corpo do painel |
| REVIEW_BLOCK_STATIC_SUMMARY | Seção estática de resumo | REVIEW | nenhum | bloco somente leitura |
| REVIEW_BLOCK_OUTCOME_LINE | Rótulo de linha de desfecho | REVIEW | texto em `valueDisplay.text` | bloco com `blockKind === 'KEY_VALUE'` |
| REVIEW_BLOCK_MODULES_LINE | Rótulo de linha de módulos executados | REVIEW | texto em `valueDisplay.text` | bloco com `blockKind === 'KEY_VALUE'` |
| REVIEW_TRIGGER_PRIMARY_LABEL | Texto institucional do controle de disparo da revisão | REVIEW | nenhum | botão / controle primário em `reviewTriggerControl` |
| OUTPUT_PANEL_TITLE | Título do painel de saída | OUTPUT | nenhum | cabeçalho |
| OUTPUT_PANEL_INSTRUCTION_VIEW | Instrução de consulta ao resultado | OUTPUT | nenhum | corpo |
| OUTPUT_BLOCK_RESULT_SUMMARY | Título de seção ou rótulo de linha de resumo do resultado | OUTPUT | com `blockKind === 'KEY_VALUE'`: `valueDisplay.text`; com `blockKind === 'STATIC_SECTION'`: nenhum | bloco com `blockKind === 'STATIC_SECTION'` ou `KEY_VALUE` e `rowId === 'OUTPUT_ROW_SUMMARY'` |

Regras globais de mensagem:

- Nenhuma mensagem institucional sem `messageKey` canônica.
- A UI **não** compõe frases normativas: apenas resolve o literal a texto via pacote de internacionalização versionado conjuntamente com `fieldCatalogVersion` e `schemaVersion`.

## 6. Catálogo de allowedActions (enum fechado)

```md
allowedActions (fechado):
- EDIT_CURRENT_STEP
- SAVE_CURRENT_STEP
- ADVANCE_TO_NEXT_STEP
- RETURN_TO_PREVIOUS_STEP
- TRIGGER_REVIEW
- VIEW_OUTPUT
```

## 7. Catálogo de nextRequiredAction (determinístico)

```md
nextRequiredAction (fechado):
- FILL_REQUIRED_FIELDS
- RESOLVE_BLOCKINGS
- RUN_REVIEW
- VIEW_RESULT
```

Regras determinísticas (sem inferência pela UI além de exibir o valor recebido):

1. Se existir bloqueio com `severity='HARD'` cuja `correctionAction` não seja `RELOAD_STATE_FROM_SERVER`, então `nextRequiredAction='RESOLVE_BLOCKINGS'`.
2. Senão, se `currentStep==='REVIEW'` e `reviewResult.phase==='PRE_REVIEW'` e `TRIGGER_REVIEW` ∈ `allowedActions` e não houver HARD bloqueando disparo, então `nextRequiredAction='RUN_REVIEW'`.
3. Senão, se `currentStep==='OUTPUT'` e `reviewResult` está no ramo `phase==='POST_REVIEW'` e `reviewResult.finalStatus==='SUCCESS'` e `VIEW_OUTPUT` ∈ `allowedActions`, então `nextRequiredAction='VIEW_RESULT'`.
4. Caso contrário, `nextRequiredAction='FILL_REQUIRED_FIELDS'`.

Coerência com `reviewResult`:

- Em `PRE_REVIEW`, não existe `finalStatus`; a UI **não** deve exibir desfecho de revisão como concluído.
- Em `POST_REVIEW`, `finalStatus` é a única autoridade sobre o desfecho; não existe campo paralelo `executed` / `success` / `halted`.

## 8. Definição formal de renderToken (anti-desalinhamento)

### 8.1 Campos que compõem o renderToken

`renderToken` é a hash canônica (SHA-256) do seguinte objeto base:

```ts
interface RenderTokenBasis {
  schemaVersion: string;
  fieldCatalogVersion: string;
  processId: string;
  flowVersion: FlowVersion;
  revision: number;
  currentStep: FlowStep;
  stepStatusMap: Record<FlowStep, StepStatus>;
  allowedActions: AllowedAction[];
  nextRequiredAction: NextRequiredAction;
  currentStepFormCanonicalHash: string;
  activeBlockingsCanonical: ReadonlyArray<{
    code: BlockingReasonCode;
    severity: BlockingSeverity;
    origin: BlockingOrigin;
    step: FlowStep;
    messageKey: MessageKey;
    detailsHash: string;
  }>;
  reviewResultCanonical:
    | { phase: 'PRE_REVIEW' }
    | {
        phase: 'POST_REVIEW';
        finalStatus: ReviewResultFinalStatus;
        validationsCanonical: ReadonlyArray<{
          issueTraceFingerprint: string;
          severity: 'ERROR' | 'BLOCK';
        }>;
        executedModules: readonly string[];
        reviewSnapshotHash: string;
      };
}
```

Onde `issueTraceFingerprint` é hash SHA-256 da concatenação ordenada dos segmentos em `issueTrace` (normalização para lista vazia quando null).

### 8.2 Quando renderToken muda

`renderToken` deve ser regenerado sempre que qualquer campo de `RenderTokenBasis` mudar, inclusive `fieldCatalogVersion`.

### 8.3 Detecção de estado obsoleto

1. A UI envia comando com `expectedRenderToken` igual ao último `renderToken` recebido.
2. O núcleo compara com o `renderToken` canônico atual do mesmo `processId`.
3. Se divergente, falha com `STATE_STALE` (seção 9) ou, em verificação prévia ao comando, regista `UI_RENDER_TOKEN_MISMATCH_ON_COMMAND` em `activeBlockings`, conforme contrato da camada de integração (Incremento C).

## 9. Contrato de erro STATE_STALE

### 9.1 Formato

```ts
export type StateStaleErrorCode = 'STATE_STALE';

export interface StateStaleErrorContract {
  errorCode: StateStaleErrorCode;
  messageKey: 'ERROR_STATE_STALE';
  expectedRenderToken: RenderToken;
  currentRenderToken: RenderToken;
  serverRevision: number;
  serverGeneratedAt: string;
  correlationId: string;
}
```

### 9.2 Gatilho e comportamento

Gatilho: divergência entre `expectedRenderToken` e o `renderToken` canônico. Comportamento obrigatório da UI: executar `RELOAD_STATE_FROM_SERVER`. É vedada qualquer progressão com estado obsoleto.

## 10. Política de versionamento (schemaVersion e fieldCatalogVersion)

### 10.1 Formato

Ambos seguem SemVer: `MAJOR.MINOR.PATCH`.

### 10.2 Evolução e compatibilidade

1. **schemaVersion MAJOR**: quebra de forma de `OperationalStateContract`, enumerações de fluxo, ou invariantes das seções 3.3 e 13.
2. **schemaVersion MINOR**: campos opcionais aditivos com valor por omissão definido; não remover valores de enumerações existentes.
3. **schemaVersion PATCH**: ajustes documentais sem mudança de semântica pública.

`fieldCatalogVersion` segue a seção 2.1.

### 10.3 Como evita quebra

- `renderToken` inclui `schemaVersion` e `fieldCatalogVersion`.
- UI compatível deve recusar `MAJOR` não suportado com fluxo de erro canônico definido no Incremento C, quando aplicável.

## 11. Semântica formal de RETURN_TO_PREVIOUS_STEP

### 11.1 Quando é permitido

`RETURN_TO_PREVIOUS_STEP` só pode aparecer em `allowedActions` se **todas** as condições forem verdadeiras:

1. Existe etapa anterior em `stepOrder` em relação a `currentStep`.
2. Não existe bloqueio HARD ativo cujo `correctionAction` seja exclusivamente `RELOAD_STATE_FROM_SERVER` sem possibilidade de recuperação após recarregamento (política: após recarregamento, reavaliar; se ainda HARD, não permitir retorno até resolução).
3. A transição de retorno está explicitamente habilitada pelo FlowController para o par `(currentStep, previousStep)` segundo a matriz normativa do Incremento C, e `RETURN_TO_PREVIOUS_STEP` consta de `allowedActions`.

### 11.2 Efeitos no estado operacional

1. `currentStep` passa a ser a etapa imediatamente anterior em `stepOrder`.
2. `revision` incrementa em +1 (monotonicidade global).
3. `stepStatusMap` é atualizado pelo núcleo: tipicamente a etapa destino passa a `IN_PROGRESS` ou `AVAILABLE` conforme política do Incremento C; etapas posteriores podem passar a `INVALIDATED` se o retorno implicar invalidação.

### 11.3 Efeitos em snapshots

1. Para cada etapa `s` que permanecer semanticamente válida após o retorno, `snapshots[s]` **não** é apagado arbitrariamente; apenas se a política de invalidação determinar `INVALIDATED`, o snapshot é marcado como inválido no `stepStatusMap` e um novo snapshot substituto será produzido no próximo salvamento.
2. Se o retorno **não** invalidar etapas posteriores (caso normativo raro), os snapshots permanecem como registro histórico, mas o `currentStepForm` deve refletir apenas a etapa corrente.

### 11.4 Efeitos em invalidação

1. Se o retorno acionar `FLOW_INVALIDATED_DOWNSTREAM`, o núcleo emite bloqueios com `code='FLOW_INVALIDATED_DOWNSTREAM'` e `details.invalidatedSteps` fechado, com `reasonCode` em `FlowInvalidationReasonCode`.
2. A UI **não** recalcula etapas invalidadas: apenas renderiza a lista em `details.invalidatedSteps` como dado opaco de contexto visual ligado ao `messageKey`.

### 11.5 Efeitos no histórico

1. Deve ser anexado evento `STEP_RETURNED` em `immutableHistory` com `step` igual à etapa **de destino** do retorno (a etapa para a qual o fluxo voltou), `revision` novo, `metadataHash` cobrindo par `(fromStep, toStep)` canônico e `fieldCatalogVersion` corrente.
2. Se o retorno partir de `REVIEW` ou `OUTPUT` para etapa anterior e a política exigir reset de revisão, então `reviewResult` passa para `{ phase: 'PRE_REVIEW' }` e **remove** eventos lógicos de conclusão de revisão da interpretação atual (ver 11.6).

### 11.6 Interação com reviewResult

1. Se existia `POST_REVIEW` e o retorno invalida a premissa da revisão, o estado **obrigatório** é `reviewResult: { phase: 'PRE_REVIEW' }` e o histórico recebe anotação via novo `revision`; não se mantém `POST_REVIEW` com `finalStatus` obsoleto coexistindo com etapa anterior à REVIEW como `currentStep`.

## 12. Comportamento fechado de currentStepForm por etapa (`FlowStep`)

### 12.1 INIT

- `currentStepForm.mode` é `CONDUCTION_STEP_FORM`.
- `currentStepForm.step` é `INIT`.
- `formId` é `FORM_COND_INIT_V1`.
- `fields` contém **exatamente** os pares `(spec, state)` para `StepFieldId` igual a `INIT_CONFIRM`, na ordem emitida pelo núcleo.
- `stepTitleMessageKey` é `CONDUCAO_STEP_INIT`; `stepInstructionMessageKey` é um literal de instrução canônico coerente com `nextRequiredAction` e bloqueios.

### 12.2 CONTEXT

- `currentStepForm.mode` é `CONDUCTION_STEP_FORM`.
- `currentStepForm.step` é `CONTEXT`.
- `formId` é `FORM_COND_CONTEXT_V1`.
- `fields` cobre **exatamente** `CTX_TENANT_SLUG` e `CTX_OPERATOR_NOTE`, na ordem emitida pelo núcleo.
- `stepTitleMessageKey` é `CONDUCAO_STEP_CONTEXT`; `stepInstructionMessageKey` conforme regra da subsecção 12.1.

### 12.3 REGIME

- `currentStepForm.mode` é `CONDUCTION_STEP_FORM`.
- `currentStepForm.step` é `REGIME`.
- `formId` é `FORM_COND_REGIME_V1`.
- `fields` cobre **exatamente** `REG_LEGAL_REGIME` e `REG_PROCUREMENT_STRATEGY`, na ordem emitida pelo núcleo.
- `stepTitleMessageKey` é `CONDUCAO_STEP_REGIME`; `stepInstructionMessageKey` conforme regra da subsecção 12.1.

### 12.4 DFD

- `currentStepForm.mode` é `CONDUCTION_STEP_FORM`.
- `currentStepForm.step` é `DFD`.
- `formId` é `FORM_COND_DFD_V1`.
- `fields` cobre **exatamente** `DFD_OBJECT_TYPE` e `DFD_OBJECT_STRUCTURE`, na ordem emitida pelo núcleo.
- `stepTitleMessageKey` é `CONDUCAO_STEP_DFD`; `stepInstructionMessageKey` conforme regra da subsecção 12.1.

### 12.5 ETP

- `currentStepForm.mode` é `CONDUCTION_STEP_FORM`.
- `currentStepForm.step` é `ETP`.
- `formId` é `FORM_COND_ETP_V1`.
- `fields` contém **exatamente** `ETP_STRATEGY_NOTE`.
- `stepTitleMessageKey` é `CONDUCAO_STEP_ETP`; `stepInstructionMessageKey` conforme regra da subsecção 12.1.

### 12.6 TR

- `currentStepForm.mode` é `CONDUCTION_STEP_FORM`.
- `currentStepForm.step` é `TR`.
- `formId` é `FORM_COND_TR_V1`.
- `fields` contém **exatamente** `TR_TERMS_NOTE`.
- `stepTitleMessageKey` é `CONDUCAO_STEP_TR`; `stepInstructionMessageKey` conforme regra da subsecção 12.1.

### 12.7 PRICING

- `currentStepForm.mode` é `CONDUCTION_STEP_FORM`.
- `currentStepForm.step` é `PRICING`.
- `formId` é `FORM_COND_PRICING_V1`.
- `fields` contém **exatamente** `PRC_BASE_VALUE`.
- `stepTitleMessageKey` é `CONDUCAO_STEP_PRICING`; `stepInstructionMessageKey` conforme regra da subsecção 12.1.

### 12.8 REVIEW

- `currentStepForm.mode` é `REVIEW_PANEL`.
- `currentStepForm.step` é `REVIEW`.
- `formId` é `FORM_REVIEW_PANEL_V1`.
- Não há `StepFieldId` nem entrada editável além de `reviewTriggerControl` (a ação `TRIGGER_REVIEW` consta de `allowedActions`).
- `reviewExecutionPhase` coincide com `reviewResult.phase`.
- `readOnlyBlocks` é a única fonte de conteúdo somente leitura; a UI não reconstrói resumo a partir de `reviewResult` sem blocos emitidos pelo núcleo.

### 12.9 OUTPUT

- `currentStepForm.mode` é `OUTPUT_PANEL`.
- `currentStepForm.step` é `OUTPUT`.
- `formId` é `FORM_OUTPUT_PANEL_V1`.
- Somente `readOnlyBlocks`; nenhum campo editável.
- A ação `VIEW_OUTPUT` em `allowedActions` governa visualização complementar; o painel permanece determinístico via `readOnlyBlocks`.

## 13. Validade do contrato para a condução operacional

Este contrato é a fonte única para:

- renderização de mensagens institucionais (via `messageKey`);
- habilitação de ações (via `allowedActions`);
- determinação do próximo passo operacional (via `nextRequiredAction`);
- bloqueios e ações corretivas (via `activeBlockings`);
- forma do formulário ou painel (via `currentStepForm.mode`).

A UI não deve:

- inventar strings institucionais;
- deduzir regra a partir de traços opacos do motor;
- calcular `nextRequiredAction` ou `renderToken`;
- tratar `REVIEW` ou `OUTPUT` como `CONDUCTION_STEP_FORM`.

## 14. Evidência de ausência de código

Este arquivo é exclusivamente documental: não define nem implementa lógica de negócio, validações, decisões, transições ou regras jurídicas. Sua única função é congelar contratos e catálogos.
