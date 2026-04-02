# CHECKPOINT NORMATIVO — ETAPA B — BLINDAGEM ESTRUTURAL FORCE RLS — 2026-04-02

## 1. Identificação

- Data: 2026-04-02
- Etapa: ETAPA B (Frente 3)
- Objetivo: blindagem estrutural do isolamento multi-tenant nas tabelas operacionais `processes`, `flow_sessions` e `flow_session_revisions`.

## 2. Alterações estruturais aplicadas

1. Migration de subida criada e aplicada:
   - `05-banco-de-dados/migrations/012_etapa_b_force_rls_process_flow_tables.sql`
2. Rollback formal criado:
   - `05-banco-de-dados/migrations/rollback/012_etapa_b_force_rls_process_flow_tables.down.sql`
3. Prova executável criada:
   - `03-backend-api/licitaia-v2-api/src/proof/etapa-b-force-rls-multitenant-validation.ts`
4. Script npm de prova adicionado:
   - `03-backend-api/licitaia-v2-api/package.json` (`proof:etapa-b`)

## 3. Estado anterior das policies (baseline objetivo)

- As tabelas `processes`, `flow_sessions` e `flow_session_revisions` já possuíam:
  - `ENABLE ROW LEVEL SECURITY`
  - policy de isolamento por `tenant_id` com `current_setting('app.current_tenant_id', true)`
- Lacuna crítica: ausência de `FORCE ROW LEVEL SECURITY` nessas três tabelas.

## 4. Evidências executáveis reais (PostgreSQL)

Ambiente de prova:

- PostgreSQL local ativo em `127.0.0.1:5432` (`licitaia_dev`)
- role de prova: `licitaia_app` (não-superuser, sem `BYPASSRLS`)

Execuções registradas:

1. Migrations + seed:
   - `npm run migrate` (com `DATABASE_URL=postgresql://postgres@127.0.0.1:5432/licitaia_dev`) -> OK
   - `npm run seed` -> OK
2. Catálogo PostgreSQL (FORCE RLS):
   - Query: `SELECT relname, relrowsecurity, relforcerowsecurity ...`
   - Resultado: `relrowsecurity = true` e `relforcerowsecurity = true` para:
     - `processes`
     - `flow_sessions`
     - `flow_session_revisions`
3. Prova ETAPA B:
   - `npm run proof:etapa-b`
   - Variáveis:
     - `ETAPA_B_TENANT_A=00000000-0000-0000-0000-000000000001`
     - `ETAPA_B_TENANT_B=00000000-0000-0000-0000-000000000002`
     - `ETAPA_B_PROCESS_ID=etapa-b-processo-prova-2026-04-02`
   - Resultado:
     - `[ETAPA_B_FORCE_RLS_OK] FORCE RLS ativo e isolamento multi-tenant comprovado.`

## 5. Critérios validados

- `RLS enabled`: OK
- `FORCE RLS enabled`: OK
- `withTenantContext` compatível: OK (prova usa `withTenantContext` para leitura/escrita por tenant)
- isolamento entre tenants (leitura): OK
- isolamento entre tenants (update/delete cruzados): OK
- sem tenant context, sem acesso amplo: OK

## 6. Rollback formal

Arquivo:

- `05-banco-de-dados/migrations/rollback/012_etapa_b_force_rls_process_flow_tables.down.sql`

Efeito:

- executa `NO FORCE ROW LEVEL SECURITY` nas três tabelas-alvo;
- mantém `RLS ENABLED` (reversão controlada apenas do endurecimento).

## 7. Checkpoint normativo obrigatório

1. Criou/alterou/consolidou regra normativa?  
   - SIM.
2. Exigiu atualizar Plano Mestre?  
   - SIM.
3. Exigiu atualizar Matriz de Fechamento?  
   - SIM.
4. Exigiu criar/atualizar artefato em `01-planejamento/governanca/`?  
   - SIM (este checkpoint).
5. Atualizações executadas no mesmo ciclo?  
   - SIM.

## 8. Veredito

- ETAPA B (escopo FORCE RLS estrutural): **CONCLUÍDA — 10/10**
- Risco crítico de ausência de FORCE RLS nas tabelas operacionais alvo: **fechado**
