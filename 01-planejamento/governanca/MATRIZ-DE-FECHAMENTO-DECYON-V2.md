# MATRIZ DE FECHAMENTO — DECYON V2

## 1. Função normativa

Matriz **mínima executável** do fechamento final (Frentes 1–7 e Etapas A–H). Complementa o **PLANO MESTRE — DECYON V2**, Secção 11. **Não cria novas frentes** nem altera a ordem aprovada no Plano Mestre.

**Vocabulário:** Fase (1–49) ≠ Frente (1–7) ≠ Etapa (A–H) — definições no Plano Mestre, Secção 11.2.

---

## 2. Mapa Etapa → Frente (execução principal)

| Etapa | Frente(s) material(is) | Natureza |
|-------|-------------------------|----------|
| A | 1 e 2 | Sequencial obrigatória |
| B | 3 | Sequencial obrigatória |
| C | 4 | Sequencial obrigatória |
| D | 5 | Sequencial obrigatória |
| E | 6 | Sequencial obrigatória |
| F | 7 | Sequencial obrigatória |
| G | — | **Transversal:** audita o conjunto das Frentes 1–7 já executadas em A–F |
| H | — | **Transversal:** deploy, apresentação institucional e readiness final **após** G |

As Etapas **G** e **H** **não** são Frentes adicionais: incidem sobre o trabalho já consolidado nas sete frentes.

---

## 3. Frentes — executabilidade mínima

### FRENTE 1 — Core de compliance

| Campo | Conteúdo |
|--------|-----------|
| **Objetivo verificável** | Cobertura de compliance do núcleo: travas, halts e validações estruturais aplicam-se a **todos** os cenários relevantes declarados; nenhuma inconsistência silenciosa. |
| **Escopo do fechamento** | Orchestrator, encadeamento de módulos, validadores, halt, códigos de validação, coerência com decision trace e explicabilidade. |
| **Travas obrigatórias** | Inconsistência bloqueia avanço; motivo do bloqueio registrado e auditável; sem atalho que contorne o núcleo. |
| **Prova de aceite 10/10** | Matriz de cenários / regressão oficial do núcleo em verde; evidências de halt e códigos para casos negativos; revisão cruzada com pilares do Plano Mestre (Secção 3). |
| **Dependências principais** | Estado consolidado até Fase 49; contratos de API e motor estáveis. |
| **Etapa** | **A** (com Frente 2) |

---

### FRENTE 2 — Jurídico e matemático

| Campo | Conteúdo |
|--------|-----------|
| **Objetivo verificável** | Regras jurídicas e cálculos administrativos **centralizados** no núcleo; respostas determinísticas para o mesmo input; memória de cálculo e pricing coerentes com travas. |
| **Escopo do fechamento** | Validação jurídica, validação cruzada, memória de cálculo, PRICING, score explicável, diferenciação real regime/objeto/estrutura. |
| **Travas obrigatórias** | Violação normativa ou inconsistência matemática → bloqueio; explicação estruturada do motivo. |
| **Prova de aceite 10/10** | Conjunto de casos canônicos positivos/negativos cobrindo regimes e objetos relevantes; ausência de divergência entre documentos (DFD, ETP, TR) quando o núcleo exige coerência. |
| **Dependências principais** | Frente 1 estável; especificações normativas usadas pelo motor versionadas ou referenciadas. |
| **Etapa** | **A** (com Frente 1) |

---

### FRENTE 3 — Estrutura documental

| **Objetivo verificável** | Documentos e artefatos **estruturados e determinísticos** derivados do motor; rastreabilidade ponta a ponta do que foi gerado ou validado. |
| **Escopo do fechamento** | Modelo documental alinhado ao pipeline; geração compatível com auditabilidade (sem texto livre indevido em campos críticos). |
| **Travas obrigatórias** | Não gerar documento final se pré-condições de compliance não satisfeitas; campos críticos estruturados. |
| **Prova de aceite 10/10** | Amostras de execução reproduzíveis; verificação de consistência entre payload, decisão e documento. |
| **Dependências principais** | Etapa **A** concluída em 10/10. |
| **Etapa** | **B** |

---

### FRENTE 4 — Camada documental premium

| **Objetivo verificável** | Camada **premium** (layout institucional, padrões externos exigidos) **sem** comprometer determinismo nem auditabilidade; zero fingerprint de IA indevido (Plano Mestre, Secção 5.8). |
| **Escopo do fechamento** | Templates, renderização, padrão compatível com exigências institucionais (ex.: TCU onde aplicável). |
| **Travas obrigatórias** | Premium não pode mascarar inconsistência nem omitir travas do núcleo; não antecipar esta frente antes da **C**. |
| **Prova de aceite 10/10** | Documentos de referência aprovados institucionalmente; revisão de rastreabilidade e de ausência de vazamento de lógica para camada errada. |
| **Dependências principais** | Etapa **B** em 10/10. |
| **Etapa** | **C** |

---

### FRENTE 5 — IA assistiva de precisão

| **Objetivo verificável** | IA **apenas assistiva**: sugere, estrutura ou refina texto **sem** decidir; saídas encapsuladas e revisáveis; fluxo e travas permanecem no núcleo. |
| **Escopo do fechamento** | Serviços de IA, adaptadores de saída, limites de escopo; alinhamento a ARQUITETURA — CAMADAS (Backend AI). |
| **Travas obrigatórias** | IA não governa fluxo; não define enquadramento jurídico; não remove bloqueios do motor; não altera decisão estrutural ou matemática; em conflito, prevalece o motor; em falha de IA, mantém-se conteúdo original válido. |
| **Prova de aceite 10/10** | Testes de que decisões e halts permanecem inalterados com IA ligada ou desligada para o mesmo caso de validação estrutural; prova de fallback obrigatório para conteúdo original válido. |
| **Dependências principais** | Etapas **A–C** em 10/10. |
| **Etapa** | **D** |

---

### FRENTE 6 — Condução total do usuário

| **Objetivo verificável** | Usuário conduzido **sem página em branco** nem ambiguidade operacional crítica; estados e próximos passos claros; alinhamento a travas do núcleo. |
| **Escopo do fechamento** | UX de fluxo, orientação de etapas, mensagens de erro e halt compreensíveis institucionalmente. |
| **Travas obrigatórias** | UI não pode burlar validações; bloqueios do servidor prevalecem. |
| **Prova de aceite 10/10** | Percurso completo demonstrável por persona alvo; ausência de atalhos que gerem decisão inválida. |
| **Dependências principais** | Etapas **A–D** em 10/10. |
| **Etapa** | **E** |

---

### FRENTE 7 — Produto real (SaaS)

| **Objetivo verificável** | Produto **operável** em ambiente real: multi-tenant, segurança, observabilidade, deploy, continuidade — conforme Secções 5 e 6 do Plano Mestre. |
| **Escopo do fechamento** | Auth, RBAC, ambientes, CI/CD, backup, integrações oficiais previstas, governança de dados. |
| **Travas obrigatórias** | Isolamento por tenant; auditoria de ações; dados sensíveis protegidos. |
| **Prova de aceite 10/10** | Checklist de segurança e operações mínimas cumprido; evidências de segregação e de auditoria. |
| **Dependências principais** | Etapas **A–E** em 10/10. |
| **Etapa** | **F** |

---

## 4. ETAPA G — Auditoria transversal

| Campo | Conteúdo |
|--------|-----------|
| **Objetivo verificável** | Auditoria **100%** do conjunto entregue nas Frentes 1–7: reabrir riscos, provas, trilhas e consistência normativa. |
| **Escopo** | Revisão independente (interna ou externa conforme política do projeto) com registro de achados classificados (CRÍTICO / IMPORTANTE / SECUNDÁRIO / FORA DE FOCO). |
| **Travas** | Achados **CRÍTICOS** corrigidos ou formalmente aceitos com plano antes de **H**. |
| **Prova 10/10** | Relatório de auditoria fechado sem pendência crítica aberta. |

---

## 5. ETAPA H — Transversal (deploy e institucional)

| Campo | Conteúdo |
|--------|-----------|
| **Objetivo verificável** | **Readiness** para uso institucional: deploy aprovado, apresentação e pacote de evidências alinhados ao Plano Mestre (Secção 11.9). |
| **Escopo** | Go-live controlado, comunicação institucional, handover operacional mínimo. |
| **Travas** | **H** só inicia com **G** em 10/10. |
| **Prova 10/10** | Critérios de prontidão verificados e documentados; nenhuma etapa anterior pulada. |

---

## 6. Encerramento

Esta matriz é **enxuta por desenho**. Detalhamento técnico adicional deve constar de relatórios de fase ou de anexos **sem** contradizer o Plano Mestre.

---

## 7. Checkpoint de atualização normativa (obrigatório)

Antes de declarar qualquer etapa/fase interna como 10/10, deve haver checkpoint formal respondendo:

1. se houve criação/alteração/consolidação de regra normativa;
2. se houve necessidade de atualizar o Plano Mestre;
3. se houve necessidade de atualizar esta Matriz de Fechamento;
4. se houve necessidade de criar/atualizar artefatos em `01-planejamento/governanca/`.

Se a resposta for positiva em qualquer item, a atualização normativa deve ser executada na mesma etapa.

Sem checkpoint aplicado e executado, o encerramento não é válido.

## 8. Checkpoint Git obrigatório (rastreabilidade de encerramento)

Antes de declarar qualquer etapa/fase em 10/10, registrar formalmente:

1. hash do commit de encerramento;
2. tag de marco aprovado (quando aplicável);
3. confirmação de `git status` limpo para o escopo de encerramento;
4. evidência de que o padrão oficial de versionamento foi seguido.

Sem checkpoint Git aplicado, o encerramento não é válido.
