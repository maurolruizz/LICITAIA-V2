# CHECKPOINT NORMATIVO — ONDA 4

Data: 2026-03-31  
Escopo: Encerramento formal da Onda 4 (Persistência Operacional SaaS)

## 1) Escopo da onda

A Onda 4 consolida a transição do fluxo operacional do modo em memória para modo persistido e auditável em PostgreSQL, com segurança SaaS multi-tenant e sem alteração de soberania do motor.

## 2) O que foi implementado

- persistência oficial do estado de fluxo em `flow_sessions`
- histórico imutável por revisão em `flow_session_revisions`
- persistência de processo em `processes`
- concorrência atômica por `revision + render_token` no banco
- auditoria estruturada em `audit_logs` para criação e mutação de fluxo
- enforcement multi-tenant por RLS com contexto transacional
- hardening de endpoints para remover bypass legado
- remoção do módulo legado `src/modules/flow-ui`
- snapshot com versionamento interno (`_schemaVersion`)
- render token determinístico com serialização estável e exclusão de campos voláteis

## 3) Riscos identificados e tratados

1. Risco de concorrência não atômica  
Tratamento: validação única no `UPDATE ... WHERE revision AND render_token` com falha `STALE_STATE`.

2. Risco de reconstrução silenciosa do estado no controlador  
Tratamento: `FlowController` ajustado para hidratar de snapshot persistido e falhar explicitamente em snapshot inválido.

3. Risco de bypass por endpoints legados  
Tratamento: remoção das rotas legadas de fluxo em memória.

4. Risco de rastreabilidade fraca em auditoria  
Tratamento: enriquecimento de metadata com identificação de revisão, sessão, processo, tenant, usuário e tipo de ação.

5. Risco de vazamento entre tenants  
Tratamento: RLS + teste hostil dedicado A/B com validação de SELECT e UPDATE cruzados.

## 4) Evidências de validação

- concorrência (stale): conflito simultâneo resulta em `STALE_STATE` por falha atômica no update condicional
- RLS (teste hostil): prova em `src/proof/etapa-h-fi8-tenant-hostile-rls-validation.ts`
- persistência: estado recuperável por `GET /api/process/:id` e histórico por `GET /api/process/:id/history`
- auditoria: cada ação de mutação persiste log estruturado em `audit_logs`

## 5) Veredito final

**APROVADO**  
Onda 4 encerrada formalmente em 10/10 no escopo de persistência operacional SaaS, com regressão zero no fluxo persistido.
