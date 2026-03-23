# TERMO DE BASELINE — ETAPA C (FASE INTERNA 1)

## 1. Função normativa

Este termo fixa a baseline oficial consumível da ETAPA C (camada documental premium), sem reabertura da ETAPA A ou ETAPA B.

## 2. Baseline oficial vigente da ETAPA C

A ETAPA C deve consumir, obrigatoriamente, o conjunto abaixo:

- `01-planejamento/RELATORIO-RECONCILIACAO-ETAPA-B.md`
- `01-planejamento/MATRIZ-ESTRUTURAL-DFD-ETAPA-B.md`
- `01-planejamento/MATRIZ-ESTRUTURAL-ETP-ETAPA-B.md`
- `01-planejamento/MATRIZ-ESTRUTURAL-TR-ETAPA-B.md`
- `01-planejamento/MATRIZ-COERENCIA-DFD-ETP-TR-ETAPA-B.md`
- `01-planejamento/MANIFESTO-DERIVACAO-DOCUMENTAL-DETERMINISTICA-ETAPA-B.md`
- Implementação vigente:
  - `02-frontend/licitaia-v2-web/modules/domain/shared/administrative-document-structure.ts`
  - `02-frontend/licitaia-v2-web/modules/domain/shared/administrative-document.engine.ts`
  - `02-frontend/licitaia-v2-web/modules/domain/shared/administrative-document.types.ts`

## 3. Classificação dos relatórios históricos

- **Reconciliado e vigente:** `RELATORIO-RECONCILIACAO-ETAPA-B.md`.
- **Superado para regra vigente, mantido para histórico:** `RELATORIO-FASE-31-DOCUMENT-MODEL.md`.
- **Superado parcialmente (apenas trechos conflitantes), mantido para histórico:** `RELATORIO-FASE-28-MOTOR-DE-CONSISTENCIA-DOCUMENTAL.md`.
- **Demais relatórios de fase:** histórico/auditoria, sem força para redefinir baseline da ETAPA C.

## 4. Regra de prevalência em conflito

Ordem obrigatória de prevalência:

1. `01-planejamento/PLANO-MESTRE-DECYON-V2.md`
2. `01-planejamento/governanca/MATRIZ-DE-FECHAMENTO-DECYON-V2.md`
3. Matrizes e manifesto da ETAPA B listados neste termo
4. Código vigente do motor
5. Relatórios históricos de fase

Conflito entre relatório antigo e código vigente: prevalecem baseline reconciliada + código vigente.

## 5. Fronteira da ETAPA C

- ETAPA C não redefine anatomia estrutural da ETAPA B.
- ETAPA C não introduz IA assistiva.
- ETAPA C não antecipa ETAPA D.
- ETAPA C só fecha camada premium subordinada ao determinismo já congelado.
