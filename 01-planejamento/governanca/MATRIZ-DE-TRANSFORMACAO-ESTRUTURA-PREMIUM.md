# MATRIZ DE TRANSFORMAÇÃO — ESTRUTURA -> CAMADA PREMIUM (ETAPA C)

## 1. Função normativa

Define a transformação oficial e obrigatória entre blocos estruturais da ETAPA B e blocos premium da ETAPA C.

## 2. Regra central

- transformação 1:1 obrigatória por bloco;
- a camada premium pode alterar forma, nunca semântica;
- `required`, `prohibited` e `not_applicable` devem ser preservados;
- não existe bloco premium sem bloco estrutural de origem.

## 3. Tabela de transformação oficial

| Documento | Bloco estrutural | Bloco premium | Estado de transformação |
|---|---|---|---|
| DFD | DFD_IDENTIFICACAO_PROCESSUAL | Seção premium de identificação | Obrigatória |
| DFD | DFD_DEMANDA_FORMALIZADA | Seção premium de demanda | Obrigatória |
| DFD | DFD_ENQUADRAMENTO_ESTRUTURAL | Seção premium de estrutura | Obrigatória |
| DFD | DFD_MEMORIA_CALCULO_REFERENCIAL | Seção premium de cálculo | Condicional/proibida conforme regra |
| DFD | DFD_JUSTIFICATIVA_CONTRATACAO | Seção premium de justificativa | Obrigatória |
| DFD | DFD_ESTRATEGIA_CONTRATACAO | Seção premium de estratégia | Obrigatória |
| DFD | DFD_COERENCIA_RASTREAVEL | Seção premium de coerência | Obrigatória |
| ETP | ETP_IDENTIFICACAO_ESTUDO | Seção premium de identificação | Obrigatória |
| ETP | ETP_NECESSIDADE_E_RESULTADOS | Seção premium de necessidade/resultados | Obrigatória |
| ETP | ETP_ENQUADRAMENTO_ESTRUTURAL | Seção premium de estrutura | Obrigatória |
| ETP | ETP_MEMORIA_CALCULO | Seção premium de cálculo | Condicional/proibida conforme regra |
| ETP | ETP_SOLUCAO_E_JUSTIFICATIVA_TECNICA | Seção premium de solução/justificativa | Obrigatória |
| ETP | ETP_ESTRATEGIA_CONTRATACAO | Seção premium de estratégia | Obrigatória |
| ETP | ETP_COERENCIA_RASTREAVEL | Seção premium de coerência | Obrigatória |
| TR | TR_IDENTIFICACAO_TERMO | Seção premium de identificação | Obrigatória |
| TR | TR_OBJETO_E_FINALIDADE | Seção premium de objeto/finalidade | Obrigatória |
| TR | TR_ENQUADRAMENTO_ESTRUTURAL | Seção premium de estrutura | Obrigatória |
| TR | TR_ESTIMATIVA_E_MEMORIA_CALCULO | Seção premium de estimativa/cálculo | Condicional/proibida conforme regra |
| TR | TR_REQUISITOS_E_EXECUCAO | Seção premium de requisitos/execução | Obrigatória |
| TR | TR_ESTRATEGIA_CONTRATACAO | Seção premium de estratégia | Obrigatória |
| TR | TR_COERENCIA_RASTREAVEL | Seção premium de coerência | Obrigatória |

## 4. Regras de integridade da transformação

- Toda seção premium deve declarar origem estrutural.
- Toda seção premium deve preservar coerência interdocumental aplicável.
- Seção proibida estruturalmente permanece não preenchível na camada premium.
