# CHECKLIST DE AUDITORIA — LICITAIA / DECYON V2

## 1. Função normativa deste documento

Checklist **obrigatório** para auditoria técnica e institucional de fases, entregas e fechamentos. Foco: **robustez, auditabilidade e regressão zero** — não expansão indevida de escopo.

Base normativa: **PLANO MESTRE — DECYON V2**, **MASTER CONTEXT**, **REGRAS DE DESENVOLVIMENTO**.

---

## 2. Antes de iniciar uma fase ou alteração relevante

- [ ] **Plano Mestre** lido e escopo da mudança explicitamente aderente (`01-planejamento/PLANO-MESTRE-DECYON-V2.md`).  
- [ ] **Master Context** considerado (`01-planejamento/governanca/MASTER-CONTEXT-LICITAIA.md`).  
- [ ] **Estrutura real** verificada (`01-planejamento/ESTRUTURA REAL DO PROJETO — LICITAIA V2.md.txt`).  
- [ ] Nenhuma decisão contrária aos **pilares inegociáveis** (Plano Mestre, Secção 3).  
- [ ] Nenhuma intenção de quebrar o **núcleo** (orchestrator, módulos DFD/ETP/TR/PRICING, validadores, traces).

---

## 3. Durante a implementação

- [ ] **IA** não usada para decisão jurídica ou governo de fluxo.  
- [ ] **Regras jurídicas e travas centrais** não migradas para camada exclusivamente visual.  
- [ ] **Contratos** de entrada/saída respeitados ou alterados apenas com justificativa formal e rastreável.  
- [ ] **Persistência** sem lógica de negócio indevida.  
- [ ] **Duplicação de regras** entre camadas evitada (camadas: ARQUITETURA — CAMADAS DO SISTEMA).  
- [ ] Mudanças **mínimas e necessárias** ao objetivo da fase (sem drive-by refactor).

---

## 4. Encerramento de fase (regra 10/10 — Plano Mestre, Secção 8)

- [ ] **Regressão zero:** testes e cenários exigidos passando; matrizes oficiais (ex.: Fase 35, 37) preservadas quando aplicável.  
- [ ] **Consistência com o núcleo:** comportamento alinhado ao motor de conformidade.  
- [ ] **Auditabilidade:** saídas rastreáveis (decision trace, códigos de validação, halt, logs quando couber).  
- [ ] **Ambiguidade:** nenhuma lacuna técnica conhecida deixada sem registro ou plano explícito.  
- [ ] **Arquitetura:** código coerente com a macro (Core / Backend / Produto) e com camadas.  
- [ ] **Documentação mínima:** relatório ou nota de encerramento de fase quando a fase exigir.

Se qualquer item essencial falhar: **a fase não está em 10/10** — não avançar.

---

## 5. Auditoria de segurança de dados e governança (quando aplicável)

- [ ] **Isolamento por tenant** respeitado (quando multi-tenant ativo).  
- [ ] **Trilha** e histórico conforme Plano Mestre e governança de dados (Secção 6).  
- [ ] **LGPD / acesso:** sem exposição indevida de dados sensíveis em logs ou respostas.

---

## 6. Plano de finalização (pós–Fase 49)

- [ ] **Matriz de Fechamento** consultada (`01-planejamento/governanca/MATRIZ-DE-FECHAMENTO-DECYON-V2.md`).  
- [ ] **Ordem das Etapas A–H** respeitada; **G** e **H** tratadas como transversais após o fechamento material (Plano Mestre, Secção 11).  
- [ ] **ETAPA A:** sem antecipação da camada documental premium/final; testes e regressão do motor **permitidos** conforme Plano Mestre.

---

## 7. Classificação de achados (obrigatória em relatórios de auditoria)

Ao documentar problemas:

- **CRÍTICO** — quebra estrutural ou risco real de conformidade/regressão.  
- **IMPORTANTE** — melhora robustez ou auditabilidade.  
- **SECUNDÁRIO** — ajuste fino.  
- **FORA DE FOCO** — não exige ação no escopo atual.

---

## 8. Encerramento

Este checklist **não substitui** provas técnicas (testes, revisão de código, revisão de contratos). Ele **garante** que nenhuma dimensão normativa consolidada pelo projeto foi ignorada antes de declarar conclusão.
