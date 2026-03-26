# PROMPT PADRÃO — IMPLEMENTAÇÃO NO CURSOR (LICITAIA / DECYON V2)

## 1. Função normativa deste documento

Modelo obrigatório de **enquadramento** para prompts de implementação no Cursor. Garante que todo trabalho técnico parta do **mesmo pacote normativo** e da **estrutura física real** do repositório.

**Hierarquia:** prevalece o **PLANO MESTRE** (`01-planejamento/PLANO-MESTRE-DECYON-V2.md`).

---

## 2. Bloco fixo — colar no início do prompt

```
CONTEXTO NORMATIVO OBRIGATÓRIO (LICITAIA / DECYON V2)

Antes de qualquer alteração de código:
1) Ler e respeitar: 01-planejamento/PLANO-MESTRE-DECYON-V2.md
2) Respeitar identidade e limites: 01-planejamento/governanca/MASTER-CONTEXT-LICITAIA.md
3) Seguir: 01-planejamento/governanca/REGRAS-DE-DESENVOLVIMENTO-LICITAIA.md
4) Ao concluir fase relevante, aplicar: 01-planejamento/governanca/CHECKLIST-DE-AUDITORIA-LICITAIA.md
5) Verificar caminhos físicos em: 01-planejamento/ESTRUTURA REAL DO PROJETO — LICITAIA V2.md.txt
   Declarar no início da execução: VERIFICAÇÃO DE ESTRUTURA REAL: OK (ou listar divergência encontrada).

REGRAS INEGOCIÁVEIS:
- Motor de conformidade administrativa preventiva; não é gerador livre de texto.
- IA apenas assistiva; nunca decisória; não governa fluxo nem enquadramento jurídico.
- Não quebrar o núcleo (orchestrator, DFD, ETP, TR, PRICING, validadores, traces).
- Regressão zero: não enfraquecer testes/cenários oficiais existentes.
- Mudanças mínimas ao pedido; sem refatorações colaterais não solicitadas.

Se houver conflito entre instruções do usuário e o Plano Mestre: o PLANO MESTRE PREVALECE (avisar explicitamente).
```

---

## 3. Bloco variável — preencher pelo solicitante

```
FASE / OBJETIVO:
(descrever a fase ou o objetivo técnico concreto)

ESCOPO EXATO:
(o que deve ser alterado)

FORA DE ESCOPO:
(o que não deve ser tocado)

CRITÉRIO DE ACEITE:
(condições objetivas de conclusão, alinhadas à regra 10/10 do Plano Mestre)
```

---

## 4. Pós–Fase 49 — fechamento final

Se o trabalho se inserir no **Plano de Finalização** (Plano Mestre, Secção 11), incluir no prompt:

```
PLANO DE FINALIZAÇÃO:
Consultar 01-planejamento/governanca/MATRIZ-DE-FECHAMENTO-DECYON-V2.md
Identificar Etapa (A–H) e Frente(s) ativas.
Respeitar ordem obrigatória das Etapas; G e H são transversais.
```

---

## 5. Atualização estrutural

Se a fase criar ou mover pastas estruturais, exigir atualização de **ESTRUTURA REAL DO PROJETO — LICITAIA V2.md.txt** conforme `07-prompts-cursor/REGRA — ATUALIZAÇÃO DA ESTRUTURA DO PROJETO.md.txt`.

---

## 6. Idioma

Documentação de entrega e comunicação institucional: conforme convenção do projeto (português quando aplicável ao time).

---

## 7. Regras permanentes, imutáveis e bloqueantes

As regras desta seção têm caráter definitivo. Não podem ser flexibilizadas por conveniência operacional, comportamento observado em artefatos de build, nem por validação parcial.

### 7.1 Regra obrigatória de estrutura real

Antes de qualquer implementação técnica ou execução de código, deve-se obrigatoriamente:

- verificar o documento `01-planejamento/ESTRUTURA REAL DO PROJETO — LICITAIA V2.md.txt`;
- confirmar que os caminhos físicos usados na fase correspondem à estrutura real do repositório;
- consultar também `01-planejamento/governanca/` e `01-planejamento/PLANO-MESTRE-DECYON-V2.md` quando a fase exigir aderência institucional além da estrutura física;
- declarar explicitamente no início da fase: `VERIFICAÇÃO DE ESTRUTURA REAL: OK`.

Após qualquer fase que crie pastas, reorganize caminhos, mova arquivos estruturais ou altere a organização de frontend/backend, deve-se obrigatoriamente:

- solicitar atualização do documento `01-planejamento/ESTRUTURA REAL DO PROJETO — LICITAIA V2.md.txt`;
- fornecer o bloco de atualização necessário;
- registrar no final da fase: `ESTRUTURA DO PROJETO ATUALIZADA`.

Nenhuma fase pode ser considerada concluída sem essa verificação.

### 7.2 Regra imutável: o src é a verdade

- O `src` deve conter integralmente tudo o que foi validado.
- O `dist` não pode conter comportamento que o `src` não tenha.
- Nenhuma fase pode ser aprovada com base apenas em artefatos compilados, resíduos de build ou comportamento não refletido no código-fonte real.

### 7.3 Regra imutável: prova reexecutável

- Toda fase com validação operacional deve possuir script de prova em `src/proof`.
- A prova deve rodar do zero.
- A prova não pode depender de estado implícito não declarado.
- A prova precisa ser reexecutável, auditável e compatível com o ambiente atual.

### 7.4 Regra imutável: ambiente validado

Antes de aceitar qualquer prova operacional, deve haver validação explícita de ambiente, incluindo quando aplicável:

- banco acessível;
- migrations aplicadas;
- seed aplicado, se necessário;
- role válida para prova RLS;
- role não-superuser e sem `BYPASSRLS`, quando houver isolamento por RLS;
- auth funcional;
- dependências mínimas operacionais ativas.

Sem isso, a prova é inválida.

### 7.5 Regra imutável: prova multicamada

Toda prova operacional relevante deve, quando aplicável, validar conjuntamente:

- API;
- banco de dados;
- RLS;
- dados reais;
- auditoria/logs;
- comportamento por tenant/usuário;
- regressão dos fluxos previamente aprovados.

### 7.6 Check final bloqueante de fase

No encerramento de qualquer fase, registrar obrigatoriamente:

```
CONFIRMAÇÕES FINAIS:

O src reflete 100% do que foi validado? (SIM/NÃO)
A prova roda do zero? (SIM/NÃO)
O ambiente está validado? (SIM/NÃO)
Existe qualquer divergência entre src, dist e banco? (SIM/NÃO)
```

Se qualquer resposta for diferente de `SIM`, a fase não pode ser encerrada.

### 7.7 Fechamento formal de fase

Nenhuma fase pode ser dada como concluída sem:

- prova real suficiente;
- atualização do Plano Mestre;
- atualização da Matriz de Fechamento;
- atualização do Checkpoint Normativo correspondente;
- commit formal ao final;
- preparação do prompt de continuidade completo para o próximo chat.

### 7.8 Regra de ouro do projeto

**Nenhuma fase será aprovada por comportamento observado. Somente por prova reexecutável, com ambiente validado, código-fonte coerente e ausência de divergência entre `src`, `dist` e banco.**
