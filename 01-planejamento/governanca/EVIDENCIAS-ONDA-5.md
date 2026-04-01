# EVIDÊNCIAS — ONDA 5

Registrado em: 2026-03-31

## 1) Comandos executados (principais)

- `npx tsc -p tsconfig.json --noEmit` (backend)
- `node --test -r ts-node/register "src/modules/compliance/compliance-report.mapper.test.ts"`
- `node --check "app.js"; node --check "history-ui.js"; node --check "compliance-ui.js"`
- `node --check "dossier-ui.js"`
- `..\..\03-backend-api\licitaia-v2-api\node_modules\.bin\tsc -p tsconfig.modules.json --noEmit` (frontend principal)

## 2) Checks realizados

- tipagem backend: OK
- testes unitários do mapper/score: 19/19 em verde
- sintaxe frontend demo: OK
- lint dos arquivos alterados: sem erros

## 3) Validações de backend

- composição do `ComplianceReport` canônico com:
  - `verdict`, `summary`, `score`, `validations`, `blockings`, `timeline`, `documents`, `automaticReactions`
- endpoint de leitura:
  - `GET /api/process/:id/compliance-report`
- serviço de dossiê e endpoint:
  - `GET /api/process/:id/compliance-dossier`
- dossiê derivado de relatório, sem nova regra de conformidade.

## 4) Validações de frontend demo

- Prova de Conformidade institucional com blocos obrigatórios:
  - header, score card, validações, bloqueios, reações automáticas, timeline, documents panel
- Dossiê institucional:
  - visualização “Ver Dossiê”
  - leitura por processo ativo/selecionado
  - impressão simples via navegador (`window.print`)
- fluxo integrado:
  - histórico -> abrir prova
  - histórico -> abrir dossiê
  - carregamento por processo ativo sem dependência de digitação manual como caminho principal.

## 5) Testes unitários do mapper/score

Coberturas registradas:
- bloqueio crítico impede score alto
- ausência de review reduz `flowIntegrity`
- ausência de sinal terminal limita score pleno
- ausência de `CROSS_MODULE_VALIDATION` limita coerência intermodular
- rastreabilidade forte eleva `traceability`
- warnings reduzem `overallScore`
- fatores positivos e negativos explicados
- explanation explicita limitações
- compatibilidade score/veredict
- notas sempre no intervalo 0–100

## 6) Telas / blocos implementados

- Prova de Conformidade:
  - `ComplianceHeader`
  - `ComplianceScoreCard`
  - `ComplianceValidationList`
  - `ComplianceBlockingList`
  - `ComplianceReactionList`
  - `ComplianceTimeline`
  - `ComplianceDocumentsPanel`
- Dossiê institucional:
  - seção dedicada com leitura executiva e técnica resumida
  - estado honesto para ausência de suporte documental.

## 7) Descrição do dossiê

DTO institucional com:
- identificação (`processId`, `tenantId`, `generatedAt`)
- veredito e resumo
- score geral + breakdown
- validações, bloqueios e reações automáticas principais
- timeline resumida
- documentos + nota de limitação real quando vazio
- referências de evidência com `sourceRefs`

Garantia: dossiê deriva do `ComplianceReport` sem criação de lógica nova.

## 8) Observação de pendência preexistente (fora do escopo da Onda 5)

Persistem erros históricos de tipagem em:

- `02-frontend/licitaia-v2-web/modules/orchestrator/flow-controller.ts`

Declaração:
- pendência preexistente;
- não introduzida pela Onda 5;
- não mascara nem invalida as entregas de escopo da Onda 5.
