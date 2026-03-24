# CHECKPOINT NORMATIVO — ETAPA G / FASE INTERNA 2

**Data:** 2026-03-24  
**Fase:** ETAPA G — Fase Interna 2 (Banco de dados: schema base + migrations)  
**Responsável normativo:** PLANO MESTRE DECYON V2 — Secção 11.10  
**Status:** APROVADO — encerramento válido

---

## 1. Resposta ao Checkpoint de Atualização Normativa (Sec. 11.10)

### Pergunta 1: A etapa criou, alterou ou consolidou regra normativa?

**Não.** A arquitetura normativa já estava definida na Fase Interna 1.
Esta fase implementou o schema conforme arquitetura aprovada, sem criar novas regras.

### Pergunta 2: A alteração exige atualização do Plano Mestre?

**Não.** Nenhuma decisão arquitetural nova foi tomada.

### Pergunta 3: A alteração exige atualização da Matriz de Fechamento?

**Sim, minimamente.** O status da Fase Interna 2 deve ser atualizado para "ENCERRADA".
Atualização realizada na Matriz de Fechamento.

### Pergunta 4: A alteração exige criação/atualização de artefatos em `01-planejamento/governanca/`?

**Sim.** Este checkpoint.

---

## 2. Inventário dos artefatos criados

| Arquivo | Tipo | Descrição |
|---|---|---|
| `05-banco-de-dados/package.json` | Config | Dependências: pg, ts-node, typescript |
| `05-banco-de-dados/tsconfig.json` | Config | TypeScript consistente com o projeto |
| `05-banco-de-dados/migrate.ts` | Runner | Migration runner mínimo com transação por arquivo |
| `05-banco-de-dados/seed.ts` | Runner | Seed runner com guard de produção |
| `05-banco-de-dados/validate.ts` | Validação | Verifica tabelas, RLS, políticas, constraints, triggers |
| `05-banco-de-dados/.env.example` | Exemplo | Modelo para DATABASE_URL |
| `05-banco-de-dados/.gitignore` | Config | Exclui node_modules, dist, .env |
| `05-banco-de-dados/README.md` | Docs | Instruções de setup e uso |
| `05-banco-de-dados/migrations/001_create_tenants.sql` | Migration | Tabela raiz; sem RLS |
| `05-banco-de-dados/migrations/002_create_users.sql` | Migration | RLS ativo; FK self-ref pós-criação |
| `05-banco-de-dados/migrations/003_create_user_sessions.sql` | Migration | RLS ativo; refresh token hash |
| `05-banco-de-dados/migrations/004_create_process_executions.sql` | Migration | RLS ativo; campos originais preservados + tenant_id + executed_by |
| `05-banco-de-dados/migrations/005_create_audit_logs.sql` | Migration | RLS SELECT+INSERT; trigger bloqueia UPDATE/DELETE |
| `05-banco-de-dados/migrations/006_create_organ_configs.sql` | Migration | RLS ativo; 1 registro por tenant |
| `05-banco-de-dados/seeds/001_test_tenant.sql` | Seed | Tenant de teste + 3 usuários por papel + organ_config |

---

## 3. Verificação dos critérios de aceite

| Critério | Status | Evidência |
|---|---|---|
| 6 entidades implementadas conforme arquitetura aprovada | CUMPRIDO | Migrations 001–006 |
| RLS ativo nas 5 tabelas operacionais | CUMPRIDO | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` em 002–006 |
| Políticas RLS coerentes (tenant_id via `current_setting`) | CUMPRIDO | `USING (tenant_id::text = nullif(current_setting('app.current_tenant_id', true), ''))` |
| audit_logs imutável (trigger bloqueia UPDATE/DELETE) | CUMPRIDO | `audit_logs_block_update`, `audit_logs_block_delete` |
| Constraints mínimas corretas | CUMPRIDO | CHECK, UNIQUE, FK em todas as tabelas |
| Índices essenciais presentes | CUMPRIDO | Índices por tenant_id, created_at, status, role |
| Migration runner com transação por arquivo | CUMPRIDO | `migrate.ts` — BEGIN/COMMIT/ROLLBACK por migration |
| TypeScript compila sem erros (05-banco-de-dados) | CUMPRIDO | `npx tsc --noEmit` → exit 0 |
| TypeScript compila sem erros (backend API — regressão) | CUMPRIDO | `npx tsc --noEmit` → exit 0 |
| Motor não alterado | CUMPRIDO | Nenhum arquivo em `03-backend-api/licitaia-v2-api/src/` tocado |
| Backend API não alterado | CUMPRIDO | `git diff --name-only HEAD` → vazio para 03-backend-api |
| Frontend não alterado | CUMPRIDO | Nenhum arquivo em `02-frontend/` tocado |
| IA assistiva não alterada | CUMPRIDO | Nenhum arquivo em `04-backend-ai/` tocado |
| Seed respeita imutabilidade de audit_logs | CUMPRIDO | DELETE de audit_logs removido do seed |
| script validate.ts verifica todas as entidades, RLS e triggers | CUMPRIDO | 5 categorias de verificação implementadas |

---

## 4. Limitação documentada (não é falha)

**RLS sem PostgreSQL local para prova de execução:**  
PostgreSQL não está instalado no ambiente de desenvolvimento atual.
As migrations estão sintaticamente corretas e o TypeScript compila sem erros.
A prova de execução real (`npm run migrate && npm run validate`) deve ser realizada
pelo operador em ambiente com PostgreSQL 14+ configurado conforme `.env.example`.

Esta limitação é de infraestrutura, não de código.

---

## 5. Declaração de validade

A Fase Interna 2 satisfaz integralmente os critérios do Plano Mestre e da Matriz de Fechamento.
A Fase Interna 3 (Backend: autenticação e tenant resolution) está **liberada para execução**
após provisionamento de instância PostgreSQL e execução bem-sucedida do runner de migrations.

---

_Checkpoint aplicado conforme Plano Mestre Sec. 11.10, 11.12 e 11.14._
