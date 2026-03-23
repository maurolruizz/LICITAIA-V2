# REGRAS DE DESENVOLVIMENTO — LICITAIA / DECYON V2

## 1. Função normativa deste documento

Este arquivo define **regras obrigatórias de desenvolvimento e evolução** do LICITAIA V2 (DECYON V2). Complementa o **MASTER CONTEXT — LICITAIA** e o **PLANO MESTRE — DECYON V2**.

**Hierarquia:** em qualquer divergência, prevalece o **PLANO MESTRE** (`01-planejamento/PLANO-MESTRE-DECYON-V2.md`, Secção 10).

---

## 2. Leitura obrigatória antes de implementar

Antes de qualquer implementação:

1. Revisar o **Plano Mestre** e confirmar aderência total (Plano Mestre, Secção 10).  
2. Revisar o **Master Context** (`01-planejamento/governanca/MASTER-CONTEXT-LICITAIA.md`).  
3. Verificar a **estrutura física real** do repositório em `01-planejamento/ESTRUTURA REAL DO PROJETO — LICITAIA V2.md.txt` e declarar no trabalho: **VERIFICAÇÃO DE ESTRUTURA REAL: OK** quando aplicável.  
4. Aplicar o **Checklist de Auditoria** (`01-planejamento/governanca/CHECKLIST-DE-AUDITORIA-LICITAIA.md`) ao fechar fase ou entrega relevante.

---

## 3. Regras de evolução do projeto (fonte: Plano Mestre, Secção 9)

- nenhuma fase pode quebrar o núcleo;
- nenhuma fase pode ignorar o Plano Mestre;
- nenhuma decisão pode ser tomada fora do Plano Mestre;
- qualquer novo requisito **deve ser registrado no Plano Mestre antes da implementação**.

---

## 4. Critério de aceite de fase — regra 10/10 (fonte: Plano Mestre, Secção 8)

Uma fase só é considerada concluída quando:

- não há regressão;
- o comportamento é consistente com o núcleo;
- os testes passam integralmente;
- o resultado é auditável;
- não há ambiguidade técnica;
- o código está coerente com a arquitetura;
- existe documentação mínima.

**Qualquer nota abaixo de 10/10 impede avanço.**

---

## 5. Preservação do núcleo modular (fonte: ESTRUTURA REAL + arquitetura)

- A lógica modular de conformidade do motor permanece sob **02-frontend/licitaia-v2-web/modules** conforme a estrutura real oficial.  
- Não criar **src/** na raiz do frontend sem decisão arquitetural explícita registrada.  
- Não duplicar o núcleo em pastas paralelas.

---

## 6. Atualização da estrutura real (fonte: 07-prompts-cursor)

Após qualquer fase que **crie ou reorganize** pastas estruturais no repositório, o responsável deve **atualizar** o documento **ESTRUTURA REAL DO PROJETO — LICITAIA V2.md.txt** e registrar **ESTRUTURA DO PROJETO ATUALIZADA**.

Referência de procedimento: `07-prompts-cursor/REGRA — ATUALIZAÇÃO DA ESTRUTURA DO PROJETO.md.txt`.

---

## 7. Separação de responsabilidades (fonte: ARQUITETURA — CAMADAS DO SISTEMA)

- Regras jurídicas e travas centrais **não** residem em componentes puramente visuais.  
- Persistência **não** contém lógica de negócio.  
- IA **não** governa fluxo nem decide enquadramento jurídico.  
- Evitar duplicação da mesma regra em múltiplas camadas.

---

## 8. Foco de robustez, não expansão indevida

- Priorizar **consolidação do núcleo**, **cobertura real**, **coerência** e **eliminação de lacunas**.  
- Não inflar escopo sem necessidade real do núcleo (alinhado aos pilares e às regras arquiteturais inegociáveis da V2).

---

## 9. Plano de finalização (Etapas A–H)

Quando o projeto estiver **após a Fase 49 concluída em 10/10**, aplica-se o **Plano de Finalização** (Plano Mestre, Secção 11) e a **Matriz de Fechamento** (`01-planejamento/governanca/MATRIZ-DE-FECHAMENTO-DECYON-V2.md`).

Durante a **ETAPA A**, observar a **regra de não geração prematura** tal como refinada no Plano Mestre (Secção 11.5): proibição de antecipar camada documental premium/final e de usar IA decisória, **sem** impedir testes, evidências e regressão do motor existente.

---

## 10. Documentos arquiteturais complementares

Os arquivos em `01-planejamento/` com prefixo **ARQUITETURA —** e **ARQUITETURA-V2.md.txt** permanecem fontes técnicas detalhadas. Este arquivo não os revoga; **restringe** o comportamento de desenvolvimento para preservar coerência com eles e com o Plano Mestre.
