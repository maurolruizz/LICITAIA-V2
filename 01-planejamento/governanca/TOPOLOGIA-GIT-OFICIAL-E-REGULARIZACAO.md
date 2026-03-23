# TOPOLOGIA GIT OFICIAL — REGULARIZAÇÃO DEFINITIVA

## 1. Função normativa

Definir de forma única e imutável a topologia Git oficial do projeto e registrar a regularização executada com evidência.

## 2. Problema real identificado

No Git ativo da raiz, os caminhos abaixo estavam versionados como gitlinks (`mode 160000`), sem `.gitmodules`:

- `02-frontend/licitaia-v2-demo`
- `02-frontend/licitaia-v2-web`
- `03-backend-api/licitaia-v2-api`
- `04-backend-ai/licitaia-v2-ai-core`

Evidência objetiva:

- `git ls-tree HEAD ...` retornando `160000 commit ...` para os caminhos;
- `git submodule status` falhando por ausência de mapeamento em `.gitmodules`.

## 3. Solução única escolhida

**Monorepo único com absorção dos repositórios aninhados.**

A regularização executada foi:

1. remoção dos gitlinks do índice da raiz;
2. absorção do conteúdo real dos diretórios no repositório raiz;
3. isolamento dos metadados Git internos fora do índice (`.git-backup-subrepo/`);
4. inclusão de regra de ignore para backups internos.

## 4. Justificativa técnica da solução

- elimina estado híbrido (gitlink sem submódulo formal);
- mantém rastreabilidade centralizada em um único histórico oficial;
- reduz risco operacional de commits incompletos entre camadas;
- alinha com governança central do Plano Mestre e checkpoint Git obrigatório.

## 5. Efeito em commits, tags e rastreabilidade futura

- todos os artefatos passam a ser rastreados no Git oficial da raiz;
- tags oficiais de marcos passam a referenciar commits únicos do monorepo;
- fechamento de etapa/fase passa a depender de evidência única de commit/tag.

## 6. Prova de estado final da topologia

Após regularização:

- os caminhos críticos deixaram de ser gitlink no índice;
- o conteúdo foi absorvido como arquivos comuns (`mode 100644` e correlatos);
- não há submódulos ativos;
- `.gitmodules` permanece inexistente por opção técnica oficial.

## 7. Regra final

Fica proibido reintroduzir gitlinks/subrepos sem decisão normativa explícita em governança, com atualização prévia do padrão oficial de versionamento Git.
