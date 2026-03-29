\# DOSSIÊ TÉCNICO — DECYON / LICITAIA V2



\## 1. Visão geral técnica
O DECYON é estruturado como um sistema distribuído com separação clara entre frontend, backend e banco de dados, mantendo coerência com o modelo SaaS multi-tenant.



A arquitetura foi projetada para garantir:



\- separação de responsabilidades

\- validação consistente de dados

\- rastreabilidade completa das execuções

\- isolamento entre organizações

\- previsibilidade de comportamento



O sistema não depende de lógica implícita ou comportamento oculto. Todas as operações relevantes são estruturadas, validadas e registradas.





\## 2. Estrutura real do repositório
O projeto segue uma organização física padronizada:



\- 01-planejamento → governança, planos e documentação

\- 02-frontend → aplicação web (orquestrador e módulos)

\- 03-backend-api → API principal (validação e persistência)

\- 04-backend-ai → camada assistiva (quando aplicável)

\- 05-banco-de-dados → migrations e seeds

\- 06-documentacao → materiais auxiliares

\- 07-prompts-cursor → prompts estruturados para execução



Essa estrutura garante:



\- separação lógica do sistema

\- organização por responsabilidade

\- facilidade de auditoria



\## 3. Frontend (orquestrador e módulos de domínio)
O frontend não é apenas interface. Ele atua como orquestrador do processo administrativo.



\### 3.1 Orquestrador



Responsável por:



\- conduzir o fluxo DFD → ETP → TR → pricing

\- controlar dependências entre módulos

\- consolidar resultados



\### 3.2 Módulos de domínio



Incluem:



\- DFD

\- ETP

\- TR

\- pricing



Cada módulo:



\- recebe input estruturado

\- executa validações

\- retorna resultado padronizado



\### 3.3 Integração



O frontend integra:



\- motores de validação

\- regras de coerência

\- geração de resultados



Isso garante que a lógica do sistema não dependa exclusivamente do backend.



\## 4. Backend API
O backend atua como camada de segurança, validação e persistência.



\### 4.1 Responsabilidades



\- validar requisições

\- normalizar dados

\- aplicar regras de segurança

\- persistir execuções

\- registrar auditoria



\### 4.2 Endpoint principal



`POST /api/process/run`



Responsável por:



\- receber requisição estruturada

\- validar entrada

\- acionar o motor

\- retornar resultado completo



\### 4.3 Outros endpoints



\- `/api/process/preflight`

\- `/api/process/guidance-options`

\- `/api/process/executions`

\- endpoints de autenticação



\### 4.4 Comportamento



O backend garante:



\- respostas previsíveis

\- códigos HTTP consistentes

\- separação clara entre erro, falha e bloqueio



Ele não toma decisões administrativas. Ele garante integridade e rastreabilidade.



\## 5. Banco de dados, migrations e seed



O banco de dados do DECYON foi projetado para suportar rastreabilidade completa, isolamento multi-tenant e persistência íntegra das execuções.



\### 5.1 Estrutura



O banco armazena:



\- tenants (organizações)

\- usuários

\- execuções de processo

\- audit logs

\- metadados associados



\### 5.2 Migrations



O sistema utiliza migrations versionadas para garantir:



\- evolução controlada do schema

\- reprodutibilidade do ambiente

\- consistência entre ambientes



Cada migration é registrada em tabela própria, permitindo rastrear o estado do banco.



\### 5.3 Seed



O seed permite:



\- criação de tenant de teste

\- criação de usuário inicial

\- execução de cenários controlados



Foi ajustado para compatibilidade com audit logs imutáveis, garantindo que não haja conflito com regras de integridade.



\---



\## 6. Autenticação, autorização e segurança



O sistema implementa controle de acesso estruturado.



\### 6.1 Autenticação



Baseada em:



\- login por credenciais

\- geração de token seguro

\- validação de sessão



\### 6.2 Autorização



Controlada por RBAC:



\- diferentes níveis de usuário

\- permissões específicas por função



\### 6.3 Segurança



Inclui:



\- validação de entrada no backend

\- proteção contra acesso indevido

\- separação entre autenticação e autorização



A segurança é tratada como requisito estrutural, não como camada adicional.



\---



\## 7. Multi-tenant e isolamento de dados (RLS)



O sistema implementa multi-tenant com isolamento rigoroso.



\### 7.1 Isolamento lógico



Cada tenant possui:



\- dados próprios

\- execuções próprias

\- usuários próprios



\### 7.2 Row-Level Security (RLS)



O banco aplica políticas que garantem:



\- acesso apenas a registros do tenant correto

\- impossibilidade de acesso cruzado



\### 7.3 Garantias



Mesmo em consultas diretas, o sistema:



\- mantém isolamento

\- impede vazamento de dados



Esse modelo é essencial para uso institucional em múltiplas organizações.



\---



\## 8. Execução de processos e persistência



Cada execução do sistema é tratada como evento persistido.



\### 8.1 Process executions



Cada execução registra:



\- payload de entrada

\- resposta do sistema

\- status final

\- timestamp

\- identificadores



\### 8.2 Status possíveis



\- SUCCESS

\- HALTED\_BY\_VALIDATION

\- HALTED\_BY\_DEPENDENCY

\- FAILURE



\### 8.3 Persistência



Os dados são armazenados integralmente, sem transformação destrutiva, permitindo:



\- auditoria posterior

\- análise de comportamento

\- reconstrução do processo



\---



\## 9. Audit logs e rastreabilidade



O sistema registra eventos relevantes em audit logs estruturados.



\### 9.1 Conteúdo dos logs



Incluem:



\- tipo de evento

\- recurso afetado

\- identificadores (requestId, correlationId)

\- usuário

\- tenant

\- metadados



\### 9.2 Integração com execuções



Cada log pode ser correlacionado com:



\- process execution

\- contexto da operação

\- resultado final



\### 9.3 Reconstrução completa



A partir do banco, é possível reconstruir:



\- execução completa

\- sequência de eventos

\- decisões tomadas

\- validações aplicadas



Essa capacidade é fundamental para auditoria e defesa administrativa.

\## 10. Contratos públicos e superfícies da API



O backend do DECYON expõe superfícies controladas por meio de contratos públicos bem definidos.



\### 10.1 Princípios dos contratos



Os contratos seguem princípios de:



\- previsibilidade

\- validação obrigatória

\- padronização de respostas

\- separação clara de estados



\### 10.2 Estrutura de entrada



As requisições são validadas por:



\- DTOs (Data Transfer Objects)

\- validadores explícitos

\- normalizadores de entrada



O sistema não aceita entrada implícita ou ambígua.



Campos sensíveis como:



\- tenantId

\- userId

\- correlationId



não são aceitos via body e são tratados na borda da aplicação, garantindo integridade da correlação.



\### 10.3 Estrutura de saída



As respostas seguem padrão consistente:



\- status do processo

\- resultado estruturado

\- validações aplicadas

\- eventos gerados

\- metadata



Estados principais:



\- success

\- halted

\- failure



E seus equivalentes consolidados:



\- SUCCESS

\- HALTED\_BY\_VALIDATION

\- HALTED\_BY\_DEPENDENCY

\- FAILURE



\### 10.4 Superfícies principais



\- POST /api/process/run

\- POST /api/process/preflight

\- GET /api/process/guidance-options

\- GET /api/process/executions



Essas superfícies formam a interface pública do sistema.



\---



\## 11. Provas técnicas e scripts de validação



O sistema foi validado por meio de provas técnicas estruturadas, executadas diretamente no código.



\### 11.1 Natureza das provas



As provas são:



\- reexecutáveis

\- determinísticas

\- baseadas em execução real

\- integradas ao sistema



\### 11.2 Principais provas



Incluem:



\- validação de fluxo (FI2)

\- autenticação e RBAC (FI3)

\- rastreabilidade completa (FI4)

\- contratos e superfícies (FI5)

\- readiness técnico completo (FI6)

\- demonstração controlada (FI7)

\- auditoria final de prontidão (FI8)



\### 11.3 Características



As provas:



\- utilizam chamadas HTTP reais

\- validam persistência no banco

\- verificam correlação entre camadas

\- garantem ausência de regressão



\### 11.4 Execução



São executadas via scripts, por exemplo:



\- npx ts-node src/proof/...

\- npm run proof:h-fi6

\- npm run proof:h-fi7



Essas provas garantem que o sistema funciona além da teoria.



\---



\## 12. Readiness técnico consolidado



O sistema atingiu um nível de readiness técnico elevado, validado por execução real.



\### 12.1 Integração completa



O sistema opera com:



\- frontend funcional

\- backend validado

\- banco consistente

\- multi-tenant ativo

\- rastreabilidade completa



\### 12.2 Execução real



As provas demonstram:



\- fluxo completo executável

\- persistência de dados

\- coerência entre camadas

\- comportamento previsível



\### 12.3 Estabilidade



O sistema apresenta:



\- ausência de erros críticos em fluxo validado

\- comportamento consistente

\- capacidade de reprodução de cenários



\### 12.4 Resultado



O sistema não está apenas implementado.  

Ele está \*\*tecnicamente validado em ambiente real controlado\*\*.



\---



\## 13. Limitações técnicas atuais



Apesar da robustez, existem limitações que devem ser reconhecidas.



\### 13.1 Ambiente controlado



O sistema depende de:



\- ambiente corretamente configurado

\- banco ativo

\- sequência correta de execução



\### 13.2 Ausência de escala validada



Ainda não foi testado em:



\- múltiplos tenants simultâneos em produção real

\- alta concorrência

\- carga massiva



\### 13.3 Dependência de protocolo



A execução correta depende de:



\- seguir o protocolo de demonstração

\- não violar fluxo estruturado



\### 13.4 Evolução futura



Possíveis evoluções incluem:



\- testes de carga

\- monitoramento avançado

\- observabilidade ampliada



Essas limitações não invalidam o sistema, mas delimitam seu estado atual.

