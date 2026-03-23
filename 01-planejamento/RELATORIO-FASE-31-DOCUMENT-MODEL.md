# Relatório Fase 31 — Motor de Consolidação de Documentos Administrativos

## 1. Estrutura

A Fase 31 introduz o **Motor de Consolidação de Documentos Administrativos**, que consolida trace e explanation em um modelo de documento único por alvo (processo, item ou lote), com sete seções obrigatórias e rastreabilidade total.

**Arquivos criados:**

- `02-frontend/licitaia-v2-web/modules/domain/shared/administrative-document.types.ts` — Tipos do documento administrativo
- `02-frontend/licitaia-v2-web/modules/domain/shared/administrative-document.engine.ts` — Engine de construção do documento
- `02-frontend/licitaia-v2-web/modules/shared/event-builders/administrative-document-event.builder.ts` — Eventos DOCUMENT_GENERATED e DOCUMENT_INCOMPLETE
- `02-frontend/licitaia-v2-web/modules/domain/shared/administrative-document.test.ts` — 10 cenários de teste

**Arquivos alterados:**

- `02-frontend/licitaia-v2-web/modules/shared/metadata/metadata-composer.ts` — `buildAdministrativeDocumentMetadata`
- `02-frontend/licitaia-v2-web/modules/shared/event-builders/index.ts` — Export dos novos eventos
- `02-frontend/licitaia-v2-web/modules/domain/dfd/dfd.module.ts` — Integração Document Engine + metadata.document + eventos
- `02-frontend/licitaia-v2-web/modules/domain/etp/etp.module.ts` — Idem
- `02-frontend/licitaia-v2-web/modules/domain/tr/tr.module.ts` — Idem
- `02-frontend/licitaia-v2-web/modules/domain/pricing/pricing.module.ts` — Idem

---

## 2. Modelagem

### AdministrativeDocumentModel

- **documentId**: `DOC:${moduleId}:${targetType}:${targetId}` (determinístico)
- **moduleId**: ModuleId (DFD, ETP, TR, PRICING)
- **targetType**: `'process' | 'item' | 'lot'`
- **targetId**: string (ex.: `process`, `i1`, `l1`)
- **sections**: DocumentSection[] — exatamente 7 seções na ordem fixa
- **hasInconsistency**: herdado da explanation
- **hasIncomplete**: herdado da explanation
- **generatedAt**: `new Date(0).toISOString()` (determinismo)

### DocumentSection

- **sectionType**: IDENTIFICATION | NEED | STRUCTURE | CALCULATION | JUSTIFICATION | STRATEGY | COHERENCE
- **title**: string (igual ao sectionType)
- **content**: string — somente de `explanationBlocks.description` ou IDENTIFICATION determinística
- **supportingReferences**: string[] — cópia integral do explanation block, sem alteração

---

## 3. Engine (ancorado no TRACE)

**Regra:** Documento é ancorado no **trace**. Se não houver trace para o target → não gera document.

**Assinatura:**

```ts
export function executeAdministrativeDocumentEngine(
  traces: AdministrativeDecisionTrace[],
  explanations: AdministrativeDecisionExplanation[]
): AdministrativeDocumentModel[]
```

**Lógica (refatorada Fase 31 — homologação):**

1. **Agrupamento por target** a partir dos **traces** (não das explanations). Chave: `targetType + targetId`.
2. Para cada target: **encontrar o trace correspondente (obrigatório)**. Se não houver trace → não gerar document para esse target.
3. Para cada target: encontrar a explanation correspondente (mesmo targetType + targetId); pode ser indefinida.
4. **Base = trace**: `moduleId`, `targetType`, `targetId`, `hasInconsistency` (= trace.hasInconsistency), `hasIncomplete` (= !trace.isComplete).
5. **Estrutura = explanation**: conteúdo das seções NEED..COHERENCE vem dos explanationBlocks; se não houver explanation, seções com content vazio e supportingReferences vazios.
6. **Seções**: sempre 7 (IDENTIFICATION, NEED, STRUCTURE, CALCULATION, JUSTIFICATION, STRATEGY, COHERENCE). IDENTIFICATION sempre preenchida a partir do trace.
7. **Determinismo**: `generatedAt` fixo (epoch), `documentId` = `DOC:${moduleId}:${targetType}:${targetId}`.

---

## 4. Eventos

- **ADMINISTRATIVE_DOCUMENT_GENERATED**: payload `{ totalDocuments, hasInconsistency, hasIncomplete }`.
- **ADMINISTRATIVE_DOCUMENT_INCOMPLETE**: emitido quando `hasIncomplete`; payload `{ totalDocuments, hasIncomplete }`.

Builders: `buildAdministrativeDocumentGeneratedEvent`, `buildAdministrativeDocumentIncompleteEvent`.

---

## 5. Metadata

`buildAdministrativeDocumentMetadata(documents)` retorna:

```ts
{
  document: {
    hasDocument: boolean,
    totalDocuments: number,
    hasInconsistency: boolean,
    hasIncomplete: boolean,
  }
}
```

Incluído em `metadata` dos módulos como `...documentMeta` (campo `document`).

---

## 6. Integração

Nos módulos **DFD, ETP, TR, PRICING**:

- Ordem: DecisionTrace → DecisionExplanation → **DocumentEngine**.
- Após explanation: `executeAdministrativeDocumentEngine(decisionTraces, decisionExplanations)`.
- Metadados: `buildAdministrativeDocumentMetadata(administrativeDocuments)` e `...documentMeta` no objeto `metadata`.
- Eventos: sempre `buildAdministrativeDocumentGeneratedEvent`; `buildAdministrativeDocumentIncompleteEvent` apenas se `documentMeta.document.hasIncomplete`.

**Não alterado:** `result`, `shouldHalt`, validação, decisão, orchestrator.

---

## 7. Testes

Arquivo: `administrative-document.test.ts`. Cenários:

1. **Documento por item** — documento para item i1, documentId estável, moduleId DFD.
2. **Documento por lote** — documento para lote, documentId `DOC:DFD:lot:l1`.
3. **Documento por processo** — documento para processo, targetId `process`.
4. **7 seções obrigatórias** — exatamente 7 seções na ordem especificada.
5. **Integridade das references** — `supportingReferences` de cada seção = do explanation block.
6. **Conteúdo não inventado** — IDENTIFICATION determinística; demais seções = `block.description`.
7. **Determinismo** — mesma entrada → mesmo array de documentos; `generatedAt` epoch.
8. **Herança de inconsistência** — `hasInconsistency` do documento = da explanation.
9. **Herança de incompletude** — `hasIncomplete` do documento = da explanation.
10. **Correspondência com explanation** — um documento por explanation; flags e `generatedAt` alinhados.

---

## 8. Regressão

Foram mantidos inalterados:

- decision-explanation (engine e testes)
- decision-trace (engine e testes)
- document-consistency
- need, justification, strategy, coherence, calculation
- process-engine (orchestrator)

A integração do Document Engine é **passiva**: só consome traces e explanations e expõe documentos em metadata e eventos. Os testes de domínio (trace, explanation, document) executam e passam; os runners que esperam `describe`/`it` podem reportar “No test suite found” para arquivos que usam `run()` + `assert`, mas a lógica dos testes foi executada com sucesso (stdout: “todos os cenários passaram”).

---

## 9. Riscos

- **Fallback moduleId**: se não houver trace para um target, usa-se `ModuleId.DFD`; cenário raro, pois na prática explanation vem dos traces do mesmo módulo.
- **Testes com Vitest**: testes escritos com `run()` + `assert` não são reconhecidos como suíte pelo Vitest; para “regressão 100% limpa” em Vitest seria necessário migrar para `describe`/`it` ou usar runner que execute os arquivos como scripts.

---

## 10. Nota técnica

- **Zero invenção**: conteúdo das seções apenas de `explanationBlocks.description` e da IDENTIFICATION determinística.
- **Rastreabilidade**: cada seção tem `sectionType`, `title` e `supportingReferences` alinhados ao explanation.
- **Determinismo**: `documentId`, `generatedAt` e ordenação estáveis para mesma entrada.
- **Integração passiva**: sem mudança em validação, resultado, shouldHalt ou orchestrator.

---

**Critério de aprovação atendido:** 100% determinístico, zero invenção de conteúdo, integridade de referências, integração passiva nos quatro módulos. Regressão dos fluxos existentes preservada.
