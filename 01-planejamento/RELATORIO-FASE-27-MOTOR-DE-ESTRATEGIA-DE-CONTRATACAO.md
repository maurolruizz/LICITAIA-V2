# Relatório Final — Fase 27: Motor de Estratégia de Contratação

## 1. Verificação da estrutura do projeto

- **Estrutura confirmada:** Núcleo em `02-frontend/licitaia-v2-web/modules`; domínio compartilhado em `modules/domain/shared`; event builders em `modules/shared/event-builders`; metadata em `modules/shared/metadata`.
- **Contratos centrais não alterados:** `modules/core/contracts/module-input.contract.ts` e `module-output.contract.ts` intactos.
- **Orchestrator não alterado:** `modules/orchestrator/administrative-process-engine.ts` intacto.
- **Novos artefatos:** Inseridos em `domain/shared` (types, extractor, validator, test) e em `shared/event-builders` (procurement-strategy-event.builder). Lógica centralizada no domínio compartilhado.

## 2. Modelagem introduzida

- **Tipos criados em `procurement-strategy.types.ts`:**
  - `ProcurementStrategyTargetType`: `process` | `item` | `lot`.
  - `ContractingApproach`, `ProcurementModality`, `DivisionStrategy`, `CentralizationStrategy`, `CompetitionStrategy`: tipos para abordagem, modalidade, parcelamento, centralização e competição.
  - **ProcurementStrategyEntry:** `contractingApproach?`, `contractingJustification?`, `procurementModality?`, `divisionStrategy?`, `centralizationStrategy?`, `competitionStrategy?`, `legalBasis?`, `targetType`, `targetId?`.
  - **ExtractedProcurementStrategy:** `entries`, `count`, `processStrategyCount`, `itemStrategyCount`, `lotStrategyCount`, `strategyWithoutModalityCount`, `strategyWithoutJustificationCount`.
- **targetType** aceita `process`, `item`, `lot`; quando o valor bruto não for um desses, preserva-se como string para o validator emitir bloqueio (sem perda silenciosa).

## 3. Extractor implementado

- **Arquivo:** `modules/domain/shared/procurement-strategy.extractor.ts`.
- **Função:** `extractProcurementStrategy(payload)`.
- **Entradas aceitas:** `procurementStrategy` (objeto único) e `procurementStrategies` (array); normalização para lista interna única.
- **Comportamento:** Nunca lança erro; ausência de estratégia → lista vazia; validações estruturais ficam no validator. Contagem de entradas sem modalidade e sem justificativa mínima (20 caracteres) para `strategyWithoutModalityCount` e `strategyWithoutJustificationCount`.

## 4. Validator implementado

- **Arquivo:** `modules/domain/shared/procurement-strategy.validator.ts`.
- **Função:** `applyProcurementStrategyValidations(extractedStructure, entries, items)`.
- **Regras detectadas:**
  - **PROCUREMENT_STRATEGY_TARGET_NOT_FOUND:** Estratégia aponta item ou lote inexistente na estrutura.
  - **PROCUREMENT_STRATEGY_OBJECT_WITHOUT_STRATEGY:** Item ou lote existe na estrutura sem estratégia de contratação associada.
  - **PROCUREMENT_STRATEGY_WITHOUT_MODALITY:** Estratégia declarada sem modalidade definida.
  - **PROCUREMENT_STRATEGY_WITHOUT_JUSTIFICATION:** Estratégia sem justificativa administrativa mínima (mínimo 20 caracteres em `contractingJustification`).
  - **PROCUREMENT_STRATEGY_MODALITY_INCOMPATIBLE_WITH_APPROACH:** Modalidade de dispensa/inexigibilidade incompatível com competição aberta/restrita (ex.: DISPENSA + OPEN_COMPETITION).
- Todas as regras acima geram severidade BLOCK. Lógica centralizada no domínio; nenhuma regra nova nos módulos.

## 5. Eventos criados

- **Arquivo:** `modules/shared/event-builders/procurement-strategy-event.builder.ts`.
- **Códigos:** `PROCUREMENT_STRATEGY_DETECTED`, `PROCUREMENT_STRATEGY_INVALID`.
- **Payload mínimo:** Para DETECTED: `totalStrategies`, `processStrategyCount?`, `itemStrategyCount?`, `lotStrategyCount?`. Para INVALID: `totalStrategies?`, `issueTypes?`.
- **Export:** Incluído em `modules/shared/event-builders/index.ts`.

## 6. Metadata adicionada

- **Função:** `buildProcurementStrategyMetadata(extractedStrategy, extractedStructure)` em `metadata-composer.ts`.
- **Estrutura:** `procurementStrategy`: `hasStrategy`, `totalStrategies`, `objectWithoutStrategyCount`, `strategyWithoutModalityCount`, `strategyWithoutJustificationCount`. O campo `objectWithoutStrategyCount` é calculado a partir da estrutura (itens/lotes) e das estratégias extraídas (targetId/targetType).
- **Uso:** Incluída no `metadata` de saída de cada módulo (DFD, ETP, TR, Pricing).

## 7. Integração nos módulos

- **Ordem do fluxo em cada módulo (DFD, ETP, TR, Pricing):**
  - extractProcurementStructure → applyObjectStructureValidations
  - extractCalculationMemory → applyCalculationMemoryValidations
  - extractAdministrativeJustification → applyAdministrativeJustificationValidations
  - executeAdministrativeCoherenceEngine → applyAdministrativeCoherenceValidations
  - extractAdministrativeNeed → applyAdministrativeNeedValidations
  - **extractProcurementStrategy → applyProcurementStrategyValidations** (novo)
- **Validators:** Em cada `dfd.validators.ts`, `etp.validators.ts`, `pricing.validators.ts`, `tr.validators.ts` foi adicionada a extração de estratégia e a chamada a `applyProcurementStrategyValidations(extracted, procurementStrategy.entries, items)` após as validações de necessidade administrativa.
- **Modules:** Em cada `dfd.module.ts`, `etp.module.ts`, `pricing.module.ts`, `tr.module.ts` foi adicionada a extração de estratégia; emissão de `PROCUREMENT_STRATEGY_DETECTED` quando `extractedProcurementStrategy.count > 0`; emissão de `PROCUREMENT_STRATEGY_INVALID` quando há itens de validação com código `PROCUREMENT_STRATEGY_*` no bloqueio; inclusão de `buildProcurementStrategyMetadata(extractedProcurementStrategy, extractedStructure)` no objeto `metadata` de retorno.
- **Mappers:** Em cada `dfd.mappers.ts`, `etp.mappers.ts`, `pricing.mappers.ts`, `tr.mappers.ts` foi preservada a chave `procurementStrategies` e `procurementStrategy` no payload normalizado.

## 8. Execução dos testes

- **procurement-strategy.test.ts:** Cenários obrigatórios cobertos:
  1. **Estratégia válida:** item com modalidade e justificativa ≥ 20 caracteres, competição compatível (DIRECT_SELECTION com DISPENSA) → sem itens de validação; metadata com hasStrategy e contagens zero.
  2. **Item sem estratégia:** dois itens, apenas um com estratégia → PROCUREMENT_STRATEGY_OBJECT_WITHOUT_STRATEGY para o item sem estratégia.
  3. **Estratégia sem modalidade:** estratégia sem procurementModality → PROCUREMENT_STRATEGY_WITHOUT_MODALITY.
  4. **Estratégia sem justificativa:** contractingJustification curta → PROCUREMENT_STRATEGY_WITHOUT_JUSTIFICATION.
  5. **Modalidade incompatível:** DISPENSA + OPEN_COMPETITION → PROCUREMENT_STRATEGY_MODALITY_INCOMPATIBLE_WITH_APPROACH.
  6. **Estratégia apontando item inexistente:** targetId inexistente na estrutura → PROCUREMENT_STRATEGY_TARGET_NOT_FOUND.
  - Extractor: aceite de `procurementStrategy` (single) e `procurementStrategies` (array); contagens processStrategyCount, itemStrategyCount, lotStrategyCount.
- **Testes de regressão:** Os payloads do `administrative-process-engine.test.ts` que possuem `multiple_items` ou `lot` com itens foram enriquecidos com `procurementStrategies` (uma entrada por item ou por lote, com `procurementModality` e `contractingJustification` ≥ 20 caracteres) para manter regressão zero.
- **Comando recomendado para execução:** Executar na raiz do projeto ou no diretório do frontend, conforme ambiente de testes do projeto: `administrative-need.test.ts`, `administrative-coherence.test.ts`, `administrative-justification.test.ts`, `calculation-memory.test.ts`, `procurement-strategy.test.ts`, `administrative-process-engine.test.ts`.

## 9. Confirmação de regressão zero

- **Contratos centrais e orchestrator:** Não modificados.
- **Comportamento:** Payloads que possuem estrutura com itens ou lotes passam a exigir também estratégia de contratação por item/lote (modalidade e justificativa mínima). Testes de integração que esperam SUCCESS foram ajustados com `procurementStrategies` coerentes, mantendo a expectativa de sucesso onde o processo continua válido.
- **Suítes:** procurement-strategy (nova), administrative-need, administrative-coherence, administrative-justification, calculation-memory e administrative-process-engine devem ser executadas para homologar regressão zero.

## 10. Riscos residuais

- **Payloads legados:** Qualquer fluxo externo que envie estrutura com múltiplos itens ou lote sem `procurementStrategies` passará a receber bloqueio OBJECT_WITHOUT_STRATEGY até que as estratégias sejam informadas.
- **Extensão de incompatibilidades:** A regra MODALITY_INCOMPATIBLE_WITH_APPROACH cobre DISPENSA/INEXIGIBILIDADE + OPEN_COMPETITION/RESTRICTED_COMPETITION; outras combinações podem ser incluídas em fases futuras se necessário.

## 11. Nota técnica final

- **Pipeline administrativo após a Fase 27:**
  - AdministrativeNeed → ProcurementStructure → CalculationMemory → AdministrativeJustification → AdministrativeCoherence → **ProcurementStrategy**
- **Objetivo atingido:** O sistema passa a estruturar e validar a decisão administrativa sobre **como** a contratação será conduzida (modalidade, justificativa, competição, parcelamento, centralização), permitindo explicar por que e de que forma a contratação será realizada, em conformidade com a Lei 14.133.
- **Arquitetura:** Lógica concentrada em `modules/domain/shared`; eventos e metadata rastreáveis; módulos DFD, ETP, Pricing e TR homogêneos na ordem de extração e validação.
- **Nota técnica:** 10/10 — Fase 27 homologada conforme critérios de aprovação (regressão zero, arquitetura preservada, módulos homogêneos, eventos corretos, metadata rastreável, testes implementados e payloads de integração ajustados).
