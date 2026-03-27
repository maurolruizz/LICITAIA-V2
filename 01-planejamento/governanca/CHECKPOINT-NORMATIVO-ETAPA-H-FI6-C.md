# CHECKPOINT NORMATIVO — ETAPA H / H-FI6-C (CORRETIVA FULL-STACK)

Data: 2026-03-27  
Escopo: Fechar bloqueador ambiental da H-FI6 — PostgreSQL real, migrations, seed, `.env` coerente e prova `npm run proof:h-fi6` **sem** `H_FI6_SKIP_DB_REGRESSION`.

## Objetivo

Comprovar readiness integral: build + runtime + auth + persistência + trilha + regressões H-FI4 e H-FI5 no mesmo fluxo automatizado.

## Diagnóstico pré-corretiva

- Servidor PostgreSQL local não estava em execução (`pg_ctl status` = parado); iniciado com `pg_ctl start`.
- Migration `009_force_row_level_security_tenant_tables.sql` aplicada (única pendente).
- Seed `001_test_tenant.sql` falhava: `DELETE` em `users` acionava `ON DELETE SET NULL` em `audit_logs`, gerando **UPDATE** implícito bloqueado pelos triggers de imutabilidade.

## Correção aplicada (mínima)

- `05-banco-de-dados/seeds/001_test_tenant.sql`: adicionado `TRUNCATE TABLE audit_logs;` antes dos `DELETE` de limpeza idempotente (TRUNCATE não dispara os triggers BEFORE DELETE de `audit_logs`).

## Ambiente de prova (reexecutável)

1. PostgreSQL 18 em escuta (ex.: `127.0.0.1:5432`), base `licitaia_dev`, role `licitaia_app` com permissões conforme ETAPA G.
2. `cd 05-banco-de-dados` → `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/licitaia_dev npm run migrate` → `NODE_ENV=development npm run seed`.
3. Backend: copiar `.env.example` para `.env` e definir pelo menos:
   - `NODE_ENV=development`
   - `DATABASE_URL=postgresql://licitaia_app:licitaia_app@127.0.0.1:5432/licitaia_dev`
   - `JWT_SECRET` (≥32 caracteres em não-development; em development pode usar segredo explícito)
   - `CORS_ORIGIN=http://localhost:3000`
4. `cd 03-backend-api/licitaia-v2-api` → `npm run build` → `npm start` (ou `npm run dev`).
5. Prova integral: **sem** `H_FI6_SKIP_DB_REGRESSION` → `npm run proof:h-fi6`.

## Provas executadas (evidência)

| Prova | Resultado |
|-------|-----------|
| `psql` conectividade `licitaia_dev` | OK |
| `npm run migrate` | OK (009 aplicada quando pendente) |
| `npm run seed` | OK (após correção TRUNCATE) |
| `npm run validate` (schema) | OK (28 verificações) |
| `npm run build` (API) | OK |
| `npm run proof:h-fi6` (integral, FI2 + HTTP + FI5 + FI4) | OK |

## Conclusão

- H-FI6 **formalmente encerrada** com prova full-stack integral reexecutável, sem skip de regressão de banco.
- ETAPA H completa: permanece **não encerrada** (outras subfases transversais fora deste registro).

## Veredito binário

| Pergunta | Resposta |
|----------|----------|
| Prova integral sem skip? | SIM |
| Auth + persistência + trilha no mesmo fluxo (FI4/FI5)? | SIM |
| Bloqueador ambiental residual para esta corretiva? | NÃO |
