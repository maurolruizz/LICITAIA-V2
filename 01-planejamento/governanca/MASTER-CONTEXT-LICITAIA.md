# MASTER CONTEXT — LICITAIA / DECYON V2

## 1. Função normativa deste documento

Este arquivo é o **contexto mestre institucional** do projeto **LICITAIA V2**, operacionalizado como **DECYON V2** no **PLANO MESTRE — DECYON V2 (VERSÃO DEFINITIVA)** (`01-planejamento/PLANO-MESTRE-DECYON-V2.md`).

Em caso de conflito interpretativo entre este Master Context e o Plano Mestre, **prevalece o Plano Mestre** (regra explícita na Secção 10 do Plano Mestre).

Este documento materializa, em um único artefato versionado, a identidade e os limites do sistema já consolidados nos documentos de arquitetura do repositório, em especial **ARQUITETURA — CAMADAS DO SISTEMA** e **ARQUITETURA-V2**.

---

## 2. Identidade do sistema (fonte: Plano Mestre, Secção 1)

A DECYON V2 é um:

- motor de conformidade administrativa preventiva;
- orientado à estruturação da decisão administrativa;
- com foco em consistência, rastreabilidade e controle.

### Princípios fundamentais

- não é gerador livre de texto;
- não é ferramenta opinativa;
- não substitui o agente público;
- **IA é apenas assistiva e nunca decisória**;
- toda saída deve ser: **estruturada**, **justificável**, **rastreável**.

---

## 3. Arquitetura macro obrigatória (fonte: Plano Mestre, Secção 2)

O sistema é dividido em **3 blocos**:

### 3.1 Cérebro (CORE)

- orchestrator administrativo;
- módulos: DFD, ETP, TR, PRICING;
- validadores estruturais;
- validação jurídica e validação cruzada;
- decision trace e decision explanation;
- memória de cálculo;
- score explicável.

**Regra absoluta:** o núcleo não pode ser quebrado.

### 3.2 Sistema (BACKEND)

- API estruturada;
- contratos de entrada e saída;
- controle de execução do motor;
- auditoria técnica;
- integração com persistência.

### 3.3 Produto (camada operacional)

- frontend (painel);
- autenticação;
- multi-tenant;
- auditoria de usuários;
- integrações externas;
- ambiente SaaS.

### 3.4 Alinhamento com as camadas do repositório (fonte: ARQUITETURA — CAMADAS DO SISTEMA)

O repositório descreve ainda três blocos estruturais **FRONTEND**, **BACKEND API** e **BACKEND AI**. O mapeamento normativo é:

- **FRONTEND** corresponde à camada de produto/apresentação e orquestração de interface, **sem** conter regra jurídica decisória nem cálculo administrativo central indevidamente espalhado;
- **BACKEND API** corresponde ao **Sistema (Backend)** e à execução segura do motor;
- **BACKEND AI** existe apenas para **apoio assistido** (geração ou transformação textual, estruturação assistida), **sem** decidir juridicamente e **sem** governar o fluxo do processo administrativo.

---

## 4. Princípio central das camadas (fonte: ARQUITETURA — CAMADAS DO SISTEMA, Secção 1)

O LICITAIA é um **motor de conformidade administrativa preventiva**, não um gerador de documentos.

Por esse motivo:

- regras jurídicas não podem ficar em componentes visuais;
- cálculos administrativos não podem ficar espalhados;
- IA não pode decidir juridicamente;
- persistência não pode conter lógica de negócio;
- cada bloco do sistema tem responsabilidade definida.

---

## 5. Pilares inegociáveis (fonte: Plano Mestre, Secção 3)

- regressão zero;
- coerência entre documentos (DFD, ETP, TR, etc.);
- trilha de auditoria completa;
- memória de cálculo estruturada;
- score explicável;
- bloqueio quando necessário;
- separação clara entre necessidade, justificativa e estratégia;
- diferenciação real entre regimes jurídicos, tipos de objeto e estrutura do objeto.

---

## 6. Proibições arquiteturais (fonte: ARQUITETURA — CAMADAS DO SISTEMA, Secção 6)

São proibidos no LICITAIA V2:

- regra jurídica em componente visual;
- cálculo administrativo espalhado;
- IA decidindo enquadramento jurídico;
- controllers contendo regra pesada;
- persistência contendo lógica de negócio;
- duplicação de regra em múltiplas camadas;
- mistura entre apresentação, lógica e infraestrutura.

---

## 7. Regras arquiteturais inegociáveis da V2 (fonte: ARQUITETURA-V2)

1. Não programar antes de definir a estrutura.  
2. Não criar telas antes de definir fluxo.  
3. Não criar banco antes de definir entidades e relacionamentos.  
4. Não deixar lógica jurídica espalhada.  
5. Não deixar lógica matemática espalhada.  
6. Não misturar backend, regra de negócio e dados.  
7. Não quebrar a arquitetura modular.  
8. Não permitir salto indevido de etapa no fluxo do processo.  
9. Não enfraquecer o registro de eventos administrativos.  
10. Não expandir o sistema sem necessidade real do núcleo.

Observação: o ficheiro `ARQUITETURA-V2.md.txt` pode referir tecnologias-alvo históricas; a **implementação efetiva** deve sempre ser conferida em `ESTRUTURA REAL DO PROJETO — LICITAIA V2.md.txt` e no código versionado, sem violar os princípios acima.

---

## 8. Estrutura física e continuidade (fonte: ESTRUTURA REAL DO PROJETO)

Toda implementação deve respeitar a estrutura física registrada em:

`01-planejamento/ESTRUTURA REAL DO PROJETO — LICITAIA V2.md.txt`

Objetivo: **regressão zero**, evitar estruturas paralelas e alinhar prompts ao estado real do código.

---

## 9. Pacote normativo obrigatório

Interpretação e execução do projeto exigem leitura conjunta de:

| Artefato | Caminho |
|----------|---------|
| Plano Mestre | `01-planejamento/PLANO-MESTRE-DECYON-V2.md` |
| Master Context | `01-planejamento/governanca/MASTER-CONTEXT-LICITAIA.md` |
| Regras de Desenvolvimento | `01-planejamento/governanca/REGRAS-DE-DESENVOLVIMENTO-LICITAIA.md` |
| Checklist de Auditoria | `01-planejamento/governanca/CHECKLIST-DE-AUDITORIA-LICITAIA.md` |
| Princípio de supremacia do motor | `01-planejamento/governanca/PRINCIPIO-DE-SUPREMACIA-DO-MOTOR.md` |
| Prompt padrão (Cursor) | `01-planejamento/governanca/PROMPT-PADRAO-CURSOR.md` |
| Matriz de Fechamento | `01-planejamento/governanca/MATRIZ-DE-FECHAMENTO-DECYON-V2.md` |

---

## 10. Encerramento

Este Master Context **não substitui** relatórios de fase, arquiteturas detalhadas nem o Plano Mestre. Ele **ancora** a identidade e os limites do sistema para qualquer trabalho futuro no repositório.
