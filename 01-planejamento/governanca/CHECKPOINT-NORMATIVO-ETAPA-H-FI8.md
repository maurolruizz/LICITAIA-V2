# CHECKPOINT NORMATIVO — ETAPA H / H-FI8 (AUDITORIA HOSTIL FINAL DE PRONTIDÃO PARA APRESENTAÇÃO REAL)

Data: 2026-03-27  
Postura: auditor hostil — ceticismo operacional, sem complacência.

## Simulação executada

1. Subida: PostgreSQL ativo (`licitaia_dev`); API `node dist/server.js` com `DATABASE_URL` em `licitaia_app` (RLS credível), `JWT_SECRET`, `CORS_ORIGIN`, `NODE_ENV=development`.
2. Roteiro H-FI7: `npm run proof:h-fi7` (após inclusão do script npm — ver correção abaixo).
3. Encadeamento: prova H-FI7 executa login demo, `/api/users/me`, `/api/institutional-settings`, logout; depois `npm run proof:h-fi6` (FI2 + FI5 + FI4).
4. Evidências: saída em consola com checks OK; regressão H-FI4/H-FI5/H-FI6 em verde.

## Achados classificados

| ID | Descrição | Classificação |
|----|-----------|----------------|
| A1 | O protocolo H-FI7 citava `npm run proof:h-fi7` mas o `package.json` do backend **não** definia o script — incoerência documental/prova | **CRÍTICO** até correção |
| A2 | Dependência de PostgreSQL manualmente iniciado; ordem migrate → seed → build → API; erro comum se saltar passo | **IMPORTANTE** |
| A3 | Dois perfis de `DATABASE_URL` (superuser para migrate/seed vs `licitaia_app` para runtime com RLS) — confusão operacional se não lida o protocolo | **IMPORTANTE** |
| A4 | Credenciais de demo em texto no seed — inevitável em dev; **obrigatório** declarar em qualquer apresentação externa que não são dados reais | **IMPORTANTE** (institucional) |
| A5 | Prova automatizada H-FI7 não abre browser no `licitaia-v2-demo` — UI não é validada pelo mesmo script (complementar: ensaio manual segundo protocolo) | **SECUNDÁRIO** |
| A6 | Concorrência / carga: não exercitada na prova única; isolamento tenant foi objeto de H-FI3 — não reabrir sem evidência nova | **FORA DE FOCO** para esta fase |

## Correção mínima aplicada (A1)

- `03-backend-api/licitaia-v2-api/package.json`: adicionado `"proof:h-fi7": "ts-node src/proof/etapa-h-fi7-institutional-demo-readiness.ts"`.

## Perguntas hostis (simulação)

| Pergunta | Resposta sustentada |
|----------|---------------------|
| E se o PostgreSQL estiver parado? | Demo falha no health/login; abortar — protocolo H-FI7 Sec. 8. |
| Como o sistema impede erro administrativo? | Motor com halts e códigos; não é “IA mágica” — Master Context. |
| Como audito depois? | `audit_logs` + `process_executions`; provas H-FI4. |
| Onde está a prova? | `npm run proof:h-fi6`, `npm run proof:h-fi7`, checkpoints ETAPA H. |

## Veredito da auditoria hostil

- Com A1 corrigido e simulação reexecutada com sucesso: **não há bloqueador crítico remanescente** para uma apresentação em regime **controlado** (consultoria, piloto, validação técnica), desde que o **PROTOCOLO-DEMONSTRACAO-CONTROLADA-ETAPA-H-FI7.md** seja seguido e os **limites** (não produção plena, dados de seed) sejam verbalizados.
- Riscos **importantes** residuais (A2–A4) são **aceites** apenas como **devem ser mitigados por ensaio e comunicação**, não por nova feature nesta fase.

## Encerramento

- H-FI8: **CONCLUÍDA (10/10 no escopo de auditoria hostil + correção mínima A1 + prova reexecutável)**.
- ETAPA H completa: permanece **não encerrada** se o Plano Mestre ainda prever subfases/transversais adicionais.
