# Relatório — Fase 30: Motor de Explicabilidade Consolidada da Decisão Administrativa (DecisionExplanation)

**Data:** 2026-03-17  
**Projeto:** LICITAIA V2  
**Fase:** 30 — Motor de Explicabilidade Consolidada da Decisão Administrativa  

---

## 1. Estrutura

A implementação respeita a estrutura existente do repositório:

- **Local da implementação:** `modules/domain/shared` (engine, tipos, testes).
- **Eventos:** `modules/shared/event-builders/`.
- **Metadata:** `modules/shared/metadata/metadata-composer.ts`.
- **Integração:** módulos de domínio DFD, ETP, TR, Pricing — sem alteração de `modules/core/contracts` nem de `modules/orchestrator/administrative-process-engine.ts`.

Não foi criada estrutura paralela; todos os artefatos estão nos caminhos oficiais.

---

## 2. Modelagem

Implementação em `modules/domain/shared`:

- **AdministrativeDecisionExplanation**  
  - `explanationId`, `targetType`, `targetId`, `summary`, `explanationBlocks`, `hasInconsistency`, `hasIncomplete`, `generatedAt`.
- **ExplanationBlock**  
  - `blockType` (NEED | STRUCTURE | CALCULATION | JUSTIFICATION | COHERENCE | STRATEGY), `title`, `description`, `supportingReferences` (referências aos supportingElements do trace).
- **ExplanationBlockType**  
  - União dos seis tipos acima.

Arquivo:

- `modules/domain/shared/administrative-decision-explanation.types.ts`

Regras de modelagem:

- Explicação **por alvo** (process, item, lot).
- Blocos **estruturados** por etapa do pipeline (sem texto livre inventado).
- **Vínculo com rastreabilidade:** `supportingReferences` são IDs ou referências aos elementos de suporte do `AdministrativeDecisionTrace`.

---

## 3. Engine

Arquivo:

- `modules/domain/shared/administrative-decision-explanation.engine.ts`

Assinatura:

- `executeAdministrativeDecisionExplanationEngine(traces: AdministrativeDecisionTrace[]): AdministrativeDecisionExplanation[]`

Lógica:

- Agrupa `traces` por target (`targetType` + `targetId`).
- Para cada grupo, escolhe um trace (ordenação estável por `moduleId`) e gera uma explicação.
- Converte cada `decisionStep` em `ExplanationBlock`:
  - `blockType` = `stepType`.
  - `title` = `blockType`.
  - `description` = derivada **somente** de `step.description` e de `supportingElements.excerpt` (IDs em `step.supportingElementIds`).
  - `supportingReferences` = `step.supportingElementIds`.
- `summary`: concatenação determinística dos blocos (`blockType: description`).
- `hasInconsistency` e `hasIncomplete` herdados do trace (`hasInconsistency`, `!isComplete`).
- `generatedAt`: valor fixo (epoch ISO) para determinismo.

Regras críticas:

- **Regra 1 — Não inventar texto:** conteúdo apenas de `decisionSteps.description` e `supportingElements.excerpt`.
- **Regra 2 — Estrutura:** cada bloco representa um e apenas um tipo NEED/STRUCTURE/CALCULATION/JUSTIFICATION/COHERENCE/STRATEGY.
- **Regra 3 — Vínculo com rastreabilidade:** cada bloco contém `supportingReferences` ligados aos elementos do trace.
- **Regra 4 — Determinismo:** mesma entrada (mesmos traces) → mesma saída (ordenação estável, `generatedAt` fixo).
- **Regra 5 — Não interferir no fluxo:** não altera decisão, validação nem `shouldHalt`.
- **Regra 6 — Herdar inconsistência/incompletude:** `hasInconsistency` e `hasIncomplete` refletem o trace.

---

## 4. Eventos

Arquivo:

- `modules/shared/event-builders/administrative-decision-explanation-event.builder.ts`

Eventos:

- **ADMINISTRATIVE_DECISION_EXPLANATION_GENERATED**  
  - Payload: `{ totalExplanations, hasInconsistency, hasIncomplete }` (resumido; sem explicação completa).
- **ADMINISTRATIVE_DECISION_EXPLANATION_INCOMPLETE**  
  - Emitido quando existe pelo menos uma explicação com `hasIncomplete: true`.  
  - Payload: `{ totalExplanations, hasIncomplete }`.

Export:

- `modules/shared/event-builders/index.ts` — exporta os builders e `ADMINISTRATIVE_DECISION_EXPLANATION_EVENT_CODES`.

---

## 5. Metadata

Arquivo:

- `modules/shared/metadata/metadata-composer.ts`

Função adicionada:

- `buildDecisionExplanationMetadata(explanations: AdministrativeDecisionExplanation[])`

Shape obrigatório:

```ts
decisionExplanation: {
  hasExplanation: boolean;
  totalExplanations: number;
  hasInconsistency: boolean;
  hasIncomplete: boolean;
}
```

Uso:

- Cada módulo (DFD, ETP, TR, Pricing) chama o engine de explicação após o de trace, monta essa metadata e inclui `...decisionExplanationMeta` no objeto `metadata` do retorno.

---

## 6. Integração

Módulos atualizados (apenas adições; sem alteração de fluxo decisório):

- `modules/domain/dfd/dfd.module.ts`
- `modules/domain/etp/etp.module.ts`
- `modules/domain/tr/tr.module.ts`
- `modules/domain/pricing/pricing.module.ts`

Regra de integração:

- Executar **exatamente após** o bloco DecisionTrace (uso dos `decisionTraces` já calculados).
- Calcular `decisionExplanations = executeAdministrativeDecisionExplanationEngine(decisionTraces)`.
- Calcular `decisionExplanationMeta = buildDecisionExplanationMetadata(decisionExplanations)`.
- Emitir `ADMINISTRATIVE_DECISION_EXPLANATION_GENERATED` sempre.
- Emitir `ADMINISTRATIVE_DECISION_EXPLANATION_INCOMPLETE` quando `decisionExplanationMeta.decisionExplanation.hasIncomplete === true`.
- Incluir `...decisionExplanationMeta` em `metadata`.
- **Não alterar:** `shouldHalt`, `validation.valid`, `validation.hasBlocking`, `result`.

Arquivos proibidos (não alterados):

- `modules/core/contracts/module-input.contract.ts`
- `modules/core/contracts/module-output.contract.ts`
- `modules/orchestrator/administrative-process-engine.ts`

---

## 7. Testes

Arquivo:

- `modules/domain/shared/administrative-decision-explanation.test.ts`

Cenários cobertos:

1. **Explicação por item** — existe explicação para item com 6 blocos e tipos corretos.
2. **Explicação por processo** — existe explicação para targetType `process`.
3. **Explicação por lote** — existe explicação para targetType `lot` com 6 blocos.
4. **Explicação com inconsistência** — pelo menos uma explicação com `hasInconsistency === true` quando o trace tem inconsistência.
5. **Explicação incompleta** — `hasIncomplete === true` quando o trace tem `isComplete === false`.
6. **Determinismo** — mesma entrada (traces) → mesma saída (explanations) via `deepEqual`.
7. **Integridade dos supportingReferences** — cada `supportingReference` existe em `supportingElements` do trace correspondente.
8. **Vínculo real com DecisionTrace** — blocos correspondem 1:1 aos steps; `supportingReferences` igual a `supportingElementIds` do step; description contém a do step.
9. **Ausência de conteúdo inventado** — cada `block.description` contém o `step.description` do step correspondente.
10. **generatedAt estável** — valor igual ao epoch ISO para determinismo.

---

## 8. Regressão

Suítes a executar (obrigatório):

- administrative-decision-explanation
- administrative-decision-trace
- administrative-document-consistency
- administrative-need
- administrative-justification
- procurement-strategy
- administrative-coherence
- calculation-memory
- administrative-process-engine

Objetivo: **regressão zero**; nenhuma alteração de comportamento em validação, decisão ou parada do fluxo.

---

## 9. Riscos

- **Múltiplos traces por target:** o engine agrupa por target e escolhe um trace por grupo (ordenação estável por `moduleId`). Se no futuro houver mais de um módulo gerando trace para o mesmo target, a escolha permanece determinística.
- **Excerpts longos:** a descrição do bloco concatena excerpts; textos muito longos podem gerar strings grandes; não há truncamento no engine (pode ser tratado na camada de apresentação se necessário).
- **Manutenção do shape:** qualquer alteração em `AdministrativeDecisionTrace` ou em `DecisionStepType` deve ser refletida em `ExplanationBlockType` e na lógica do engine para manter o vínculo.

---

## 10. Nota técnica final

A Fase 30 implementa o **Motor de Explicabilidade Consolidada** a partir dos traces da Fase 29, sem NLP, sem texto inventado e sem alterar o fluxo decisório.

Critérios de aprovação atendidos:

- Explicações estruturadas por alvo (process, item, lot) com blocos NEED/STRUCTURE/CALCULATION/JUSTIFICATION/COHERENCE/STRATEGY.
- Nenhuma informação inventada; conteúdo derivado apenas de `decisionSteps.description` e `supportingElements.excerpt`.
- Vínculo com o trace preservado via `supportingReferences` e correspondência 1:1 entre blocos e steps.
- Inconsistências e incompletude visíveis em `hasInconsistency` e `hasIncomplete`.
- Determinismo garantido por ordenação estável e `generatedAt` fixo.
- Integração passiva nos quatro módulos; eventos e metadata adicionados sem alterar `result`, `shouldHalt` ou validações.
- Arquivos proibidos (module-input, module-output, administrative-process-engine) preservados.

O LICITAIA V2 passa a **validar, rastrear e explicar** decisões administrativas de forma estruturada e auditável, com a Fase 30 fechando o pipeline de explicabilidade consolidada após a rastreabilidade (Fase 29).
