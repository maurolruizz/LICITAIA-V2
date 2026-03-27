# CHECKPOINT NORMATIVO — ETAPA H / H-FI3-C — CORRETIVA FORCE RLS + HISTÓRICO SEM OVERLAP

Data: 2026-03-27  
Escopo: H-FI3 corretiva cirúrgica (force RLS efetivo + isolamento da superfície de histórico)

## 1) A etapa criou, alterou ou consolidou regra normativa?

SIM.

Consolidou regra operacional de fechamento:
- migration crítica de segurança só é considerada válida após aplicação confirmada no banco efetivo de prova (não apenas versionada no repositório);
- superfície de histórico multi-tenant deve ter defesa em profundidade com filtro explícito por `tenant_id` além de RLS.

## 2) A alteração exige atualização do Plano Mestre?

SIM.

Atualização aplicada em:
- `01-planejamento/PLANO-MESTRE-DECYON-V2.md` (Secção 11.21).

## 3) A alteração exige atualização da Matriz de Fechamento?

SIM.

Atualização aplicada em:
- `01-planejamento/governanca/MATRIZ-DE-FECHAMENTO-DECYON-V2.md` (Secção 15).

## 4) A alteração exige criação/atualização de artefatos em governança?

SIM.

Artefato criado:
- `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-H-FI3-CORRETIVA-FORCE-RLS-E-HISTORICO-SEM-OVERLAP-2026-03-27.md`.

## 5) Causa raiz reconstituída

1. `c10=false`:
   - migration `009_force_row_level_security_tenant_tables.sql` existia no repositório, porém não estava aplicada no banco `licitaia_dev` usado pela prova.
2. `c7=false`:
   - histórico retornava overlap real entre tenants porque a query não aplicava filtro explícito por `tenant_id` e dependia exclusivamente do contexto/RLS.
3. fator de execução:
   - havia instância antiga na porta 3001 durante tentativas de validação, exigindo restart para carregar código corrigido.

## 6) Correções aplicadas (cirúrgicas)

1. Banco:
   - aplicação efetiva da migration 009 com owner (`postgres`) no banco alvo.
2. Backend:
   - `src/modules/process-execution/process-execution.repository.ts`:
     - listagem com `WHERE tenant_id = $2::uuid`;
     - consulta por id com `AND tenant_id = $2::uuid`.
   - `src/modules/process-execution/process-execution.service.ts`:
     - passagem explícita de `tenantId` para o repositório.

## 7) Provas reexecutáveis e evidências

Comandos executados:
- `psql "postgresql://postgres:postgres@localhost:5432/licitaia_dev" -c "select relname, relowner::regrole::text as owner, relforcerowsecurity from pg_class ..."`
- `npx ts-node src/proof/etapa-h-fi3-multitenant-isolation-audit.ts`

Evidências finais:
- force RLS: `true` em `users`, `user_sessions`, `process_executions`, `audit_logs`, `organ_configs`;
- `current_user`: `licitaia_app` (não-superuser, sem `BYPASSRLS`);
- `historyOverlapCount`: `0`;
- checks H-FI3: `10/10` aprovados (`c1..c10=true`).

## 8) Status

- H-FI3 corretiva: concluída com prova completa aprovada.
- ETAPA H completa: não encerrada neste checkpoint.
