# CHECKPOINT NORMATIVO — ETAPA G / FASE INTERNA 7

**Data:** 2026-03-26  
**Fase:** ETAPA G — Fase Interna 7 (Frontend: login, tenant e administração básica)  
**Responsável normativo:** PLANO MESTRE DECYON V2 — Seção 11.10  
**Status:** **APROVADO — ENCERRADA — 2026-03-26 (10/10)**

---

## 1. Objetivo da fase (FI7)

Materializar camada frontend administrativa mínima, disciplinada e auditável para o produto SaaS, com:

- autenticação real integrada ao backend;
- leitura de contexto autenticado;
- leitura/edição controlada da configuração institucional por tenant;
- distinção de comportamento por papel (`TENANT_ADMIN` vs `TENANT_USER`);
- logout funcional;
- prova operacional ponta a ponta reexecutável, com ambiente saneado e regressão zero.

---

## 2. Frontend real utilizado

Frontend operacional oficial da FI7:

- `02-frontend/licitaia-v2-demo`

Contexto de fronteira:

- sem alteração do motor;
- sem alteração de IA;
- sem mudança de regra de negócio normativa no frontend;
- frontend subordinado à proteção backend (auth + RBAC + RLS).

---

## 3. Escopo validado da FI7

Entregas operacionais validadas:

- login real via `POST /api/auth/login`;
- carregamento de usuário autenticado via `GET /api/users/me`;
- carregamento da configuração institucional via `GET /api/institutional-settings`;
- edição da configuração institucional no frontend para `TENANT_ADMIN` via `PATCH /api/institutional-settings`;
- bloqueio funcional de edição para `TENANT_USER` no frontend, com backend preservando `403`;
- logout funcional via `POST /api/auth/logout`;
- persistência mínima de sessão/token no frontend conforme arquitetura vigente.

Campos canônicos FI6 mantidos no frontend FI7:

- `organizationName`
- `organizationLegalName`
- `documentNumber`
- `defaultTimezone`
- `defaultLocale`

---

## 4. Prova operacional real (reexecutável)

Script oficial da FI7:

`src/proof/etapa-g-fase7-frontend-admin-validation.ts`

Evidências obrigatórias aprovadas:

- cenário `TENANT_ADMIN`:
  - login `200`;
  - `/api/users/me` `200`;
  - leitura de settings `200`;
  - atualização de settings `200`;
  - confirmação física no banco (`organ_configs`);
  - evidência de `audit_logs` (`INSTITUTIONAL_SETTINGS_UPDATED`);
- cenário `TENANT_USER`:
  - login `200`;
  - `/api/users/me` `200`;
  - leitura de settings `200`;
  - tentativa de atualização bloqueada com `403`;
  - frontend refletindo somente leitura sem mascarar erro de permissão.

---

## 5. Saneamento do ambiente oficial da fase

Ambiente oficial definido e validado para a prova FI7:

- frontend: `http://localhost:3000`
- backend: `http://localhost:3001`

Saneamento aplicado:

- encerramento de instâncias antigas/divergentes que contaminavam a validação;
- unificação da prova em processo único por porta oficial;
- validação de alinhamento da API oficial com o `src` atual.

---

## 6. Regressão integral validada

Regressão executada no ambiente oficial e aprovada:

- FI3 — auth + tenant resolution;
- FI4 — RBAC + módulo de usuários;
- FI5 — ProcessExecution + AuditLog SaaS;
- FI6 — configuração institucional por tenant;
- `/api/process/run` preservado.

Critério atendido:

- regressão zero no escopo obrigatório da ETAPA G/FI7.

---

## 7. Conclusão formal da FI7

A Fase Interna 7 atende os critérios de aceite 10/10:

- frontend real identificado e utilizado (`02-frontend/licitaia-v2-demo`);
- login real, contexto autenticado e integração com FI6 comprovados;
- diferenciação de comportamento por papel (`TENANT_ADMIN`/`TENANT_USER`) validada;
- prova real reexecutável aprovada com evidência em API, banco e auditoria;
- ambiente saneado e validado;
- ausência de divergência operacional impeditiva no fechamento.

Encerramento formal: **APROVADO — ENCERRADA — 2026-03-26 (10/10)**.
