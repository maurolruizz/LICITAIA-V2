# CHECKPOINT NORMATIVO — ETAPA E — VALIDADORES (BASE LEGAL + CROSS-MODULE) — 2026-04-02

## 1. Identificação

- Data: 2026-04-02
- Escopo: endurecimento dos validadores do núcleo (base legal estrutural; coerência entre DFD, ETP, TR e PRICING)
- Motor: `runAdministrativeProcess` (runtime canônico carregado pelo backend)

## 2. Objetivo

Garantir validação **não superficial**: referência normativa com estrutura verificável; bloqueio determinístico de inconsistências entre módulos; rastreabilidade por códigos explícitos.

## 3. Implementação consolidada

| Área | Entrega |
|------|---------|
| Estrutura normativa | `02-frontend/licitaia-v2-web/modules/shared/validators/legal/legal-basis-structure.util.ts` |
| Campo `legalBasis` | `legal-basis.validator.ts` — `MISSING_LEGAL_REFERENCE`, `INVALID_LEGAL_BASIS_STRUCTURE` |
| Regime direto (agregado) | `legal-validation-rules.ts` — `collectDirectRegimeLegalAggregate`, `INVALID_LEGAL_BASIS_STRUCTURE` |
| Política de regime | `regime-behavior-snapshot.util.ts` — `hasMinimumLegalBasisSupport` alinhado ao utilitário estrutural |
| Cross-module | `cross-module-consistency-rules.ts` — bloqueios com `CROSS_MODULE_INCONSISTENCY` + `details.specificRule` |

## 4. Códigos de validação (exemplos)

- `INVALID_LEGAL_BASIS_STRUCTURE` — texto presente, mas sem citação normativa verificável
- `MISSING_LEGAL_REFERENCE` — ausência de base legal onde o contrato exige campo
- `CROSS_MODULE_INCONSISTENCY` — inconsistência lexical/estrutural entre módulos adjacentes (detalhe em `specificRule`)
- `REGIME_FUNDAMENTO_MINIMO_AUSENTE` — bloqueio no motor de regime quando o snapshot não satisfaz fundamento mínimo (alinha com a mesma política estrutural)

## 5. Prova executável

- Arquivo: `03-backend-api/licitaia-v2-api/src/proof/etapa-e-validators-validation.ts`
- Comando: `npm run proof:etapa-e` (no pacote `licitaia-v2-api`)
- Saída obrigatória:
  - `[ETAPA_E_VALIDATORS_OK]`
  - `[ETAPA_E_EVIDENCE] legal_basis_validation=OK`
  - `[ETAPA_E_EVIDENCE] cross_module_validation=OK`

## 6. Cenários cobertos pela prova

1. Base legal inválida / genérica — bloqueio (cenário canônico S5; código `REGIME_FUNDAMENTO_MINIMO_AUSENTE`)
2. Base legal válida / pipeline íntegro — sucesso (S1)
3. Contradição DFD↔ETP — `CROSS_MODULE_INCONSISTENCY`
4. Regressão — reexecução S1 com sucesso

## 7. Evidência de regressão Fase 35

Runner: `npx ts-node src/phase35/runner.ts` — 7/7 cenários conforme matriz canônica após ajuste S2 (coerência TR×PRICING) e S5 (código de halt esperado).

## 8. Status

Encerrada no escopo desta entrega: validação estrutural de base legal centralizada; cross-module com código canônico; prova reexecutável e governança atualizada.
