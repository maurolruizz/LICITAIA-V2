# CHECKPOINT NORMATIVO — ETAPA G / FASE INTERNA 4

**Data:** 2026-03-25  
**Fase:** ETAPA G — Fase Interna 4 (Backend: RBAC + módulo de usuários)  
**Responsável normativo:** PLANO MESTRE DECYON V2 — Secção 11.10  
**Status:** **APROVADO — ENCERRADA — 2026-03-25** (prova operacional real **9/9** validada; ver histórico e secção 5).

---

## 0. Histórico (transparência)

| Momento | Situação |
|--------|-----------|
| Entrega inicial do código FI4 | Matriz e documentação chegaram a indicar encerramento **sem** execução real do script de prova nos termos exigidos. |
| **Auditoria 2026-03-25** | Reversão do estado **ENCERRADA** na matriz; checkpoint deixou de representar encerramento válido até concluir prova real. Execução obrigatória: DB limpo/recriado quando necessário (seed vs. imutabilidade de `audit_logs`), migrations **007**, seed atualizado, API, `npx ts-node src/proof/etapa-g-fase4-rbac-validation.ts`. |
| Evidência | **9/9** após ligar a API com utilizador DB **`licitaia_app`** (não superuser / sem BYPASSRLS). Com **`postgres`**, RLS é ignorada pelo PostgreSQL e o **caso 8 (isolamento)** falha — causa raiz documentada, não defeito da lógica de listagem em si. |

---

## 1. Escopo fechado

- Papéis de gestão: **TENANT_ADMIN** (CRUD de usuários do tenant) e **TENANT_USER** (sem gestão de usuários).
- Endpoints: `POST/GET /api/users`, `PATCH /api/users/:id`, `GET /api/users/me`.
- JWT obrigatório; `tenantId` do token; RLS via `withTenantContext` inalterado.
- Auditoria: `USER_CREATED`, `USER_ROLE_CHANGED`, `USER_DEACTIVATED`, `USER_UPDATED` (reativação de status).
- Validações: email único por tenant, último admin ativo protegido, role apenas `TENANT_ADMIN` | `TENANT_USER` na API, sem exposição de `password_hash`.

---

## 2. Artefatos

| Arquivo | Descrição |
|---------|-----------|
| `05-banco-de-dados/migrations/007_alter_users_role_add_tenant_user.sql` | Inclui `TENANT_USER` no CHECK `users_role_check` |
| `05-banco-de-dados/seeds/001_test_tenant.sql` | `TENANT_USER` no lugar de OPERATOR de teste; segundo tenant para isolamento |
| `05-banco-de-dados/validate.ts` | Expectativa `schema_migrations >= 7` |
| `src/middleware/require-tenant-admin.ts` | RBAC: só `TENANT_ADMIN` após revalidação no banco |
| `src/modules/users/*` | types, repository, service, controller, routes |
| `src/server.ts` | Montagem `/api/users` |
| `src/modules/auth/auth.types.ts` | `TENANT_USER` + `createdAt`/`updatedAt` em `UserRecord` |
| `src/modules/auth/auth.repository.ts` | SELECT usuário com `created_at`, `updated_at` |
| `src/proof/etapa-g-fase4-rbac-validation.ts` | Prova operacional 9 cenários |

---

## 3. Prova operacional

```text
npx ts-node src/proof/etapa-g-fase4-rbac-validation.ts
```

Pré-requisitos: API em execução, `DATABASE_URL`, `JWT_SECRET`, migrations + seed aplicados.

**Obrigatório para validade do isolamento (caso 8):** o pool da API deve usar um papel PostgreSQL **sem privilégio de superuser** (ex.: role dedicado `licitaia_app` com `GRANT` de DML em `public`); caso contrário o PostgreSQL **aplica bypass de RLS** e o isolamento por tenant deixa de ser verificável na prática.

---

## 4. Regressão

- Runner canônico Fase 35: **7/7** (motor administrativo).
- `POST /api/auth/*` e contratos da Fase Interna 3 preservados.
- `POST /api/process/run` permanece sem exigência de JWT.

---

## 5. Registo da execução (auditoria 2026-03-25)

- Base `licitaia_dev` recriada quando necessário para permitir seed sem violar imutabilidade de `audit_logs` (FK `ON DELETE SET NULL` em utilizadores dispara `UPDATE` em `audit_logs`, bloqueado por trigger).
- Migrations **001–007** aplicadas; seed **001** aplicado.
- API com `JWT_SECRET` (≥32 chars) e `DATABASE_URL=postgresql://licitaia_app:…@localhost:5432/licitaia_dev`.
- Script: **9/9** aprovado (saída: “FASE INTERNA 4 — VALIDAÇÃO APROVADA”).
- **Nota:** Com a prova real **9/9** e a reconciliação documental concluída (Plano Mestre + Matriz + este checkpoint), o encerramento normativo da FI4 foi formalizado em **2026-03-25**.
