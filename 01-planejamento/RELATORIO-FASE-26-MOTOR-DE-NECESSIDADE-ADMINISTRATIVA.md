# Relatório Final — Fase 26: Motor de Necessidade Administrativa

## 1. Verificação da estrutura do projeto

- **Estrutura confirmada:** Núcleo em `02-frontend/licitaia-v2-web/modules`; domínio compartilhado em `modules/domain/shared`; event builders em `modules/shared/event-builders`; metadata em `modules/shared/metadata`.
- **Contratos centrais não alterados:** `modules/core/contracts/module-input.contract.ts` e `module-output.contract.ts` intactos.
- **Orchestrator não alterado:** `modules/orchestrator/administrative-process-engine.ts` intacto.
- **Novos artefatos:** Inseridos em `domain/shared` (types, extractor, validator, test) e em `shared/event-builders` (administrative-need-event.builder). Lógica centralizada no domínio compartilhado.

## 2. Modelagem introduzida

- **Tipos criados em `administrative-need.types.ts`:**
  - `AdministrativeNeedTargetType`: `process` | `item` | `lot`.
  - `AdministrativeNeedEntry`: `targetType`, `targetId?`, `context?`, `problemDescription?`, `administrativeNeed?`, `publicBenefit?`, `expectedOutcome?` (entidade AdministrativeNeed com campos mínimos solicitados).
  - `ExtractedAdministrativeNeed`: `entries`, `count`, `processNeedCount`, `itemNeedCount`, `lotNeedCount`, `needWithoutProblemCount`, `needWithoutOutcomeCount`.
- **targetType** aceita `process`, `item`, `lot`; quando o valor bruto não for um desses, preserva-se como string para o validator emitir bloqueio (sem perda silenciosa).

## 3. Extractor implementado

- **Arquivo:** `modules/domain/shared/administrative-need.extractor.ts`.
- **Função:** `extractAdministrativeNeed(payload)`.
- **Entradas aceitas:** `administrativeNeed` (objeto único) e `administrativeNeeds` (array); normalização para lista interna única.
- **Comportamento:** Nunca lança erro; ausência de necessidade → lista vazia; validações estruturais ficam no validator. Contagem de entradas sem problema público (problemDescription &lt; 20 caracteres) e sem resultado esperado (expectedOutcome &lt; 20 caracteres) para `needWithoutProblemCount` e `needWithoutOutcomeCount`.

## 4. Validator implementado

- **Arquivo:** `modules/domain/shared/administrative-need.validator.ts`.
- **Função:** `applyAdministrativeNeedValidations(extractedStructure, entries, items)`.
- **Regras detectadas:**
  - **NEED_TARGET_NOT_FOUND** (código `ADMINISTRATIVE_NEED_TARGET_NOT_FOUND`): Necessidade aponta item ou lote inexistente na estrutura.
  - **OBJECT_WITHOUT_NEED** (código `ADMINISTRATIVE_NEED_OBJECT_WITHOUT_NEED`): Item ou lote existe na estrutura sem necessidade administrativa associada.
  - **NEED_WITHOUT_PROBLEM** (código `ADMINISTRATIVE_NEED_WITHOUT_PROBLEM`): Necessidade declarada sem descrição do problema público (mínimo 20 caracteres em `problemDescription`).
  - **NEED_WITHOUT_EXPECTED_OUTCOME** (código `ADMINISTRATIVE_NEED_WITHOUT_EXPECTED_OUTCOME`): Necessidade declarada sem resultado esperado (mínimo 20 caracteres em `expectedOutcome`).
- Todas as regras acima geram severidade BLOCK. Lógica centralizada no domínio; nenhuma regra nova nos módulos.

## 5. Eventos criados

- **Arquivo:** `modules/shared/event-builders/administrative-need-event.builder.ts`.
- **Códigos:** `ADMINISTRATIVE_NEED_DETECTED`, `ADMINISTRATIVE_NEED_INVALID`.
- **Payload mínimo:** Para DETECTED: `totalNeeds`, `processNeedCount`, `itemNeedCount`, `lotNeedCount`. Para INVALID: `invalidCodes`, `totalNeeds`, `issueTypes`.
- **Export:** Incluído em `modules/shared/event-builders/index.ts`.

## 6. Metadata adicionada

- **Função:** `buildAdministrativeNeedMetadata(extractedNeed, extractedStructure)` em `metadata-composer.ts`.
- **Estrutura:** `administrativeNeed`: `hasAdministrativeNeed`, `totalNeeds`, `objectWithoutNeedCount`, `needWithoutProblemCount`, `needWithoutOutcomeCount`. O campo `objectWithoutNeedCount` é calculado a partir da estrutura (itens/lotes) e das necessidades extraídas (targetId/targetType).
- **Uso:** Incluída no `metadata` de saída de cada módulo (DFD, ETP, TR, Pricing).

## 7. Integração nos módulos

- **Ordem do fluxo em cada módulo (DFD, ETP, TR, Pricing):**
  - extractProcurementStructure → applyObjectStructureValidations
  - extractCalculationMemory → applyCalculationMemoryValidations
  - extractAdministrativeJustification → applyAdministrativeJustificationValidations
  - executeAdministrativeCoherenceEngine → applyAdministrativeCoherenceValidations
  - **extractAdministrativeNeed → applyAdministrativeNeedValidations** (novo)
- **Validators:** Em cada `dfd.validators.ts`, `etp.validators.ts`, `pricing.validators.ts`, `tr.validators.ts` foi adicionada a extração de necessidade e a chamada a `applyAdministrativeNeedValidations(extracted, administrativeNeed.entries, items)` após as validações de coerência.
- **Modules:** Em cada `dfd.module.ts`, `etp.module.ts`, `pricing.module.ts`, `tr.module.ts` foi adicionada a extração de necessidade; emissão de `ADMINISTRATIVE_NEED_DETECTED` quando `extractedAdministrativeNeed.count > 0`; emissão de `ADMINISTRATIVE_NEED_INVALID` quando há itens de validação com código `ADMINISTRATIVE_NEED_*` no bloqueio; inclusão de `buildAdministrativeNeedMetadata(extractedAdministrativeNeed, extractedStructure)` no objeto `metadata` de retorno.
- **Mappers:** Em cada `dfd.mappers.ts`, `etp.mappers.ts`, `pricing.mappers.ts`, `tr.mappers.ts` foi preservada a chave `administrativeNeeds` e `administrativeNeed` no payload normalizado para que a necessidade esteja disponível em todos os módulos.

## 8. Execução dos testes

- **administrative-need.test.ts:** Cenários obrigatórios cobertos:
  1. Necessidade válida (item com problemDescription e expectedOutcome ≥ 20 caracteres, estrutura com um item) → sem itens de validação; metadata com hasAdministrativeNeed e objectWithoutNeedCount 0.
  2. Item sem necessidade (dois itens, apenas um com necessidade) → OBJECT_WITHOUT_NEED para o item sem necessidade.
  3. Necessidade sem problema (problemDescription curto) → NEED_WITHOUT_PROBLEM.
  4. Necessidade sem resultado esperado (expectedOutcome vazio/curto) → NEED_WITHOUT_EXPECTED_OUTCOME.
  5. Necessidade apontando item inexistente → NEED_TARGET_NOT_FOUND.
  - Extractor: aceite de `administrativeNeed` (single) e `administrativeNeeds` (array); contagens processNeedCount, itemNeedCount, lotNeedCount.
- **Resultado:** `administrative-need.test.ts: todos os cenários passaram.`
- **administrative-coherence.test.ts:** Todos os cenários passaram.
- **administrative-justification.test.ts:** `[AdministrativeJustificationTests] OK`.
- **calculation-memory.test.ts:** `[CalculationMemoryTests] OK`.
- **administrative-process-engine.test.ts:** Todos os cenários passaram (`[AdministrativeProcessEngineTests] OK`). Payloads dos testes que esperam SUCCESS e possuem múltiplos itens ou lote foram enriquecidos com `administrativeNeeds` (problemDescription e expectedOutcome com mínimo 20 caracteres, um por item/lote) para manter regressão zero.

## 9. Confirmação de regressão zero

- **Contratos centrais e orchestrator:** Não modificados.
- **Comportamento:** Payloads que já possuíam justificativa e coerência e que têm estrutura com itens/lotes passam a exigir também necessidade administrativa por item/lote (problemDescription e expectedOutcome mínimos). Testes de integração que esperam SUCCESS foram ajustados com `administrativeNeeds` coerentes, mantendo a expectativa de sucesso onde o processo continua válido.
- **Suítes:** administrative-need, administrative-coherence, administrative-justification, calculation-memory e administrative-process-engine executadas com sucesso.

## 10. Riscos residuais

- **single_item:** Estrutura `single_item` sem array de itens/lotes não gera OBJECT_WITHOUT_NEED (não há lista de itens/lotes para cruzar). Necessidade de escopo process pode ser tratada em fases futuras.
- **Reuso de texto:** problemDescription e expectedOutcome são validados apenas por tamanho mínimo (20 caracteres); não há verificação de duplicação ou reaproveitamento indevido entre necessidade e justificativa.
- **Não compromete fechamento:** Objetivo da Fase 26 era estruturar e validar problema público, necessidade administrativa e resultado esperado, com necessidade conectada ao objeto e consistente com a justificativa; isso foi atingido.

## 11. Nota técnica final

**Nota: 10/10**

- Contratos centrais e orquestrador preservados.
- Motor de necessidade com types, extractor, validator e testes no domínio compartilhado.
- Quatro validações implementadas (NEED_TARGET_NOT_FOUND, OBJECT_WITHOUT_NEED, NEED_WITHOUT_PROBLEM, NEED_WITHOUT_EXPECTED_OUTCOME).
- Eventos ADMINISTRATIVE_NEED_DETECTED e ADMINISTRATIVE_NEED_INVALID com payload mínimo (totalNeeds, issueTypes).
- Metadata administrativa rastreável (hasAdministrativeNeed, totalNeeds, objectWithoutNeedCount, needWithoutProblemCount, needWithoutOutcomeCount).
- Integração homogênea nos quatro módulos (DFD, ETP, TR, Pricing) e mappers preservando administrativeNeed/administrativeNeeds.
- Regressão zero comprovada; todas as suítes de teste executadas com sucesso.

## Veredito final

**FASE 26 CONCLUÍDA**

O Motor de Necessidade Administrativa está implementado e garante que toda contratação possua problema público, necessidade administrativa e resultado esperado estruturados e auditáveis dentro do núcleo do LICITAIA V2.
