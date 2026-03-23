# PRINCÍPIO DE SUPREMACIA DO MOTOR SOBRE A IA

## 1. Definição formal do princípio

O valor institucional do DECYON V2 está no motor de condução administrativa, nas travas jurídicas e matemáticas, e na prevenção de erro estrutural.

A IA é componente assistivo de refinamento textual, sem autoridade para decidir, enquadrar, validar ou corrigir o núcleo.

Regra de prevalência obrigatória:

- motor e `processSnapshot` final prevalecem sobre qualquer saída de IA;
- em conflito, a saída de IA é descartada;
- em falha da IA, permanece o conteúdo original válido do motor.

## 2. Comportamentos proibidos (IA)

- decidir enquadramento jurídico;
- decidir estrutura documental;
- decidir cálculo ou memória de cálculo;
- criar justificativa decisória inédita;
- mascarar inconsistência ou bloqueio do motor;
- alterar sentido técnico/jurídico de conteúdo já validado;
- remover ou reclassificar estado de halt/compliance;
- servir como dependência obrigatória para execução de DFD, ETP, TR ou PRICING.

## 3. Comportamentos permitidos (IA)

- reescrever texto já validado pelo motor;
- padronizar estilo e terminologia;
- melhorar clareza, coesão e legibilidade;
- ajustar forma sem alterar semântica;
- produzir variações formais auditáveis a partir de input controlado.

## 4. Relação com a ETAPA D

- A ETAPA D só pode iniciar após ETAPAS A, B e C em 10/10.
- A IA só pode ser acionada com:
  - `processSnapshot` final da execução;
  - documento premium já gerado e validado.
- A ETAPA D não reabre decisões normativas/estruturais das etapas anteriores.

## 5. Relação com rastreabilidade e auditoria

Toda execução assistiva de IA deve registrar:

- referência do `processSnapshot` de origem;
- referência do documento premium de entrada;
- versão do prompt/transformação aplicada;
- validações de preservação de significado;
- resultado de validação de padrões proibidos;
- indicação de fallback quando houver falha ou rejeição.

Sem trilha completa, a saída de IA é inválida para uso institucional.

## 6. Impacto na arquitetura técnica (consolidação sem código)

1. IA só pode ser chamada após:
   - `processSnapshot` final;
   - documento premium gerado.
2. IA deve ficar isolada em módulo único:
   - `modules/ai-assistive/`
3. IA deve possuir:
   - contrato de entrada controlado;
   - contrato de saída validado;
   - fallback obrigatório para conteúdo original válido.
4. Toda saída de IA deve passar por:
   - validação de preservação de significado;
   - validação de padrões proibidos.
5. Nenhum módulo estrutural (DFD/ETP/TR/PRICING e validadores centrais) pode depender da IA.

## 7. Regra final

Se existir qualquer brecha que permita IA influenciar decisão administrativa, jurídica, estrutural ou matemática, a arquitetura está em desconformidade com o projeto.
