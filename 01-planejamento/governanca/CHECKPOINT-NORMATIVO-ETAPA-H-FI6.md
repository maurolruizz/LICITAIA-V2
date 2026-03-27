# CHECKPOINT NORMATIVO — ETAPA H / H-FI6

Data: 2026-03-27  
Escopo: Auditoria hostil de readiness real (deploy, segurança, build, runtime e exposição controlada)

## Objetivo da fase

Comprovar coerência entre código-fonte, build, runtime, configuração, borda HTTP e operação reproduzível do ambiente oficial controlado (backend + frontend demo + PostgreSQL quando aplicável), sem maquiagem de prontidão.

## Diagnóstico (consolidado)

| Achado | Classificação | Nota |
|--------|----------------|------|
| `Access-Control-Allow-Headers` não incluía `x-request-id` — preflight de browsers poderia impedir envio do header de correlação canônica | **IMPORTANTE** | Corrigido em `middleware/cors.ts` |
| Frontend oficial `licitaia-v2-demo` sem etapa de build npm — estático + `node server.js` | **SECUNDÁRIO** | Comportamento esperado; não há `dist` separado do `src` |
| `NODE_ENV=staging|production` exige `CORS_ORIGIN`, `DATABASE_URL`, `JWT_SECRET` (≥32) — fail-fast | OK | Já em `config/env.ts` |
| Erros 500 não expõem stack ao cliente — mensagem genérica | OK | `middleware/error.ts` |
| Segredos de desenvolvimento apenas com aviso em stderr (`JWT_SECRET` default em development) | **IMPORTANTE** | Documentado; inaceitável fora de dev |
| Prova integral FI4/FI5 dentro da H-FI6 depende de PostgreSQL ativo + API + seed | **CRÍTICO** (ambiental) | Não é defeito de código; bloqueia prova multicamada até o banco estar disponível |

## Correções aplicadas

1. CORS: inclusão de `x-request-id` em `Access-Control-Allow-Headers`, alinhado a H-FI4/H-FI5.
2. Prova reexecutável: `03-backend-api/licitaia-v2-api/src/proof/etapa-h-fi6-readiness-controlled-environment.ts`
3. Script npm: `npm run proof:h-fi6` no `package.json` do backend.

## Prova executada (ordem canônica)

**Subida do ambiente oficial (documental):**

1. PostgreSQL com `licitaia_dev`, migrations e seed (ETAPA G).
2. Backend: `cd 03-backend-api/licitaia-v2-api` → `npm run build` → `npm run dev` ou `npm start`.
3. Frontend demo: `cd 02-frontend/licitaia-v2-demo` → `node server.js` (porta 3000; CORS default do backend aponta para `http://localhost:3000`).

**Comando de prova:**

- `npm run proof:h-fi6` — valida `dist/server.js`, regressão H-FI2, camada HTTP (health, diagnostics, CORS preflight, POST `/api/process/run` público).
- Com PostgreSQL e API: mesma prova inclui chamadas às regressões H-FI5 e H-FI4 (remover `H_FI6_SKIP_DB_REGRESSION` se tiver sido usado para prova parcial).
- Prova parcial explícita (sem FI4/FI5): definir `H_FI6_SKIP_DB_REGRESSION=1` apenas quando o banco não estiver disponível (CI local sem Postgres); não substitui prova integral para piloto.

**Evidência nesta sessão:** `npm run build` OK; `npm run proof:h-fi6` com `H_FI6_SKIP_DB_REGRESSION=1` OK (HTTP + FI2); regressão FI4/FI5 não reexecutada de ponta a ponta neste host por ausência de servidor PostgreSQL em escuta na porta 5432.

## Conclusão técnica

Readiness de borda, build e runtime HTTP alinhados ao `src`; prova única documentada; correção CORS aplicada. Prova completa com persistência e auditoria (FI4/FI5) permanece condicionada a infraestrutura PostgreSQL operacional — bloqueador residual **ambiental** para demonstração controlada **full-stack**, não regressão de H-FI4/H-FI5 no código.

## Veredito (checkpoint)

- H-FI6 (escopo auditoria + prova + correção CORS): **registrada**  
- Prova FI4/FI5 embutida na H-FI6 sem PostgreSQL: **não válida** — usar prova parcial só com flag explícita  
- ETAPA H completa: **permanece não encerrada** (outras subfases/transversais fora deste registro)
