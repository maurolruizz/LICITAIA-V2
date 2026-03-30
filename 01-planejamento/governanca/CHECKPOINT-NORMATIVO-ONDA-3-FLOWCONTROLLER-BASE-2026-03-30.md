# CHECKPOINT NORMATIVO — ONDA 3 — FLOWCONTROLLER / BASE TECNICA DA CONDUCAO OPERACIONAL V1 — 2026-03-30

## 1. Identificacao

- Data: 2026-03-30
- Entrega: base tecnica da Onda 3 (FlowController / state machine / camada de conducao operacional v1)
- Referencia de onda: Onda 3
- Escopo deste registro: fechamento formal da entrega estrutural aprovada, sem extrapolacao para encerramento integral da Onda 3 como objetivo final de produto

## 2. Objetivo do registro

Formalizar, em governanca, o encerramento da **base tecnica** da Onda 3 com aprovacao 10/10, mantendo a distincao normativa entre:

- entrega estrutural aprovada (fase/base tecnica);
- continuidade da Onda 3 como camada operacional mais ampla, quando aplicavel.

## 3. Escopo implementado (entrega aprovada)

Arquivos nucleares da base tecnica da Onda 3:

- `02-frontend/licitaia-v2-web/modules/orchestrator/flow-controller.types.ts`
- `02-frontend/licitaia-v2-web/modules/orchestrator/flow-step-definitions.ts`
- `02-frontend/licitaia-v2-web/modules/orchestrator/flow-state.factory.ts`
- `02-frontend/licitaia-v2-web/modules/orchestrator/flow-controller.ts`
- `02-frontend/licitaia-v2-web/modules/orchestrator/flow-controller.test.ts`
- `02-frontend/licitaia-v2-web/modules/orchestrator/flow-controller.contract.test.ts`

Ajustes minimos associados:

- wiring de export/integração da camada de orquestracao;
- sincronizacao de runtime canônico derivado para o backend, sem alteracao indevida de escopo arquitetural.

## 4. Definicao arquitetural consolidada

Fica consolidado que o FlowController da Onda 3:

1. e uma maquina de estados deterministica do processo administrativo;
2. nao constitui novo motor decisorio;
3. nao duplica regra juridica;
4. nao duplica validacoes do nucleo;
5. utiliza `runAdministrativeProcess()` na etapa de `REVIEW`;
6. congela `legalRegime` e `procurementStrategy` apos `REGIME`;
7. nao recalcula no `OUTPUT` (apenas consolida/expoe resultado);
8. opera com fluxo v1 fixo e obrigatorio:
   `INIT -> CONTEXT -> REGIME -> DFD -> ETP -> TR -> PRICING -> REVIEW -> OUTPUT`.

## 5. Evidencia de aprovacao da entrega

Evidencias formais consolidadas para a entrega da base tecnica:

- testes especificos da Onda 3 executados com runner real;
- resultado consolidado: 15/15 aprovados;
- eliminacao do erro de registry (`Modulo nao registrado: DFD`);
- comportamento de fluxo validado de forma deterministica;
- prova de imutabilidade de snapshot por etapa;
- prova de nao duplicacao do motor;
- regressao da propria entrega considerada comprovada;
- veredito de aprovacao da entrega: 10/10.

## 6. Limite explicito da aprovacao

Este checkpoint registra expressamente:

- a aprovacao atual **encerra a base tecnica da Onda 3**;
- a aprovacao atual **nao encerra automaticamente toda a Onda 3** como resultado final de produto/conducao operacional completa;
- qualquer declaracao de encerramento integral da Onda 3 exige formalizacao futura especifica e evidencias correspondentes.

## 7. Registro de divergencia externa (S5)

Permanece registrado que:

- o runner canonico da Fase 35 apresenta divergencia no cenario `S5_DISPENSA_SEM_BASE_LEGAL_WARNING`;
- a auditoria classificou o ponto como **externo** ao escopo da entrega da Onda 3 (FlowController/base tecnica);
- essa divergencia nao bloqueia o fechamento desta entrega especifica.

## 8. Checkpoint normativo obrigatorio

1. Criou/alterou/consolidou regra normativa?  
   - SIM (consolidacao formal de status da entrega da Onda 3).
2. Exigiu atualizar o Plano Mestre?  
   - SIM.
3. Exigiu atualizar a Matriz de Fechamento?  
   - SIM.
4. Exigiu criar/atualizar artefatos em `01-planejamento/governanca/`?  
   - SIM (este checkpoint).
5. Atualizacoes foram executadas na mesma etapa?  
   - SIM.

## 9. Veredito

- Entrega aprovada: **10/10**
- Apta para commit formal rastreavel: **SIM**
- Apta para continuidade controlada da Onda 3: **SIM**
