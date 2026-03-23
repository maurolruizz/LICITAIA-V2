# NORMA OFICIAL — ETAPA D — IA ASSISTIVA CONTROLADA (FASE INTERNA 1)

## 1. Função normativa

Este artefato consolida, de forma oficial e executável, a governança da ETAPA D (Frente 5), em estrita subordinação ao Plano Mestre, à Matriz de Fechamento e ao Princípio de Supremacia do Motor sobre a IA.

Seu objetivo é impedir qualquer brecha de decisão fora do motor e permitir atuação exclusivamente assistiva de refinamento textual controlado.

## 2. Prevalência normativa

Ordem de prevalência obrigatória:

1. `01-planejamento/PLANO-MESTRE-DECYON-V2.md`
2. `01-planejamento/governanca/PRINCIPIO-DE-SUPREMACIA-DO-MOTOR.md`
3. `01-planejamento/governanca/MATRIZ-DE-FECHAMENTO-DECYON-V2.md`
4. Este artefato (`NORMA-OFICIAL-ETAPA-D-IA-ASSISTIVA-CONTROLADA.md`)
5. Demais artefatos de governança e relatórios

Em conflito, prevalece o motor e o `processSnapshot` final.

## 3. Papel exato da IA assistiva

### 3.1 Permitido

- reescrita de conteúdo já validado;
- padronização terminológica e estilística;
- formalização textual institucional;
- melhoria de clareza, coesão e legibilidade sem alteração semântica.

### 3.2 Proibido

- decisão jurídica, estrutural, matemática ou de fluxo;
- criação de conteúdo novo sem lastro estrutural;
- inferência normativa nova;
- alteração de sentido técnico/jurídico/administrativo;
- correção de erro estrutural/de compliance do motor;
- supressão, reclassificação ou mascaramento de `halt`, validações e coerência.

## 4. Ponto exato no fluxo (gate de entrada da ETAPA D)

A IA só pode ser acionada quando, cumulativamente:

1. ETAPA A concluída em 10/10;
2. ETAPA B concluída em 10/10;
3. ETAPA C concluída em 10/10;
4. `processSnapshot` final da execução disponível e fechado;
5. documento premium finalizado e validado.

Sem qualquer um dos itens acima, a chamada da IA é bloqueada e o fluxo segue com o conteúdo premium original válido.

## 5. Contrato formal de input

### 5.1 Campos obrigatórios

- `processSnapshotId` (imutável, rastreável);
- `documentId` (documento premium validado);
- `documentType` (`DFD`, `ETP` ou `TR`);
- `sections[]` contendo por seção:
  - `blockId` de origem estrutural;
  - `sourceOfTruth`;
  - `coherenceState` de origem;
  - `originalText` validado;
- `transformProfileVersion`;
- `aiModelVersion`;
- `promptVersion`.

### 5.2 Restrições de input

- proibido payload bruto de usuário como fonte autônoma;
- proibido dado externo não validado pelo motor;
- proibido bloco/seção sem origem estrutural;
- proibido input de execução parcial (sem snapshot final).

## 6. Contrato formal de output

### 6.1 Formato obrigatório

Saída estruturada por seção, preservando o mesmo conjunto de seções de entrada, com:

- `blockId`;
- `refinedText`;
- `semanticPreservationStatus`;
- `prohibitedContentCheckStatus`;
- `accepted` (true/false);
- `fallbackApplied` (true/false);
- `fallbackReason` (quando aplicável).

### 6.2 Limites obrigatórios

- não criar seção nova;
- não remover seção existente;
- não alterar `coherenceState` de origem;
- não alterar classificação, estratégia, base legal, cálculo, requisitos e estados de compliance.

### 6.3 Critérios de aceitação

A saída só é válida quando todos os validadores obrigatórios retornarem conformidade:

- preservação de significado;
- ausência de conteúdo proibido;
- preservação de estrutura e coerência;
- rastreabilidade completa da transformação.

## 7. Política de determinismo

- modelo de IA fixo por versão normativa;
- parâmetros fixos (temperatura controlada e congelada por baseline);
- prompt interno versionado e controlado;
- ausência de customização por cliente/tenant;
- mesma entrada deve produzir resultado dentro do envelope determinístico aprovado.

Qualquer alteração de modelo, parâmetro ou prompt exige atualização normativa formal antes de uso.

## 8. Protocolo de validação pós-IA

Validações obrigatórias por execução:

1. validação de preservação semântica por seção;
2. validação de conteúdo proibido;
3. validação de preservação estrutural (blocos, estados e vínculos);
4. validação de invariantes de coerência interdocumental.

Se qualquer validação falhar, a saída da IA é rejeitada para uso institucional.

## 9. Protocolo de fallback obrigatório

Em qualquer falha operacional, falha de validação ou conflito com o motor:

- descartar saída da IA;
- retornar conteúdo premium original válido derivado do motor;
- registrar evento de fallback com causa e evidência.

Sem fallback executável e auditável, a ETAPA D está em desconformidade.

## 10. Matriz de riscos e controles

| Risco | Causa | Impacto | Controle obrigatório |
|---|---|---|---|
| Alteração de sentido | Reescrita sem guarda semântica | Desvio jurídico/técnico | Validação semântica + rejeição + fallback |
| Mascaramento de erro estrutural | Texto encobre incoerência | Perda de auditabilidade | Proibição normativa + preservação de estado de coerência |
| Conteúdo novo sem lastro | Prompt aberto / input inadequado | Contaminação decisória | Contrato fechado + detector de novidade proibida |
| Variação entre clientes | Customização por tenant | Insegurança jurídica | Modelo/prompt/parâmetros únicos e fixos |
| Linguagem inadequada | Falha de padrão institucional | Risco em auditoria externa | Regras de redação controlada + validação de estilo |

## 11. Requisitos de auditoria e trilha evidencial

Cada execução assistiva deve registrar, no mínimo:

- `processSnapshotId` de origem;
- `documentId` de entrada;
- versão de modelo e prompt;
- resultado de cada validação obrigatória;
- decisão de aceite/rejeição;
- ocorrência de fallback e motivo.

Sem trilha completa, a saída da IA é inválida institucionalmente.

## 12. Fronteiras com ETAPAS A, B, C e D

- ETAPA A/B (motor): decisão jurídica/estrutural/matemática, travas, halts, coerência.
- ETAPA C (premium): apresentação institucional premium subordinada ao determinismo da ETAPA B.
- ETAPA D (esta norma): transformação textual assistiva controlada, sem poder decisório.

A ETAPA D não reabre decisões das ETAPAS A, B ou C.

## 13. Regra final de conformidade

Se existir qualquer possibilidade de a IA:

- influenciar decisão,
- mascarar erro estrutural,
- alterar lógica do motor,
- gerar conteúdo fora do lastro validado,

a ETAPA D está incorreta e não pode avançar.
