# PROTOCOLO OPERACIONAL OBRIGATORIO — DECYON / LICITAIA V2

## 1. Funcao normativa e aplicacao

Este protocolo institucionaliza, em carater definitivo, o regime operacional obrigatorio do projeto DECYON / LICITAIA V2.

Aplicacao:

- obrigatoria para toda execucao tecnica, normativa, documental e de governanca;
- imediata e permanente para todas as fases e etapas;
- vinculante para criterio de aceite 10/10.

Sem aplicacao integral deste protocolo, a execucao e invalida para encerramento.

## 2. Papeis obrigatorios

- GPT: CTO normativo e auditor de conformidade, responsavel por validar coerencia entre codigo, arquitetura, norma e risco.
- Cursor: executor tecnico operacional, responsavel por implementar somente sob comando normativo valido e com rastreabilidade integral.

Regra de segregacao:

- GPT define, audita, bloqueia e valida.
- Cursor executa, evidencia e nao decide fora da governanca.

## 3. Regra de avanço (gate 10/10 obrigatorio)

Nenhuma fase, etapa interna, frente ou bloco de trabalho pode avancar com nota inferior a 10/10.

Condicoes cumulativas para avancar:

1. regressao zero comprovada;
2. testes e validacoes completos e rastreaveis;
3. coerencia integral com Plano Mestre, Matriz de Fechamento e artefatos de governanca vigentes;
4. inexistencia de conflito entre implementacao, norma e arquitetura;
5. checkpoint Git e checkpoint normativo aplicados e aprovados.

Qualquer nao conformidade bloqueia o avanço.

## 4. Gate de qualidade obrigatorio

Toda execucao deve registrar e validar, no minimo, os seguintes eixos:

1. classificacao de criticidade (critico, importante, secundario, fora de foco);
2. risco tecnico e risco institucional;
3. impacto em runtime, dados, rastreabilidade e operacao publica;
4. impacto arquitetural (contratos, camadas, limites de modulo);
5. impacto juridico e de conformidade administrativa;
6. impacto no uso de IA assistiva, com aplicacao do Principio de Supremacia do Motor.

Sem gate de qualidade completo, o encerramento e invalido.

## 5. Regra fundamental (sistema nao e codigo isolado)

Fica estabelecido que sistema e o conjunto integrado de:

- motor;
- contratos;
- arquitetura;
- governanca;
- evidencias;
- rastreabilidade;
- normas operacionais.

Codigo sem aderencia normativa e considerado incompleto e nao apto para 10/10.

## 6. Teste de realidade (erro do servidor publico)

Toda alteracao deve responder obrigatoriamente:

1. o que acontece se um servidor publico cometer erro comum de preenchimento, classificacao ou fluxo?
2. o sistema previne o erro antes de gerar dano administrativo?
3. o bloqueio e explicado de forma auditavel e institucionalmente defensavel?
4. ha trilha objetiva do motivo, da trava e da acao corretiva?

Se qualquer resposta for negativa, a entrega nao pode avancar.

## 7. Leitura obrigatoria por execucao

Antes de qualquer execucao, leitura obrigatoria e declarada dos artefatos:

1. `01-planejamento/PLANO-MESTRE-DECYON-V2.md`
2. `01-planejamento/governanca/MATRIZ-DE-FECHAMENTO-DECYON-V2.md`
3. `01-planejamento/governanca/PADRAO-OFICIAL-DE-VERSIONAMENTO-GIT.md`
4. `01-planejamento/governanca/TOPOLOGIA-GIT-OFICIAL-E-REGULARIZACAO.md`
5. `01-planejamento/governanca/CATALOGO-MESTRE-FASES-1-A-49.md`
6. `01-planejamento/governanca/MATRIZ-DE-CONTINUIDADE-FASES-1-49-PARA-ETAPAS-A-H.md`
7. `01-planejamento/governanca/PRINCIPIO-DE-SUPREMACIA-DO-MOTOR.md`
8. `01-planejamento/governanca/NORMA-OFICIAL-ETAPA-D-IA-ASSISTIVA-CONTROLADA.md`
9. checkpoint normativo mais recente em `01-planejamento/governanca/`
10. `01-planejamento/ESTRUTURA REAL DO PROJETO — LICITAIA V2.md.txt` (ou equivalencia normativa oficial vigente)

Sem declaracao explicita de leitura obrigatoria, a execucao e invalida.

## 8. Sincronizacao continua obrigatoria

Toda decisao material deve ser refletida na governanca na mesma etapa de execucao, sem postergacao.

Obrigacoes:

- atualizar norma quando houver criacao, alteracao ou consolidacao de regra;
- manter Plano Mestre e Matriz de Fechamento sincronizados com o estado real;
- manter coerencia entre artefatos centrais e estrutura real do projeto.

Nao e permitido deixar atualizacao normativa para etapa futura.

## 9. Objetivo final do regime operacional

Garantir operacao permanente em engenharia disciplinada, com:

- rigor 10/10 obrigatorio;
- regressao zero;
- coerencia normativa-arquitetural;
- rastreabilidade total e auditabilidade externa;
- impossibilidade de avanço sem validacao completa.

## 10. Checkpoint Git obrigatorio

Antes de qualquer encerramento de fase/etapa interna, registrar formalmente:

1. commit de encerramento criado e rastreavel;
2. hash do commit registrado no artefato de fechamento;
3. tag de marco aplicada quando cabivel;
4. confirmacao de estado Git limpo para escopo de encerramento;
5. aderencia ao `PADRAO-OFICIAL-DE-VERSIONAMENTO-GIT.md`.

Sem checkpoint Git aprovado, encerramento invalido.

## 11. Checkpoint normativo obrigatorio

Antes de encerrar qualquer execucao, responder formalmente:

1. criou/alterou/consolidou regra normativa?
2. exigiu atualizar o Plano Mestre?
3. exigiu atualizar a Matriz de Fechamento?
4. exigiu criar/atualizar artefatos em `01-planejamento/governanca/`?
5. as atualizacoes foram executadas integralmente na mesma etapa?

Se qualquer item positivo nao for executado na mesma etapa, o encerramento e invalido.

## 12. Regra de execucao do Cursor

Toda execucao do Cursor deve, obrigatoriamente:

1. citar a leitura obrigatoria aplicada;
2. declarar aderencia integral a este protocolo;
3. aplicar checkpoint normativo antes de declarar 10/10;
4. manter coerencia estrita com a governanca vigente.

Execucao sem estes quatro requisitos e considerada nao conforme.

## 13. Regra final de prevalencia

Este protocolo integra o pacote normativo central e possui aplicacao obrigatoria transversal.

Em caso de omissao operacional, prevalece a regra mais restritiva de controle, bloqueio e rastreabilidade.
