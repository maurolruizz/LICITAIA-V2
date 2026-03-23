# FASE 36 — ENCERRAMENTO OFICIAL

**Data:** 2026-03-18  
**Status:** Concluída com validação final obrigatória  
**Conclusão técnica:** 10/10

---

## 1. Problema original da fase

A Fase 35 revelou lacunas críticas nos cenários **MULTIPLOS_ITENS** (S2) e **LOTE** (S4):

- O fluxo era interrompido **cedo demais**, antes de alcançar cobertura real do pipeline (DFD → ETP → TR → PRICING).
- Causas identificadas:
  - **Extratores** usavam `list ?? single`: quando payload trazia **array e objeto único ao mesmo tempo**, um era ignorado, gerando bloqueios por “item sem justificativa/necessidade/estratégia”.
  - **Validadores** não consideravam estratégia em nível de processo como cobertura para itens/lotes.
  - **Fallback** de NEED a partir de JUSTIFICATION não era auditável (sem origem explícita nem distinção nativo vs derivado).

---

## 2. Causa raiz

- **Arquivos/regras:** `administrative-justification.extractor.ts`, `administrative-need.extractor.ts`, `procurement-strategy.extractor.ts`, `procurement-strategy.validator.ts`.
- **S2:** Perda silenciosa de uma das fontes de justificativa (array vs single) → motor enxergava itens sem justificativa → BLOCK por coerência administrativa.
- **S4:** Payload sem `administrativeNeeds` explícito; necessidade era derivada de justificativas mas sem marcador de origem; além disso, estratégia em nível de processo não era aceita como cobertura para itens (OBJECT_WITHOUT_STRATEGY indevido).
- **Classificação:** Bloqueio **prematuro por modelagem/extração** (e calibragem de validação), não por regra de negócio legítima.

---

## 3. Correção aplicada

- **Extratores:** Merge explícito `[...(list ?? []), ...(single ? [single] : [])]` em justification, need e procurement strategy; **origem por entry** no need: `listLength` para distinguir entries do array (sourceField: 'administrativeNeeds', sourceIndex) da entry single (sourceField: 'administrativeNeed').
- **Fallback NEED:** Só quando `entries.length === 0`; entradas derivadas com `origin.kind: 'DERIVED_FALLBACK'`, `derivedFrom`, `derivedFromIndex`, `mappedFields`; retorno com `fallbackApplied`, `nativeCount`, `derivedFallbackCount`.
- **Tipos:** `AdministrativeNeedEntryOrigin` (NATIVE vs DERIVED_FALLBACK), `ExtractedAdministrativeNeed` com campos de auditoria.
- **Procurement strategy validator:** Estratégia em nível de processo cobre itens/lotes quando não houver estratégia específica por item/lote (`hasProcessLevelStrategy`).
- **Cenários canônicos (Fase 35):** Atualização do `expectedObserved` de S2 e S4 para refletir o as-built após correção (sem maquiar cobertura normativa).
- **Testes:** `tests/phase36-nucleus-regression.ts` — fallback auditável, **caso misto (array + single)** com origem correta por entry, calibragem de procurement strategy.

---

## 4. Garantia de auditabilidade

- **Fallback NEED:** Cada entry derivada tem `origin.kind = 'DERIVED_FALLBACK'`, `derivedFrom` ('administrativeJustification' | 'administrativeJustifications'), `derivedFromIndex` (quando array), `mappedFields` (problemStatement→problemDescription, etc.). Retorno expõe `fallbackApplied`, `nativeCount`, `derivedFallbackCount`.
- **Caso misto (array + single):** Entries do array têm `sourceField: 'administrativeNeeds'` e `sourceIndex` 0, 1, …; entry do objeto único tem `sourceField: 'administrativeNeed'`. Nenhum dado inventado; fallback só quando não há NEED nativa.

---

## 5. Evidência de regressão zero

- **npx tsc --noEmit:** OK (sem erros).
- **npx ts-node src/phase35/runner.ts:** 7/7 cenários OK; S1, S3, S5, S6, S7 sólidos inalterados; S2 atinge pipeline completo e halta por CROSS_MODULE_TR_PRICING_NO_OVERLAP; S4 mantém bloqueio legítimo ADMIN_DOCUMENT_CONSISTENCY_STRATEGY_STRUCTURE_MISMATCH.
- **npx ts-node tests/phase36-nucleus-regression.ts:** OK — fallback auditável, caso misto (quantidade de entries, origem por entry, nativeCount, derivedFallbackCount = 0), calibragem de procurement strategy (process-level cobre itens; ausência total bloqueia).

---

## 6. Resultado da Fase 35 após correção

| Cenário | Status   | Observação |
|--------|----------|------------|
| S1     | OK/SOLID | Pipeline completo, sem halt |
| S2     | OK/PARTIAL | Pipeline completo; halt por validação cruzada (TR×PRICING) |
| S3     | OK/SOLID | Pipeline completo |
| S4     | OK/PARTIAL | Halt por dependência; bloqueio canônico Strategy×Structure |
| S5     | OK/PARTIAL | Pipeline completo |
| S6     | OK/SOLID | Pipeline completo |
| S7     | OK/SOLID | Pipeline completo |

**Resumo:** 7 passaram, 0 falharam. Cenários sólidos preservados; S2 e S4 com comportamento correto e auditável.

---

## 7. Conclusão técnica 10/10

- Alinhamento com o **PLANO-MESTRE-DECYON-V2.md:** regressão zero, trilha de auditoria (origin + contadores), coerência entre documentos, bloqueio quando necessário. Nenhuma alteração em multi-tenant, LGPD, auditoria de usuários, segurança ou DevOps.
- Fallback de NEED **inequivocamente auditável**; caso misto com **origem correta** por entry; regressão zero comprovada por **tsc**, **runner Fase 35** e **testes do núcleo** (incl. caso misto).

**Fase 36 encerrada com validação final obrigatória cumprida.**
