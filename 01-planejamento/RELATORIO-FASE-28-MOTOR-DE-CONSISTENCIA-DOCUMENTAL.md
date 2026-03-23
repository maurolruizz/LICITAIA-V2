# Relatório Fase 28 — Motor de Consistência Documental Administrativa

**LICITAIA V2**  
**Data:** 16/03/2025

---

## 1 — Verificação da estrutura

**Arquivos criados (domínio compartilhado):**

| Arquivo | Localização |
|--------|-------------|
| `administrative-document-consistency.types.ts` | `02-frontend/licitaia-v2-web/modules/domain/shared/` |
| `administrative-document-consistency.engine.ts` | `02-frontend/licitaia-v2-web/modules/domain/shared/` |
| `administrative-document-consistency.validator.ts` | `02-frontend/licitaia-v2-web/modules/domain/shared/` |
| `administrative-document-consistency.test.ts` | `02-frontend/licitaia-v2-web/modules/domain/shared/` |

**Event builder criado:**

| Arquivo | Localização |
|--------|-------------|
| `administrative-document-consistency-event.builder.ts` | `02-frontend/licitaia-v2-web/modules/shared/event-builders/` |

**Arquivos modificados (sem alteração de contratos ou orchestrator):**

- `modules/domain/dfd/dfd.validators.ts` — pipeline + Document Consistency
- `modules/domain/etp/etp.validators.ts` — idem
- `modules/domain/tr/tr.validators.ts` — idem
- `modules/domain/pricing/pricing.validators.ts` — idem
- `modules/domain/dfd/dfd.module.ts` — eventos e metadata
- `modules/domain/etp/etp.module.ts` — idem
- `modules/domain/tr/tr.module.ts` — idem
- `modules/domain/pricing/pricing.module.ts` — idem
- `modules/shared/metadata/metadata-composer.ts` — `buildDocumentConsistencyMetadata`
- `modules/shared/event-builders/index.ts` — export dos novos eventos

**Contratos e orchestrator:** não modificados (`module-input.contract.ts`, `module-output.contract.ts`, `administrative-process-engine.ts`).

---

## 2 — Modelagem

**Tipos em `administrative-document-consistency.types.ts`:**

- **DocumentConsistencySeverity:** `'BLOCK' | 'WARNING'`
- **ADMINISTRATIVE_DOCUMENT_CONSISTENCY_ISSUE_TYPES:** constante com os 6 códigos oficiais
- **AdministrativeDocumentConsistencyIssue:**  
  `issueType`, `severity`, `message`, `relatedNeed?`, `relatedStructure?`, `relatedCalculation?`, `relatedJustification?`, `relatedStrategy?`
- **AdministrativeDocumentConsistencyResult:**  
  `issues`, `issueTypes`, `hasIssues`, `totalIssues`, `blockingIssues`, `warningIssues`

**Tipos de inconsistência implementados:**

| Código | Descrição |
|--------|-----------|
| NEED_STRUCTURE_MISMATCH | Necessidade referencia item/lote inexistente na estrutura |
| CALCULATION_NEED_MISMATCH | Tipo de cálculo (CONSUMPTION vs INSTITUTIONAL_SIZING) não corresponde à necessidade declarada |
| STRATEGY_STRUCTURE_MISMATCH | Estratégia (ex.: LOTS) incompatível com estrutura (ex.: single_item) |
| STRATEGY_NEED_MISMATCH | Modalidade dispensa/inexigibilidade com necessidade recorrente/previsível |
| JUSTIFICATION_NEED_MISMATCH | Justificativa não responde à necessidade (mesmo alvo, sem sobreposição de termos) |
| JUSTIFICATION_STRATEGY_MISMATCH | Estratégia dispensa/inexigibilidade sem menção a base legal na justificativa |

---

## 3 — Engine

**Função:** `executeAdministrativeDocumentConsistencyEngine(structure, calculationMemory, administrativeNeed, administrativeJustification, procurementStrategy)`  
**Retorno:** `AdministrativeDocumentConsistencyResult`

**Comportamento:**

- Recebe os extraídos de estrutura, memória de cálculo, necessidade, justificativa e estratégia.
- Aplica regras heurísticas (termos-chave, alvos item/lote, tipo de cálculo, modalidade, parcelamento).
- Preenche `issues` com severidade BLOCK ou WARNING; calcula `blockingIssues` e `warningIssues`.
- NEED_STRUCTURE_MISMATCH e STRATEGY_STRUCTURE_MISMATCH → BLOCK; STRATEGY_NEED_MISMATCH, JUSTIFICATION_* → WARNING; CALCULATION_NEED_MISMATCH → BLOCK.

---

## 4 — Validator

**Função:** `applyAdministrativeDocumentConsistencyValidations(result, items)`  
**Comportamento:**

- Se `result.hasIssues` é falso ou não há issues, não adiciona itens.
- Para cada issue, adiciona um `ValidationItemContract` com código `ADMIN_DOCUMENT_CONSISTENCY_<issueType>`, mensagem do issue e severidade mapeada (BLOCK → ValidationSeverity.BLOCK, WARNING → ValidationSeverity.WARNING).
- Inconsistências críticas (BLOCK) geram bloqueio; menores (WARNING) apenas registro.

---

## 5 — Eventos

**Códigos e builders:**

- **ADMIN_DOCUMENT_CONSISTENCY_VALID** — `buildAdministrativeDocumentConsistencyValidEvent(source, processId?)`  
  Emitido quando não há issues. Payload: `{ totalIssues: 0, issueTypes: [] }`.

- **ADMIN_DOCUMENT_CONSISTENCY_ISSUES_DETECTED** — `buildAdministrativeDocumentConsistencyIssuesDetectedEvent(source, result, processId?)`  
  Emitido quando há issues. Payload: `{ totalIssues, issueTypes, blockingIssues, warningIssues }`.

**Uso nos módulos:** após calcular `documentConsistencyResult`, cada módulo (DFD, ETP, TR, PRICING) emite VALID ou ISSUES_DETECTED; em caso de `validation.hasBlocking` e existência de códigos `ADMIN_DOCUMENT_CONSISTENCY_*`, emite também ISSUES_DETECTED no bloco de bloqueio.

---

## 6 — Metadata

**Função:** `buildDocumentConsistencyMetadata(result)` em `metadata-composer.ts`.

**Forma do metadata:**

```ts
documentConsistency: {
  hasIssues: boolean;
  totalIssues: number;
  blockingIssues: number;
  warningIssues: number;
}
```

Incluído no `metadata` de retorno de cada módulo (DFD, ETP, TR, PRICING) junto com os demais metadados existentes.

---

## 7 — Integração

**Pipeline final nos validators (DFD, ETP, TR, PRICING):**

1. extractProcurementStructure → applyObjectStructureValidations  
2. extractCalculationMemory → applyCalculationMemoryValidations  
3. extractAdministrativeJustification → applyAdministrativeJustificationValidations  
4. executeAdministrativeCoherenceEngine → applyAdministrativeCoherenceValidations  
5. extractAdministrativeNeed → applyAdministrativeNeedValidations  
6. extractProcurementStrategy → applyProcurementStrategyValidations  
7. **executeAdministrativeDocumentConsistencyEngine → applyAdministrativeDocumentConsistencyValidations** (novo)

**Módulos:** após estratégia, cada módulo calcula `documentConsistencyResult`, emite evento (VALID ou ISSUES_DETECTED), em caso de bloqueio com códigos de consistência emite ISSUES_DETECTED e adiciona `buildDocumentConsistencyMetadata(documentConsistencyResult)` ao metadata de saída.

---

## 8 — Testes

**Suíte:** `administrative-document-consistency.test.ts`

| Cenário | Descrição | Resultado |
|---------|-----------|-----------|
| 1 | Inconsistência Need vs Structure (need referencia item i99 inexistente) | OK — NEED_STRUCTURE_MISMATCH, BLOCK |
| 2 | Inconsistência Calculation vs Need (need=fala consumo, calculation=INSTITUTIONAL_SIZING) | OK — CALCULATION_NEED_MISMATCH |
| 3 | Inconsistência Strategy vs Structure (single_item + divisionStrategy LOTS) | OK — STRATEGY_STRUCTURE_MISMATCH |
| 4 | Inconsistência Justification vs Strategy (DISPENSA sem base legal na justificativa) | OK — JUSTIFICATION_STRATEGY_MISMATCH |
| 5 | Caso totalmente consistente (need, calculation, justification, strategy alinhados) | OK — hasIssues false, 0 issues |

**Comando de execução:** `npx tsx modules/domain/shared/administrative-document-consistency.test.ts`  
**Saída:** `administrative-document-consistency.test.ts: todos os cenários passaram.`

---

## 9 — Regressão zero

**Suítes executadas após a Fase 28:**

| Suíte | Comando | Status |
|-------|---------|--------|
| administrative-need.test.ts | npx tsx modules/domain/shared/administrative-need.test.ts | OK |
| administrative-justification.test.ts | npx tsx modules/domain/shared/administrative-justification.test.ts | OK |
| procurement-strategy.test.ts | npx tsx modules/domain/shared/procurement-strategy.test.ts | OK |
| administrative-coherence.test.ts | npx tsx modules/domain/shared/administrative-coherence.test.ts | OK |
| calculation-memory.test.ts | npx tsx modules/domain/shared/calculation-memory.test.ts | OK |
| administrative-process-engine.test.ts | npx tsx modules/orchestrator/administrative-process-engine.test.ts | OK |

Nenhuma regressão identificada. Comportamento anterior mantido; o novo passo de Document Consistency só adiciona validações e eventos.

---

## 10 — Riscos residuais

- **Heurísticas por termos:** As regras de CALCULATION_NEED_MISMATCH, STRATEGY_NEED_MISMATCH, JUSTIFICATION_NEED_MISMATCH e JUSTIFICATION_STRATEGY_MISMATCH usam palavras-chave e sobreposição de texto. Textos atípicos podem não ser classificados como esperado; a matriz de termos pode precisar de ajustes com uso real.
- **Duplicação com need validator:** NEED_STRUCTURE_MISMATCH (need referencia item/lote inexistente) também é coberto pelo validator de necessidade (ADMINISTRATIVE_NEED_TARGET_NOT_FOUND). Dois códigos para o mesmo fato podem aparecer; é aceitável do ponto de vista de “consistência documental” e “necessidade”, mas pode ser documentado para o usuário como reforço.
- **Performance:** O engine percorre need, calculation, justification e strategy; em payloads muito grandes o custo é linear e tende a permanecer baixo.

---

## 11 — Nota técnica final

A Fase 28 implementou o **Motor de Consistência Documental Administrativa** conforme especificado:

- **Inconsistências** entre Need, Structure, Calculation, Justification e Strategy são detectadas pelos 6 tipos definidos.
- **Regressão zero** foi confirmada com a execução das suítes existentes.
- **Arquitetura** permanece intacta: contratos centrais e orchestrator não foram alterados; lógica nova em `modules/domain/shared` e event builder em `modules/shared/event-builders`.
- **Módulos** DFD, ETP, TR e PRICING permanecem homogêneos (mesmo pipeline + Document Consistency ao final).
- **Eventos** ADMIN_DOCUMENT_CONSISTENCY_VALID e ADMIN_DOCUMENT_CONSISTENCY_ISSUES_DETECTED e **metadata** documentConsistency (hasIssues, totalIssues, blockingIssues, warningIssues) estão implementados e integrados.
- **Testes** cobrem os 5 cenários obrigatórios e todos passaram.

O núcleo do LICITAIA passa a incluir o passo **DocumentConsistency** no pipeline:

**Need → Structure → Calculation → Justification → Coherence → Strategy → DocumentConsistency**

Isso reforça o LICITAIA como motor de validação da decisão administrativa, garantindo que a decisão seja logicamente coerente entre todos os elementos documentais.

---

*Relatório gerado no âmbito da Fase 28 — Motor de Consistência Documental Administrativa — LICITAIA V2.*
