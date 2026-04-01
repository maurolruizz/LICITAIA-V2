# CHECKPOINT NORMATIVO — ONDA 5

Registrado em: 2026-03-31  
Status: APROVADO (10/10)

## 1) Escopo da Onda

Encerrar a camada de Prova de Conformidade e Explicação Auditável do DECYON/LICITAIA V2 com base estritamente canônica, incluindo:
- contratos formais;
- evidências normalizadas;
- relatório de conformidade;
- score explicável robusto;
- UX institucional;
- dossiê exportável.

Sem criação de nova lógica do motor, sem regra jurídica nova e sem inferência sem lastro.

## 2) Incrementos O5-I1 a O5-I6

- O5-I1: contratos formais de evidência, timeline, validações, bloqueios, score e relatório.
- O5-I2: agregador de evidências a partir de fontes canônicas com rastreabilidade por `sourceRefs`.
- O5-I3: composição prudente do `ComplianceReport` com veredito e resumo institucionais.
- O5-I4: hardening semântico + score explicável robusto compatível com veredito.
- O5-I5: UX de Prova de Conformidade integrada ao fluxo e reações automáticas explícitas do backend.
- O5-I6: dossiê institucional exportável derivado do `ComplianceReport`.

## 3) O que foi implementado

- Backend:
  - contratos formais (`compliance-report.types.ts`);
  - agregação de evidências (`compliance-evidence.service.ts`);
  - composição de relatório (`compliance-report.service.ts`, `compliance-report.mapper.ts`);
  - endpoint de relatório (`GET /api/process/:id/compliance-report`);
  - reações automáticas explícitas no payload (`automaticReactions`);
  - serviço e endpoint de dossiê (`compliance-dossier.service.ts`, `GET /api/process/:id/compliance-dossier`).
- Frontend:
  - visualização institucional da prova (header, score, validações, bloqueios, reações, timeline, documentos);
  - visualização institucional do dossiê exportável (HTML imprimível);
  - integração por processo ativo/selecionado, mantendo caminho manual apenas como apoio operacional.
- Frontend principal:
  - módulos `compliance-ui` e `dossier-ui` para consumo institucional do backend.

## 4) Riscos tratados

- risco de inferência semântica no frontend para reações automáticas: tratado com campo backend explícito.
- risco de aprovação precoce por score sem prudência: tratado no hardening do score/verdict.
- risco de cosmética sem lastro: tratado com vínculo obrigatório a evidências e `sourceRefs`.
- risco de ruído operacional: tratado com timeline priorizada e dossiê resumido institucional.

## 5) Evidências de validação

- Contratos: tipos explícitos e exportados para relatório/dossiê.
- Evidências: leitura apenas de fontes canônicas e rastreabilidade obrigatória.
- Relatório: `ComplianceReport` com blocos completos e prudentes.
- Score: pilares explicáveis + fatores positivos/negativos + coerência com veredito.
- UX: prova institucional materializada com estados `loading/error/empty/loaded`.
- Dossiê: peça exportável HTML institucional derivada do relatório sem lógica nova.

## 6) Observação de dívida preexistente (fora do escopo da Onda 5)

Existe pendência histórica de tipagem no frontend principal em:

- `02-frontend/licitaia-v2-web/modules/orchestrator/flow-controller.ts`

Declaração normativa:
- trata-se de dívida técnica preexistente;
- está fora do escopo funcional da Onda 5;
- não foi introduzida pela Onda 5.

## 7) Veredito final

APROVADO.
