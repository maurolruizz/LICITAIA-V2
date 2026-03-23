# CHECKPOINT NORMATIVO — RECONCILIACAO ETAPA E (FASE INTERNA 1) — 2026-03-23

## 1. Aplicacao

Checkpoint aplicado antes de qualquer implementacao da ETAPA E (Frente 6), para reconciliar governanca, estrutura real e operacao frontend.

## 2. Diagnostico formal da divergencia

- coexistencia de `02-frontend/licitaia-v2-demo` e `02-frontend/licitaia-v2-web` sem definicao normativa explicita de papeis para ETAPA E;
- `licitaia-v2-demo` operando de forma paralela ao nucleo modular, com templates locais e sem consumo direto do nucleo;
- presenca de artefatos estruturais (`modules-dist`, `.git-backup-raiz`) sem classificacao normativa objetiva no documento de estrutura real.

## 3. Decisao canonica consolidada

1) `02-frontend/licitaia-v2-web`:
- classificado como nucleo modular frontend;
- fonte de contratos, modulos, validacoes estruturais, eventos e logica central.

2) `02-frontend/licitaia-v2-demo`:
- classificado como camada operacional de interacao guiada;
- frontend oficial da ETAPA E.

3) `02-frontend/licitaia-v2-web/modules-dist`:
- classificado como artefato derivado tecnico de build/distribuicao;
- nao e fonte de verdade arquitetural.

4) `.git-backup-raiz`:
- classificado como artefato tecnico/administrativo;
- nao participa do runtime do sistema.

## 4. Risco e mitigacao

Risco classificado: IMPORTANTE.

Risco:
- bifurcacao de frontend e dupla verdade operacional sem definicao canonica.

Mitigacao obrigatoria:
- manter `licitaia-v2-demo` como frontend operacional da ETAPA E;
- manter `licitaia-v2-web` como nucleo modular;
- vedar duplicacao de regra central no frontend operacional;
- exigir atualizacao normativa previa para qualquer alteracao de papel entre caminhos.

## 5. Impacto estrutural desta reconciliacao

- impacto no motor central: zero;
- impacto no backend IA: zero;
- impacto na estrutura documental deterministica: zero;
- impacto na camada premium: zero.

## 6. Evidencias de estrutura fisica verificadas

- raiz: `C:\LICITAIA-V2`;
- frontend operacional: `C:\LICITAIA-V2\02-frontend\licitaia-v2-demo`;
- frontend nucleo: `C:\LICITAIA-V2\02-frontend\licitaia-v2-web`;
- nucleo modular: `C:\LICITAIA-V2\02-frontend\licitaia-v2-web\modules`;
- derivado tecnico: `C:\LICITAIA-V2\02-frontend\licitaia-v2-web\modules-dist`.

## 7. Checkpoint normativo obrigatorio

1) criou/alterou/consolidou regra normativa?
- SIM.

2) exigiu atualizar Plano Mestre?
- SIM.

3) exigiu atualizar Matriz de Fechamento?
- SIM.

4) exigiu atualizar artefato de estrutura real?
- SIM.

5) atualizacoes foram executadas nesta mesma etapa?
- SIM.
