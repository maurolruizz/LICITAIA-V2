# CHECKPOINT NORMATIVO — ETAPA F — CONSOLIDAÇÃO DE TESTES CRÍTICOS E PROVA TRANSVERSAL — 2026-04-04

## 1. Identificação

- Data: 2026-04-04
- Escopo: consolidação formal de robustez (ETAPA F), reproduzível e auditável, sem inflar escopo com testes decorativos
- Artefato central: `03-backend-api/licitaia-v2-api/src/proof/etapa-f-system-integrity-validation.ts`
- Comando oficial: `npm run proof:etapa-f` (no diretório `03-backend-api/licitaia-v2-api`)

## 2. Objetivo da etapa

Provar, num único fluxo, que os mecanismos críticos homologados nas ETAPAS A a E permanecem íntegros em conjunto: review real, FORCE RLS multi-tenant, freeze de regime, hardening HTTP (incluindo `Retry-After` em 429), validadores de base legal e cross-module, e regressão do cenário canônico de sucesso — com parada imediata se qualquer bloco falhar.

## 3. Matriz de cobertura

| Mecanismo crítico | Teste / prova associada | Tipo | Status |
|---|---|---|---|
| Review real (`TRIGGER_REVIEW`, adaptadores) | `test:etapa-a-review` (3 ficheiros `*.test.ts`) | Unitário + integração | OK (18/18 na sessão de validação) |
| FORCE RLS catálogo + isolamento A/B + sem contexto + `withTenantContext` | `proof:etapa-b` (pool `licitaia_app`; ver script SQL §7) | Banco real | OK (sessão revalidação) |
| Freeze de regime + tentativa hostil + evento imutável | `proof:etapa-c` | Integração (runtime FlowController) | OK |
| Anti-spoof IP, rate limit `/api/users`, `Retry-After`, `/health` | `proof:etapa-d` | Integração (API temporária) | OK (após assert `Retry-After`) |
| Base legal inválida / válida, cross-module, regressão S1 | `proof:etapa-e` | Motor real (cenários canónicos) | OK |
| Regressão transversal A–E | `proof:etapa-f` (orquestração) | Prova consolidada | OK quando todos os subcomandos passam |

**Invalidação downstream (BLOCO 1):** coberta normativamente na ETAPA C (códigos de invalidação no FlowController); evidência complementar em `flow-controller.test.ts` (Vitest) no frontend — fora do runner único da ETAPA F para evitar dependência de toolchain Vitest não instalada no monorepo.

## 4. Testes e provas executados (composição)

| Ordem | Componente |
|-------|------------|
| 1 | `node --test -r ts-node/register` nos três ficheiros de teste da ETAPA A |
| 2 | `ts-node` → `etapa-b-force-rls-multitenant-validation.ts` |
| 3 | `ts-node` → `etapa-c-freeze-regime-validation.ts` |
| 4 | `ts-node` → `etapa-d-http-hardening-validation.ts` |
| 5 | `ts-node` → `etapa-e-validators-validation.ts` |

## 5. Comandos executados (referência)

```text
cd 03-backend-api/licitaia-v2-api
npm run test:etapa-a-review
npm run proof:etapa-b
npm run proof:etapa-c
npm run proof:etapa-d
npm run proof:etapa-e
npm run proof:etapa-f
```

**Pré-requisitos ETAPA B (prova válida de RLS):**

1. PostgreSQL acessível (ex.: `127.0.0.1:5432`).
2. Migrations e seed aplicados (`npm run migrate` / `npm run seed` em `05-banco-de-dados`).
3. Role de prova `licitaia_app` (não-superuser, sem `BYPASSRLS`) e grants — script: `05-banco-de-dados/scripts/ensure-licitaia-app-role.sql` (executar como `postgres` no banco `licitaia_dev`).

**Variáveis opcionais:**

```text
set ETAPA_B_DATABASE_URL=postgresql://licitaia_app:licitaia_app@127.0.0.1:5432/licitaia_dev
set ETAPA_B_TENANT_A=00000000-0000-0000-0000-000000000001
set ETAPA_B_TENANT_B=00000000-0000-0000-0000-000000000002
```

(Os tenants padrão coincidem com o seed; omitir variáveis usa esses UUIDs.)

## 6. Saídas esperadas

- Subprovas A–E: mesmas tags já documentadas nos checkpoints das etapas (ex.: `[ETAPA_D_HARDENING_OK]`, `[ETAPA_D_EVIDENCE] retry_after=OK`).
- Prova consolidada (sucesso), após todos os passos:

```text
[ETAPA_F_TESTS_OK]
[ETAPA_F_EVIDENCE] review_real=OK
[ETAPA_F_EVIDENCE] force_rls=OK
[ETAPA_F_EVIDENCE] regime_freeze=OK
[ETAPA_F_EVIDENCE] http_hardening=OK
[ETAPA_F_EVIDENCE] validators=OK
[ETAPA_F_EVIDENCE] regression=OK
```

## 7. Evidências (sessão de revalidação 2026-04-04 — homologação integral)

**Preparação do ambiente:** PostgreSQL 18 iniciado com `pg_ctl` no cluster `C:\Program Files\PostgreSQL\18\data`; base `licitaia_dev` existente; migrations aplicadas; seed `001_test_tenant.sql`; role `licitaia_app` garantida via `05-banco-de-dados/scripts/ensure-licitaia-app-role.sql`.

**Correção técnica registada:** superusuário `postgres` ignora RLS no PostgreSQL — a prova ETAPA B passou a usar pool dedicado com URL `ETAPA_B_DATABASE_URL` ou padrão `licitaia_app`, e `withTenantContext` aceita pool opcional (`src/lib/db.ts`) para isolar a prova do pool da API.

- **ETAPA A:** 18 testes passando (`pass 18`, `fail 0`).
- **ETAPA B:** `[ETAPA_B_FORCE_RLS_OK]` + evidência de `process_id`.
- **ETAPA C:** `[ETAPA_C_FREEZE_OK]` + `REGIME_FREEZE_VIOLATION`.
- **ETAPA D:** `[ETAPA_D_HARDENING_OK]` + `spoof_blocked`, `rate_limit`, `retry_after`.
- **ETAPA E:** `[ETAPA_E_VALIDATORS_OK]` + evidências legais e cross-module.
- **ETAPA F (`npm run proof:etapa-f`):** saída completa com `[ETAPA_F_TESTS_OK]` e todas as linhas `[ETAPA_F_EVIDENCE]` obrigatórias.

## 8. Riscos residuais

1. **Infraestrutura:** `proof:etapa-f` exige PostgreSQL ativo, migrations aplicadas, seed de tenants e role `licitaia_app` com grants; ausência de qualquer item falha de forma explícita.
2. **Postura de RLS:** usar `DATABASE_URL` com `postgres` (superuser) na prova ETAPA B **invalida** o isolamento — a prova usa `licitaia_app` por defeito; novas tabelas em `public` exigem `GRANT` à role ou repetir `ALTER DEFAULT PRIVILEGES`.
3. **Tempo da prova D:** esperas de janela de rate limit (~22s+); CI deve reservar timeout adequado.
4. **Frontend Vitest:** `flow-controller.test.ts` permanece fora do runner único da ETAPA F (toolchain Vitest não instalada no pacote backend).
5. **Ambiente Windows:** `pg_ctl start` pode exigir permissões e pode conflitar com bloqueio de ficheiros de log (antivírus); monitorizar `data/log/` se o arranque for lento.

## 9. Veredito

- **ETAPA F — homologação 10/10:** `npm run proof:etapa-f` executado com sucesso na sessão de revalidação, com saída material `[ETAPA_F_TESTS_OK]` e todas as evidências obrigatórias; prova transversal única reproduzível em verde.

## 10. Checkpoint normativo obrigatório

1. Criou/alterou/consolidou regra normativa? **SIM** (registo 11.41 no Plano Mestre; secção 31 na Matriz).
2. Exigiu atualizar o Plano Mestre? **SIM**.
3. Exigiu atualizar a Matriz de Fechamento? **SIM**.
4. Artefatos em `01-planejamento/governanca/`? **SIM** (este ficheiro).
