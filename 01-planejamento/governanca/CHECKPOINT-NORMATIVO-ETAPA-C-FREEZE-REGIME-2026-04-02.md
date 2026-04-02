# CHECKPOINT NORMATIVO — ETAPA C — FREEZE EFETIVO DE REGIME NO FLOWCONTROLLER — 2026-04-02

## 1. Identificacao

- Data: 2026-04-02
- Etapa: C (Frente 4)
- Entrega: freeze efetivo de regime com bloqueio explicito de mutacao critica apos consolidacao
- Escopo: camada de orquestracao de conducao (`FlowController`) e respectivas provas automatizadas

## 2. Objetivo do registro

Formalizar a eliminacao da brecha de alteracao tardia de regime no fluxo administrativo, com regra central no motor de orquestracao, sem delegacao para UI e sem fallback silencioso.

## 3. Problema consolidado

Situacao anterior:

- o freeze de regime era verificado apenas quando o estado atual estava depois de `REGIME`;
- ao retornar para `REGIME`, a mutacao de campos criticos poderia passar indevidamente;
- o comportamento permitia alteracao tardia de decisao estrutural sem violacao formal do freeze consolidado.

## 4. Regra consolidada da ETAPA C

1. Campos criticos congelados apos consolidacao do regime:
   - `REG_LEGAL_REGIME`
   - `REG_PROCUREMENT_STRATEGY`
2. Tentativa invalida de mutacao critica apos consolidacao:
   - gera `FLOW_REGIME_FROZEN`;
   - gera erro explicito `FLOW_REGIME_FROZEN`;
   - registra trilha imutavel `REGIME_FREEZE_VIOLATION`.
3. Invalidação downstream deterministicamente classificada:
   - `INVALIDATION_REGIME_OR_CONTEXT_REOPEN` para alteracoes em `CONTEXT`/`REGIME`;
   - `INVALIDATION_EXPLICIT_SEGMENT_RESET` para os demais passos.
4. Proibicao de fallback silencioso:
   - nenhuma tentativa invalida e absorvida sem bloqueio/registro.

## 5. Arquivos alterados

- `02-frontend/licitaia-v2-web/modules/orchestrator/flow-controller.ts`
- `02-frontend/licitaia-v2-web/modules/orchestrator/flow-controller.types.ts`
- `02-frontend/licitaia-v2-web/modules/orchestrator/flow-controller.test.ts`
- `01-planejamento/PLANO-MESTRE-DECYON-V2.md`
- `01-planejamento/governanca/MATRIZ-DE-FECHAMENTO-DECYON-V2.md`
- `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-C-FREEZE-REGIME-2026-04-02.md`

## 6. Evidencia executavel

Comando executado:

- `npm run proof:etapa-c` (prova E2E real com FlowController do runtime canônico)
- `npx vitest modules/orchestrator/flow-controller.test.ts` (cobertura unitária complementar)

Resultado:

- prova E2E concluída com saída:
  - `[ETAPA_C_FREEZE_OK]`
  - `[ETAPA_C_FREEZE_EVIDENCE] process_id=...`
  - `[ETAPA_C_FREEZE_EVIDENCE] event=REGIME_FREEZE_VIOLATION`
- cenário hostil validado:
  - fluxo avança até após `REGIME`;
  - retorno para `REGIME`;
  - tentativa de mutação de `REG_LEGAL_REGIME`;
  - bloqueio explícito `FLOW_REGIME_FROZEN`;
  - evento imutável `REGIME_FREEZE_VIOLATION`;
  - preservação do valor crítico e do `stepStatusMap` (sem mutação estrutural indevida);
- 9/9 testes unitários aprovados (complementares)
- cobertura consolidada da ETAPA C para:
  - bloqueio de mutacao critica apos consolidacao mesmo com retorno para `REGIME`;
  - registro de violacao de freeze no historico imutavel;
  - invalidação downstream com razao `INVALIDATION_REGIME_OR_CONTEXT_REOPEN` em mutacao de contexto.

## 7. Checkpoint normativo obrigatorio

1. Criou/alterou/consolidou regra normativa?
   - SIM.
2. Exigiu atualizar o Plano Mestre?
   - SIM.
3. Exigiu atualizar a Matriz de Fechamento?
   - SIM.
4. Exigiu criar/atualizar artefatos em `01-planejamento/governanca/`?
   - SIM.
5. Atualizacoes foram executadas na mesma etapa?
   - SIM.

## 8. Veredito

- Etapa C (escopo de freeze efetivo de regime): **10/10**
- Evidencia executavel: **SIM**
- Trilha de bloqueio e consequencia auditavel: **SIM**
