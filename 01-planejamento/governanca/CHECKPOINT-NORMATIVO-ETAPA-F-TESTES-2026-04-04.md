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
| FORCE RLS catálogo + isolamento A/B + sem contexto + `withTenantContext` | `proof:etapa-b` | Banco real | Requer PostgreSQL acessível + env (ver §6) |
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

**Variáveis para ETAPA B (obrigatórias):**

```text
set DATABASE_URL=postgresql://.../licitaia_dev
set ETAPA_B_TENANT_A=00000000-0000-0000-0000-000000000001
set ETAPA_B_TENANT_B=00000000-0000-0000-0000-000000000002
```

(Em PowerShell, usar `$env:DATABASE_URL=...`.)

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

## 7. Evidências (sessão de validação 2026-04-04)

- **ETAPA A:** 18 testes passando (`pass 18`, `fail 0`).
- **ETAPA C:** `[ETAPA_C_FREEZE_OK]` com evidência de `REGIME_FREEZE_VIOLATION`.
- **ETAPA D:** `[ETAPA_D_HARDENING_OK]` + `spoof_blocked`, `rate_limit`, `retry_after`.
- **ETAPA E:** `[ETAPA_E_VALIDATORS_OK]` + evidências legais e cross-module.
- **ETAPA F (`proof:etapa-f`):** execução interrompida na ETAPA B com `ECONNREFUSED` em `localhost:5432` — **PostgreSQL não disponível neste ambiente de execução** (sem serviço a escutar na porta; Docker não instalado no host da sessão).

## 8. Riscos residuais

1. **Dependência de infraestrutura:** `proof:etapa-b` e, portanto, `proof:etapa-f` integral exigem instância PostgreSQL acessível, migrations aplicadas e UUIDs de tenant válidos; sem isso, o bloco B falha de forma explícita (não mascarada).
2. **Tempo da prova D:** inclui esperas de janela de rate limit (~22s+); pipelines CI devem reservar timeout adequado.
3. **Frontend Vitest:** testes `flow-controller.test.ts` cobrem invalidação downstream com runner Vitest; não entram no `proof:etapa-f` para manter uma única cadeia `node`/`ts-node` estável no backend.
4. **Ambiente Windows:** o script consolidador invoca `node` diretamente (evita `spawnSync` de `npm` sem shell) — manter Node LTS alinhado ao projeto.

## 9. Veredito

- **Consolidação técnica e governança:** entregues — script único, `package.json` atualizado, prova D reforçada com `Retry-After`, documentação alinhada ao Plano Mestre e à Matriz de Fechamento.
- **Prova material integral `proof:etapa-f`:** **condicionada** à disponibilidade de PostgreSQL para a ETAPA B; na sessão documentada, os blocos A, C, D e E foram executados com sucesso isoladamente; o fluxo completo deve ser reexecutado num ambiente com base migrada para fechar a evidência B com `[ETAPA_F_TESTS_OK]`.

## 10. Checkpoint normativo obrigatório

1. Criou/alterou/consolidou regra normativa? **SIM** (registo 11.41 no Plano Mestre; secção 31 na Matriz).
2. Exigiu atualizar o Plano Mestre? **SIM**.
3. Exigiu atualizar a Matriz de Fechamento? **SIM**.
4. Artefatos em `01-planejamento/governanca/`? **SIM** (este ficheiro).
