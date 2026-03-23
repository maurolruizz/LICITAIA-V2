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
