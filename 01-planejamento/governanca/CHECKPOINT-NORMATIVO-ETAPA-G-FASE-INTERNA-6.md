# CHECKPOINT NORMATIVO — ETAPA G / FASE INTERNA 6

**Data:** 2026-03-26  
**Fase:** ETAPA G — Fase Interna 6 (Backend: Configuração Institucional por Tenant)  
**Responsável normativo:** PLANO MESTRE DECYON V2 — Seção 11.10  
**Status:** **APROVADO — ENCERRADA — 2026-03-26 (10/10)**

---

## 1. Objetivo da fase (FI6)

Materializar configuração institucional por tenant no backend SaaS, com:

- persistência real por tenant;
- leitura segura por tenant;
- atualização restrita a `TENANT_ADMIN`;
- trilha de auditoria obrigatória;
- isolamento multi-tenant preservado por RLS;
- regressão zero sobre FI5, auth e RBAC.

---

## 2. Escopo validado

Entregas da FI6 validadas:

- módulo backend de configuração institucional por tenant;
- endpoint `GET /api/institutional-settings` com leitura segura por tenant;
- endpoint `PATCH /api/institutional-settings` com atualização `admin-only`;
- bloqueio correto de `TENANT_USER` com resposta `403`;
- gravação de auditoria em `audit_logs` com ação `INSTITUTIONAL_SETTINGS_UPDATED`;
- persistência em `organ_configs` com isolamento RLS.

---

## 3. Migration 008 aplicada

Migration aplicada efetivamente:

- `05-banco-de-dados/migrations/008_alter_organ_configs_add_fi6_institutional_fields.sql`

Resultado consolidado:

- colunas canônicas da FI6 presentes fisicamente em `organ_configs`;
- alinhamento banco ↔ modelo canônico da FI6 concluído;
- divergência estrutural resolvida.

---

## 4. Prova operacional real (reexecutável)

Script oficial executado:

`src/proof/etapa-g-fase6-institutional-settings-validation.ts`

Evidências validadas:

- tenant A lê e atualiza apenas sua configuração;
- tenant B lê e atualiza apenas sua configuração;
- ausência de vazamento cross-tenant;
- `TENANT_ADMIN` atualiza com sucesso;
- `TENANT_USER` é bloqueado com `403`;
- `audit_logs` registra `INSTITUTIONAL_SETTINGS_UPDATED`;
- validação de isolamento RLS com role `licitaia_app` (não-superuser e sem `BYPASSRLS`);
- API e banco exibem segregação consistente por tenant.

---

## 5. Regressão zero obrigatória

Confirmado:

- FI5 preservada (persistência + `audit_logs` + histórico por tenant);
- auth preservada;
- RBAC preservado;
- `/api/process/run` preservado sem regressão indevida de autenticação.

---

## 6. Conclusão formal

A Fase Interna 6 atende os critérios de aceite 10/10:

- prova real suficiente;
- ambiente validado;
- coerência entre `src`, `dist` e banco;
- ausência de divergência remanescente da FI6.

Encerramento formal: **APROVADO — ENCERRADA — 2026-03-26 (10/10)**.
