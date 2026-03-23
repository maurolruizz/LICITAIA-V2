# PADRÃO OFICIAL DE VERSIONAMENTO GIT — DECYON / LICITAIA V2

## 1. Função normativa

Este artefato estabelece o padrão obrigatório de versionamento Git do projeto, com aplicação imediata e sem ambiguidade operacional.

## 2. Princípios obrigatórios

- toda etapa/fase concluída deve ser rastreável em Git;
- não é permitido encerrar etapa sem evidência de commit;
- marcos aprovados devem possuir tag oficial;
- não é permitido reescrever histórico para mascarar lacuna.

## 3. Regra de commit obrigatório por etapa/fase

Antes de declarar etapa/fase como concluída:

1. executar checklist técnico e normativo;
2. garantir `git status` limpo para arquivos fora do escopo;
3. registrar commit de encerramento com evidência explícita;
4. registrar referência do commit no artefato de fechamento.

Sem commit de encerramento, a etapa/fase não é válida para 10/10.

## 4. Formato oficial de mensagem de commit

Formato obrigatório:

`[ETAPA|FASE]-[ID] | [TIPO] | [ESCOPO] | [RESULTADO]`

Exemplos:

- `ETAPA-A | FECHAMENTO | CORE-COMPLIANCE | regressao-zero-validada`
- `FASE-41 | ENCERRAMENTO | HISTORICO-OPERACIONAL | 10-10`
- `GOVERNANCA-GIT | REGULARIZACAO | BASELINE | historico-auditado`

## 5. Regra oficial de tag por marco aprovado

- todo marco aprovado institucionalmente deve receber tag anotada;
- padrão de tag: `marco/<etapa-ou-fase>/<identificador>`;
- exemplos: `marco/etapa-a/fechamento`, `marco/fase-41/encerramento`;
- tag deve apontar para commit específico e auditável.

## 6. Regra de branch

- branch principal oficial: `main`;
- branch de trabalho: `feat/*`, `fix/*`, `chore/*`, `docs/*`, `audit/*`;
- merge para `main` apenas com estado testado e checkpoint normativo aplicado.

Se o repositório estiver em `master`, deve ser regularizado para `main` no primeiro ciclo de manutenção controlada.

## 7. Regra de status limpo antes de encerramento

No encerramento de etapa/fase:

- `git status` sem mudanças pendentes fora do escopo;
- arquivos gerados temporários fora do controle de versão;
- ausência de conflito entre documentação de encerramento e commit final.

## 8. Regra de checkpoint Git obrigatório

Antes do encerramento, responder formalmente:

1. commit de encerramento foi criado?
2. tag de marco foi criada?
3. hash do commit foi registrado no relatório?
4. `git status` final ficou limpo?

Se qualquer resposta for negativa, a etapa não está concluída.

## 9. Regra para lacuna histórica

Quando houver lacuna histórica:

- não reescrever passado;
- registrar a lacuna em artefato de governança;
- indicar evidência objetiva do que existe e do que falta;
- criar commit de regularização do baseline atual com mensagem explícita de regularização;
- criar tags apenas quando houver consistência técnica comprovada.

## 10. Aplicação imediata

Este padrão entra em vigor na data da auditoria de regularização Git e é obrigatório para todas as etapas/fases a partir deste ponto.
