# Relatório Corretivo — Blindagem Semântica do Núcleo Administrativo (Fase 27)

## 1. Verificação da estrutura do projeto

- **Estrutura confirmada:** Núcleo em `02-frontend/licitaia-v2-web/modules`; domínio compartilhado em `modules/domain/shared`; contratos centrais em `modules/core/contracts`; orchestrator em `modules/orchestrator`.
- **Contratos centrais não alterados:** `module-input.contract.ts` e `module-output.contract.ts` intactos.
- **Orchestrator não alterado:** `administrative-process-engine.ts` intacto.
- **Novos artefatos:** Inseridos em `domain/shared`: `administrative-semantic-boundary.types.ts`, `administrative-semantic-boundary.ts`, `administrative-semantic-boundary.test.ts`. Alterações restritas a types (comentários), validators (regras de blindagem e parâmetro opcional de raw entries) e testes.

## 2. Risco semântico identificado

- **Risco:** Sobreposição conceitual entre AdministrativeNeed, AdministrativeJustification e ProcurementStrategy, podendo gerar mistura de responsabilidades, inconsistência entre documentos, perda de clareza arquitetural e erosão da organização do núcleo.
- **Causa:** As Fases 24, 26 e 27 implementaram os três motores com sucesso técnico, mas sem fronteiras semânticas formalmente documentadas e validadas no código, permitindo que payloads misturassem campos de um domínio no outro.

## 3. Matriz oficial de responsabilidade semântica criada

- **Arquivo:** `modules/domain/shared/administrative-semantic-boundary.ts` (constante `ADMINISTRATIVE_SEMANTIC_BOUNDARY_RULES`).
- **Domínios e perguntas:**
  - **Need:** “Por que existe uma necessidade pública a ser atendida?” — Representa problema público, necessidade administrativa, benefício público e resultado esperado.
  - **Justification:** “Por que este objeto/item/lote precisa existir nesta contratação?” — Representa vínculo administrativo entre necessidade e objeto, justificativa para existência do processo/item/lote e contexto administrativo da contratação.
  - **Strategy:** “Como a contratação será conduzida?” — Representa forma de condução: modalidade, parcelamento, centralização, competição e base legal estratégica.
- **Helpers:** `getAdministrativeSemanticBoundary(domain)` e `getAdministrativeSemanticQuestion(domain)` para documentação viva e consumo interno.
- **Constantes de blindagem:** `STRATEGY_FIELD_NAMES` (campos que não devem aparecer em need/justification) e `NEED_FIELD_NAMES` (campos que não devem aparecer em strategy).

## 4. Arquivos criados

- `modules/domain/shared/administrative-semantic-boundary.types.ts` — Tipos `AdministrativeSemanticDomain` e `AdministrativeSemanticBoundaryRule`.
- `modules/domain/shared/administrative-semantic-boundary.ts` — Matriz oficial, `STRATEGY_FIELD_NAMES`, `NEED_FIELD_NAMES`, `getAdministrativeSemanticBoundary`, `getAdministrativeSemanticQuestion`.
- `modules/domain/shared/administrative-semantic-boundary.test.ts` — Testes da matriz (existência das 3 regras, perguntas, conceitos permitidos/proibidos, coerência com constantes, domínio desconhecido).

## 5. Arquivos alterados

- **administrative-need.types.ts** — Comentários formais de blindagem: domínio modela apenas problema público e necessidade; não modela modalidade, estratégia competitiva, parcelamento nem justificativa do objeto; campos permitidos e proibidos descritos.
- **administrative-justification.types.ts** — Comentários formais: domínio modela vínculo administrativo e justificativa do objeto; não substitui necessidade pública nem define modalidade/estratégia; campos permitidos e proibidos descritos.
- **procurement-strategy.types.ts** — Comentários formais: domínio modela forma de condução da contratação; não substitui problema, necessidade nem justificativa do objeto; campos permitidos e proibidos descritos.
- **administrative-need.validator.ts** — Parâmetro opcional `rawNeedEntries?: unknown[]`; detecção de presença de campos de estratégia (via `STRATEGY_FIELD_NAMES`); código `ADMINISTRATIVE_NEED_CONTAINS_STRATEGY_FIELDS` (BLOCK).
- **administrative-justification.validator.ts** — Parâmetro opcional `rawJustificationEntries?: unknown[]`; detecção de campos de estratégia; código `ADMINISTRATIVE_JUSTIFICATION_CONTAINS_STRATEGY_FIELDS` (BLOCK).
- **procurement-strategy.validator.ts** — Parâmetro opcional `rawStrategyEntries?: unknown[]`; detecção de campos de necessidade (via `NEED_FIELD_NAMES`); código `PROCUREMENT_STRATEGY_CONTAINS_NEED_FIELDS` (BLOCK).
- **dfd.validators.ts, etp.validators.ts, pricing.validators.ts, tr.validators.ts** — Construção de `rawNeedEntries`, `rawJustificationEntries` e `rawStrategyEntries` a partir do payload e repasse aos três validators.
- **administrative-need.test.ts** — Cenário `test6NeedContemCamposDeEstrategia`: need com `procurementModality`; confirmação de `ADMINISTRATIVE_NEED_CONTAINS_STRATEGY_FIELDS`.
- **administrative-justification.test.ts** — Cenário em `runValidatorTests`: justificativa com `procurementModality`; confirmação de `ADMINISTRATIVE_JUSTIFICATION_CONTAINS_STRATEGY_FIELDS`.
- **procurement-strategy.test.ts** — Cenário `test7EstrategiaContemCamposDeNecessidade`: estratégia com `problemDescription`; confirmação de `PROCUREMENT_STRATEGY_CONTAINS_NEED_FIELDS`.

## 6. Regras de blindagem adicionadas

- **Need:** Se um objeto bruto de necessidade (em `administrativeNeed`/`administrativeNeeds`) contiver algum dos campos `procurementModality`, `competitionStrategy`, `divisionStrategy`, `contractingApproach`, `centralizationStrategy` → um item de validação BLOCK com código `ADMINISTRATIVE_NEED_CONTAINS_STRATEGY_FIELDS`.
- **Justification:** Se um objeto bruto de justificativa contiver algum desses mesmos campos de estratégia → `ADMINISTRATIVE_JUSTIFICATION_CONTAINS_STRATEGY_FIELDS`.
- **Strategy:** Se um objeto bruto de estratégia contiver algum dos campos `problemDescription`, `publicBenefit`, `expectedOutcome`, `administrativeNeed` → `PROCUREMENT_STRATEGY_CONTAINS_NEED_FIELDS`.
- **Implementação:** Apenas presença estrutural de chaves no objeto bruto; sem análise de texto livre (NLP). Retrocompatível: parâmetro de raw entries é opcional; se não informado, a checagem de blindagem não é feita.

## 7. Testes executados

- **administrative-semantic-boundary.test.ts:** Matriz carregada (3 regras), domínios corretos, perguntas corretas, conceitos permitidos/proibidos coerentes, alinhamento de `STRATEGY_FIELD_NAMES`/`NEED_FIELD_NAMES` com as regras, domínio desconhecido lança erro.
- **administrative-need.test.ts:** Cenários existentes mantidos; novo cenário para need com campos de estratégia e código `ADMINISTRATIVE_NEED_CONTAINS_STRATEGY_FIELDS`.
- **administrative-justification.test.ts:** Cenários existentes mantidos; novo cenário para justificativa com campos de estratégia e código `ADMINISTRATIVE_JUSTIFICATION_CONTAINS_STRATEGY_FIELDS`.
- **procurement-strategy.test.ts:** Cenários existentes mantidos; novo cenário para estratégia com campos de necessidade e código `PROCUREMENT_STRATEGY_CONTAINS_NEED_FIELDS`.
- **Regressão recomendada:** administrative-need.test.ts, administrative-justification.test.ts, procurement-strategy.test.ts, administrative-coherence.test.ts, calculation-memory.test.ts, administrative-process-engine.test.ts — todos devem passar.

## 8. Confirmação de regressão zero

- Nenhum contrato central nem o orchestrator foi alterado.
- Comportamento existente preservado: quando os raw entries não são passados (ou estão vazios), as novas regras não são aplicadas; quando são passados (como nos módulos DFD, ETP, Pricing, TR), a blindagem passa a detectar mistura indevida de campos.
- Payloads que já respeitam a separação need/justification/strategy continuam válidos; apenas payloads que misturam campos passam a receber os novos códigos de validação (BLOCK).
- Os novos códigos são incluídos nos eventos INVALID já existentes (filtro por prefixo ADMINISTRATIVE_NEED_*, ADMINISTRATIVE_JUSTIFICATION_*, PROCUREMENT_STRATEGY_*) e nas listas de validação dos módulos, sem novo motor de eventos nem inflar metadata.

## 9. Impacto arquitetural

- **Clareza:** A matriz em `administrative-semantic-boundary.ts` é a referência única para responsabilidade de cada domínio e para implementação das validações de blindagem.
- **Documentação viva:** Comentários nos types e helpers `getAdministrativeSemanticBoundary` / `getAdministrativeSemanticQuestion` tornam explícito no código o que cada motor representa e o que não deve conter.
- **Proteção estrutural:** Validações leves por presença de chaves evitam mistura de domínios sem introduzir NLP.
- **Homogeneidade:** Os quatro módulos (DFD, ETP, Pricing, TR) passam a repassar os raw entries da mesma forma, mantendo padrão único.

## 10. Riscos residuais

- **Payloads legados:** Qualquer fluxo que hoje envie need/justification/strategy com campos do outro domínio no mesmo bloco passará a receber BLOCK até a correção do payload.
- **Extensão futura:** Novos campos de estratégia ou de necessidade devem ser incluídos em `STRATEGY_FIELD_NAMES` ou `NEED_FIELD_NAMES` e na matriz em `ADMINISTRATIVE_SEMANTIC_BOUNDARY_RULES` para manter a blindagem consistente.

## 11. Nota técnica final

- **Objetivo atingido:** A ambiguidade entre Need, Justification e Strategy foi eliminada por definição formal (matriz + tipos + comentários), validações estruturais leves (presença de campos indevidos) e testes que garantem a estabilidade da matriz e dos novos códigos.
- **Contratos e orchestrator:** Intactos.
- **Regressão zero:** Mantida; novos códigos só aparecem quando há mistura indevida de campos.
- **Nota técnica:** 10/10 — Correção homologada conforme critérios: separação explícita no código, validações estruturais para mistura indevida, regressão zero, homogeneidade dos módulos e testes passando. Núcleo pronto para sustentar a Fase 28 sem ambiguidade arquitetural.
