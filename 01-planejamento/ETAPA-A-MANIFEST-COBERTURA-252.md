# ETAPA A — Manifesto de cobertura normativa (espaço 252 × evidências)

## Espaço cartesiano oficial (252 combinações)

Dimensões em `03-backend-api/licitaia-v2-api/src/phase35/coverage-matrix.ts`:

- `legalRegime`: 3 valores  
- `objectType`: 7 valores  
- `objectStructure`: 3 valores  
- `executionForm`: 4 valores  

**Total:** 3 × 7 × 3 × 4 = **252** combinações teóricas.

## Política oficial de cobertura da ETAPA A (reconciliada)

- O retículo **252** é o **espaço cartesiano de classificação** (`coverage-matrix.ts`): define dimensões e regras de consistência do payload, **sem** exigir 252 execuções distintas do motor.
- A **cobertura homologável** da ETAPA A (Frentes 1 e 2, conforme Matriz de Fechamento) materializa-se nos **7 cenários canônicos** da Fase 35 com estado normativo **SOLID**, evidenciados pelo runner oficial (**7/7 OK**) e pela matriz derivada `DERIVED_COVERAGE_MATRIX_FROM_SCENARIOS` em `canonical-scenarios.ts`.
- **Metadados de módulo:** chaves homónimas entre módulos são isoladas em `modulesMetadata[moduleId]` no resultado do motor; coincidência de **nome** entre módulos distintos **não** é tratada como inconsistência de compliance nem gera item em `validations`.

## Cenários canônicos materializados (Fase 35)

Arquivo: `03-backend-api/licitaia-v2-api/src/phase35/canonical-scenarios.ts`

| ID | Dimensões cobertas | Função na ETAPA A |
|----|--------------------|-------------------|
| S1 | LICITACAO × MATERIAL_CONSUMO × ITEM_UNICO × ENTREGA_UNICA | Pipeline completo + classificadores no payload |
| S2 | DISPENSA × SERVICO_CONTINUO × MULTIPLOS_ITENS × EXECUCAO_CONTINUA | SUCCESS + `CROSS_MODULE_TR_PRICING_NO_OVERLAP` como WARNING |
| S3 | INEXIGIBILIDADE × SERVICO_TECNICO_ESPECIALIZADO × ITEM_UNICO × EXECUCAO_POR_ETAPAS | Pipeline completo + base legal em justificativas |
| S4 | DISPENSA × BEM_PERMANENTE × LOTE × ENTREGA_PARCELADA | Pré-voo `CLASSIFICATION_PAYLOAD_MISMATCH` |
| S5 | DISPENSA × SERVICO_COMUM × ITEM_UNICO × ENTREGA_UNICA | `LEGAL_BASIS_REQUIRED_FOR_DIRECT_REGIME` (BLOCK) |
| S6 | LICITACAO × OBRA_ENGENHARIA × ITEM_UNICO × EXECUCAO_POR_ETAPAS | Obra / engenharia |
| S7 | LICITACAO × LOCACAO × ITEM_UNICO × EXECUCAO_CONTINUA | Locação |

Runner: `npx ts-node src/phase35/runner.ts` (cwd: `03-backend-api/licitaia-v2-api`) — última execução com **7/7 OK**.

## Fronteira API (400)

- Validador: `03-backend-api/licitaia-v2-api/src/validators/payload-classification.validator.ts`  
- Integração: `process-run-request.validator.ts` + `buildValidationErrorResponse` + `process.controller.ts`  
- Códigos: `INPUT_CLASSIFICATION_REQUIRED` | `INPUT_CLASSIFICATION_ENUM_INVALID` | `INPUT_CLASSIFICATION_EMPTY`

## Motor (fonte única + pré-voo + cruzada)

- Snapshot / merge: `02-frontend/licitaia-v2-web/modules/orchestrator/process-snapshot.utils.ts`  
- Pré-voo: `classification-preflight.ts`  
- Orquestrador: `administrative-process-engine.ts`  
- Cruzada (somente snapshot): `cross-module-consistency-validator.ts` — `NO_OVERLAP` → WARNING  
- Legal (snapshot + base legal direta): `legal-validation-rules.ts` / `legal-validation-engine.ts`

## Testes automatizados

- `npx vitest run orchestrator/administrative-process-engine.test.ts` (cwd: `02-frontend/licitaia-v2-web/modules`) — **20/20 OK**

## Artefacto compilado para a API

- `npx tsc -p ../../02-frontend/licitaia-v2-web/tsconfig.modules.json` (cwd: `03-backend-api/licitaia-v2-api`) — gera `modules-dist/`.
