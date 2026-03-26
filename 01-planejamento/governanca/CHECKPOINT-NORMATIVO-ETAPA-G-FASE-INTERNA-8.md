# CHECKPOINT NORMATIVO — ETAPA G / FASE INTERNA 8

**Data:** 2026-03-26  
**Fase:** ETAPA G — Fase Interna 8 (Validação integrada final + encerramento técnico da ETAPA G)  
**Responsável normativo:** PLANO MESTRE DECYON V2 — Seção 11.10  
**Status:** **APROVADO — ENCERRADA — 2026-03-26 (10/10)**

---

## 1. Objetivo da fase (FI8)

Executar a validação integrada final da ETAPA G, comprovando que as FI1–FI7 operam como sistema único, coerente, auditável e sem regressões, e formalizar o encerramento técnico da ETAPA G.

---

## 2. Ambiente oficial utilizado

Ambiente oficial validado e utilizado na FI8:

- frontend: `http://localhost:3000`
- backend: `http://localhost:3001`

Condição de validade:

- prova executada no ambiente oficial único;
- sem uso de instâncias paralelas divergentes para fechamento da FI8.

---

## 3. Cenários integrados A–E validados

### Cenário A — TENANT_ADMIN

- login real;
- sessão/contexto autenticado;
- `GET /api/users/me`;
- leitura de `GET /api/institutional-settings`;
- atualização de `PATCH /api/institutional-settings`;
- evidência em banco e auditoria.

### Cenário B — TENANT_USER

- login real;
- sessão/contexto autenticado;
- leitura de configuração institucional;
- tentativa de ação restrita bloqueada;
- backend retornando `403` quando aplicável;
- frontend refletindo o bloqueio corretamente.

### Cenário C — Histórico / Execução

- execução autenticada relevante;
- persistência em `process_executions`;
- geração de `audit_logs`;
- histórico por tenant sem overlap.

### Cenário D — Isolamento multi-tenant

- tenant A não acessa dados de tenant B;
- tenant B não acessa dados de tenant A;
- validação por API;
- validação por RLS com role válida (`licitaia_app`, não-superuser, sem `BYPASSRLS`).

### Cenário E — Regressão global

- FI3 preservada;
- FI4 preservada;
- FI5 preservada;
- FI6 preservada;
- FI7 preservada;
- `/api/process/run` preservado.

---

## 4. Artefato final de prova reexecutável

Artefato oficial da FI8:

- `03-backend-api/licitaia-v2-api/src/proof/etapa-g-fase8-integrated-validation.ts`

Cobertura do artefato:

- validação integrada ponta a ponta da ETAPA G;
- execução coordenada dos cenários A–E;
- verificação de evidência multicamada (frontend, backend, HTTP, banco, RLS, auditoria);
- regressão global FI3–FI7 + `/api/process/run`.

---

## 5. Evidência de dados e auditoria

Evidências obrigatórias validadas na FI8:

- `organ_configs` (persistência da configuração institucional);
- `process_executions` (persistência de execuções por tenant/usuário);
- `audit_logs` (ações institucionais e execuções);
- RLS validada com role `licitaia_app` em conformidade operacional.

---

## 6. Conclusões formais

Conclusão da FI8:

- fase concluída com nota técnica **10/10**;
- prova reexecutável aprovada;
- regressão global aprovada;
- ausência de divergência operacional impeditiva no fechamento.

Conclusão técnica da ETAPA G:

- ETAPA G encerrada tecnicamente após validação integrada final das FI1–FI8.

Observação de fronteira:

- ETAPA H não iniciada nesta fase; permanece como etapa posterior de readiness institucional.
