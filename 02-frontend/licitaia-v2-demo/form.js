/**
 * FASE 40 — Formulário controlado de processo.
 *
 * Substitui os fixtures fixos por seleções estruturadas.
 * O usuário escolhe em dropdowns — zero texto livre em campos críticos.
 * A lógica monta um payload completo e válido com base nos templates pré-definidos.
 *
 * Sem lógica do motor. Sem interpretação de regras. Apenas monta e envia.
 */

'use strict';

/* --------------------------------------------------------------------------
 * Templates de objeto por categoria
 * -------------------------------------------------------------------------- */

var OBJECT_TEMPLATES = {
  MATERIAL_CONSUMO: {
    label: 'Material de Consumo',
    demandDescription: 'Aquisição de material de consumo para uso nas atividades administrativas do órgão.',
    needDescription: 'Necessidade de reposição de materiais de consumo para manutenção das operações internas.',
    solutionSummary: 'Aquisição de materiais de consumo conforme especificações técnicas definidas.',
    objectDescription: 'Aquisição de materiais de consumo para uso administrativo e operacional.',
    contractingPurpose: 'Garantir disponibilidade de materiais de consumo para as atividades do órgão.',
    technicalRequirements: 'Materiais de consumo com especificações técnicas mínimas definidas, com garantia de qualidade.',
    executionConditions: 'Entrega única em até 15 dias úteis após emissão da ordem de fornecimento.',
    acceptanceCriteria: 'Conformidade com as especificações técnicas e laudo de recebimento definitivo.',
    pricingSourceDescription: 'Pesquisa de preços junto a três fornecedores do mercado.',
    referenceItemsDescription: 'Materiais de consumo conforme descritivo do objeto.',
    pricingJustification: 'Valor apurado mediante pesquisa de mercado em três fornecedores distintos.',
  },
  BEM_PERMANENTE: {
    label: 'Bem Permanente',
    demandDescription: 'Aquisição de bem permanente para incorporação ao patrimônio do órgão.',
    needDescription: 'Necessidade de aquisição de bem permanente para modernização e melhoria da capacidade operacional.',
    solutionSummary: 'Aquisição de bem permanente com especificações técnicas definidas e garantia.',
    objectDescription: 'Aquisição de bem permanente para uso nas atividades finalísticas do órgão.',
    contractingPurpose: 'Incorporar ao patrimônio público bem permanente necessário às atividades do órgão.',
    technicalRequirements: 'Bem permanente com especificações técnicas mínimas, garantia de fábrica de 12 meses.',
    executionConditions: 'Entrega e instalação em até 30 dias úteis após emissão da ordem de fornecimento.',
    acceptanceCriteria: 'Conformidade com as especificações técnicas, funcionamento pleno e laudo de recebimento.',
    pricingSourceDescription: 'Pesquisa de preços junto a três fornecedores especializados.',
    referenceItemsDescription: 'Bem permanente conforme descritivo técnico do objeto.',
    pricingJustification: 'Valor de referência apurado em pesquisa de mercado com três fornecedores.',
  },
  SERVICO_TECNICO: {
    label: 'Serviço Técnico Especializado',
    demandDescription: 'Contratação de serviço técnico especializado para atendimento de necessidade específica do órgão.',
    needDescription: 'Necessidade de conhecimento técnico especializado não disponível no quadro funcional do órgão.',
    solutionSummary: 'Contratação de empresa especializada com comprovada capacidade técnica para execução do serviço.',
    objectDescription: 'Prestação de serviço técnico especializado conforme Termo de Referência.',
    contractingPurpose: 'Obter resultado técnico especializado necessário às atividades do órgão.',
    technicalRequirements: 'Empresa com acervo técnico e qualificação profissional comprovada na área.',
    executionConditions: 'Execução por etapas, conforme cronograma definido no Termo de Referência.',
    acceptanceCriteria: 'Entrega de relatório técnico conclusivo, aprovado pela equipe técnica do órgão.',
    pricingSourceDescription: 'Pesquisa de preços junto a três empresas especializadas na área.',
    referenceItemsDescription: 'Serviço técnico especializado conforme escopo definido no Termo de Referência.',
    pricingJustification: 'Valor apurado em pesquisa de mercado junto a empresas especializadas.',
  },
  SERVICO_CONTINUO: {
    label: 'Serviço Contínuo',
    demandDescription: 'Contratação de serviço de natureza continuada para manutenção das atividades do órgão.',
    needDescription: 'Necessidade de prestação contínua de serviço essencial para o funcionamento regular do órgão.',
    solutionSummary: 'Contratação de empresa especializada para prestação de serviço contínuo durante a vigência contratual.',
    objectDescription: 'Prestação de serviço de natureza continuada conforme Termo de Referência.',
    contractingPurpose: 'Garantir continuidade das atividades do órgão por meio de serviço prestado de forma regular.',
    technicalRequirements: 'Empresa com capacidade operacional comprovada para prestação do serviço em regime contínuo.',
    executionConditions: 'Execução contínua durante 12 meses, com possibilidade de renovação nos termos da Lei 14.133/2021.',
    acceptanceCriteria: 'Medições mensais de desempenho e conformidade com os níveis de serviço estabelecidos.',
    pricingSourceDescription: 'Pesquisa de preços junto a três empresas prestadoras de serviços similares.',
    referenceItemsDescription: 'Serviço de natureza continuada conforme escopo definido no Termo de Referência.',
    pricingJustification: 'Valor mensal e total apurado em pesquisa de mercado com empresas do setor.',
  },
};

/* --------------------------------------------------------------------------
 * Configuração de modalidade de contratação
 * -------------------------------------------------------------------------- */

var MODALITY_CONFIG = {
  PREGAO: {
    label: 'Pregão (Licitação Aberta)',
    competitionStrategy: 'OPEN_COMPETITION',
    divisionStrategy: 'SINGLE_CONTRACT',
    contractingJustification: 'Licitação na modalidade Pregão Eletrônico, visando ampla competição e seleção da proposta mais vantajosa para a Administração, nos termos da Lei 14.133/2021.',
    legalBasis: null,
  },
  INEXIGIBILIDADE: {
    label: 'Inexigibilidade (Lei 14.133/2021)',
    competitionStrategy: 'DIRECT_SELECTION',
    divisionStrategy: 'SINGLE_CONTRACT',
    contractingJustification: 'Contratação por inexigibilidade de licitação em razão da notória especialização da empresa e singularidade do objeto, conforme art. 74 da Lei 14.133/2021.',
    legalBasis: 'art. 74, inc. III, da Lei 14.133/2021 — inexigibilidade por notória especialização.',
  },
  DISPENSA: {
    label: 'Dispensa (Art. 75 — Lei 14.133/2021)',
    competitionStrategy: 'DIRECT_SELECTION',
    divisionStrategy: 'SINGLE_CONTRACT',
    contractingJustification: 'Contratação por dispensa de licitação nos termos do art. 75 da Lei 14.133/2021, em razão do valor ou das circunstâncias específicas do objeto.',
    legalBasis: 'art. 75 da Lei 14.133/2021 — dispensa de licitação.',
  },
};

/* --------------------------------------------------------------------------
 * Templates de justificativa administrativa por categoria
 * -------------------------------------------------------------------------- */

var JUSTIFICATION_TEMPLATES = {
  MATERIAL_CONSUMO: {
    problemStatement: 'Esgotamento ou insuficiência de estoque de materiais de consumo essenciais às atividades do órgão.',
    administrativeNeed: 'Reposição de materiais de consumo para garantir continuidade das atividades administrativas e operacionais.',
    expectedOutcome: 'Disponibilidade de materiais suficientes para suporte às atividades do órgão durante o exercício.',
  },
  BEM_PERMANENTE: {
    problemStatement: 'Necessidade de modernização ou expansão do parque de bens permanentes do órgão.',
    administrativeNeed: 'Aquisição de bem permanente para ampliar ou modernizar a capacidade operacional e tecnológica do órgão.',
    expectedOutcome: 'Incremento da capacidade operacional com bem de qualidade incorporado ao patrimônio público.',
  },
  SERVICO_TECNICO: {
    problemStatement: 'Necessidade de conhecimento técnico especializado não disponível no quadro de servidores do órgão.',
    administrativeNeed: 'Contratação de empresa especializada para execução de diagnóstico, análise ou desenvolvimento técnico específico.',
    expectedOutcome: 'Produto técnico entregue com qualidade comprovada, rastreabilidade e conformidade com os requisitos definidos.',
  },
  SERVICO_CONTINUO: {
    problemStatement: 'Necessidade de garantia de funcionamento regular de serviço essencial ao órgão.',
    administrativeNeed: 'Manutenção de serviço contínuo durante a vigência contratual, com níveis de desempenho definidos.',
    expectedOutcome: 'Continuidade das atividades do órgão com qualidade de serviço monitorada e auditável.',
  },
};

/* --------------------------------------------------------------------------
 * Templates de departamento
 * -------------------------------------------------------------------------- */

var DEPARTMENTS = [
  'Diretoria de Tecnologia da Informação',
  'Diretoria de Administração e Finanças',
  'Secretaria de Planejamento e Orçamento',
  'Secretaria de Saúde',
  'Secretaria de Educação',
  'Secretaria de Obras e Infraestrutura',
  'Gabinete do Gestor',
];

/* --------------------------------------------------------------------------
 * Gerador de processId
 * -------------------------------------------------------------------------- */

function generateProcessId() {
  var now = new Date();
  var ymd =
    now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  var seq = String(Math.floor(Math.random() * 900) + 100);
  return 'PROC-' + ymd + '-' + seq;
}

/* --------------------------------------------------------------------------
 * Renderização do formulário
 * -------------------------------------------------------------------------- */

function renderFormSection(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML =
    '<p class="section-title">Formulário Controlado de Processo</p>' +
    '<p class="section-desc">Selecione as opções abaixo. Os campos críticos (justificativas, bases legais, condições de execução) são preenchidos automaticamente a partir dos templates oficiais.</p>' +

    '<div class="form-grid">' +

    // Linha 1: processId + departamento
    '<div class="form-group">' +
      '<label class="form-label" for="f-process-id">Identificador do Processo</label>' +
      '<div style="display:flex;gap:0.5rem">' +
        '<input class="form-input" id="f-process-id" type="text" maxlength="40" style="flex:1" />' +
        '<button type="button" class="btn-secondary" id="btn-new-id" ' +
          'title="Gerar novo ID" aria-label="Gerar novo ID de processo" ' +
          'style="padding:0.5rem 0.625rem;flex-shrink:0">⟳</button>' +
      '</div>' +
    '</div>' +

    '<div class="form-group">' +
      '<label class="form-label" for="f-department">Unidade Requisitante</label>' +
      '<select class="form-select" id="f-department">' +
        DEPARTMENTS.map(function(d) { return '<option value="' + escapeFormAttr(d) + '">' + escapeFormHtml(d) + '</option>'; }).join('') +
      '</select>' +
    '</div>' +

    // Linha 2: categoria + modalidade
    '<div class="form-group">' +
      '<label class="form-label" for="f-object-category">Categoria do Objeto</label>' +
      '<select class="form-select" id="f-object-category">' +
        Object.keys(OBJECT_TEMPLATES).map(function(k) {
          return '<option value="' + k + '">' + OBJECT_TEMPLATES[k].label + '</option>';
        }).join('') +
      '</select>' +
    '</div>' +

    '<div class="form-group">' +
      '<label class="form-label" for="f-modality">Modalidade de Contratação</label>' +
      '<select class="form-select" id="f-modality">' +
        Object.keys(MODALITY_CONFIG).map(function(k) {
          return '<option value="' + k + '">' + MODALITY_CONFIG[k].label + '</option>';
        }).join('') +
      '</select>' +
    '</div>' +

    // Linha 3: valor total + quantidade de itens
    '<div class="form-group">' +
      '<label class="form-label" for="f-total-value">Valor Total Estimado (R$)</label>' +
      '<input class="form-input" id="f-total-value" type="number" min="1" step="0.01" value="50000" />' +
    '</div>' +

    '<div class="form-group">' +
      '<label class="form-label" for="f-item-count">Número de Itens</label>' +
      '<select class="form-select" id="f-item-count">' +
        '<option value="1">1 item (processo único)</option>' +
        '<option value="2">2 itens</option>' +
        '<option value="3">3 itens</option>' +
      '</select>' +
    '</div>' +

    '</div>' + // end form-grid

    '<div class="form-actions">' +
      '<button class="btn-execute" id="btn-form-submit" aria-label="Executar processo com formulário controlado">▶ Executar Processo</button>' +
      '<span class="execute-hint" id="form-hint">Preencha os campos e clique em Executar</span>' +
    '</div>' +

    '<div id="form-result-section" class="result-section" style="display:none;">' +
      '<div id="form-result-header" class="result-header"></div>' +
      '<div id="form-result-body" class="result-body"></div>' +
    '</div>';

  // Preencher processId com valor gerado automaticamente
  var processIdInput = document.getElementById('f-process-id');
  if (processIdInput) processIdInput.value = generateProcessId();

  // Bind do botão de gerar novo ID
  var newIdBtn = document.getElementById('btn-new-id');
  if (newIdBtn) {
    newIdBtn.addEventListener('click', function() {
      var inp = document.getElementById('f-process-id');
      if (inp) inp.value = generateProcessId();
    });
  }

  // Bind do botão de execução
  var submitBtn = document.getElementById('btn-form-submit');
  if (submitBtn) {
    submitBtn.addEventListener('click', function() { executeForm(); });
  }
}

/* --------------------------------------------------------------------------
 * Construção do payload a partir das seleções
 * -------------------------------------------------------------------------- */

function buildPayloadFromForm() {
  var processId = (document.getElementById('f-process-id').value || generateProcessId()).trim();
  var department = document.getElementById('f-department').value;
  var objectCategory = document.getElementById('f-object-category').value;
  var modality = document.getElementById('f-modality').value;
  var totalValue = parseFloat(document.getElementById('f-total-value').value) || 50000;
  var itemCount = parseInt(document.getElementById('f-item-count').value, 10) || 1;

  var objTpl = OBJECT_TEMPLATES[objectCategory];
  var modCfg = MODALITY_CONFIG[modality];
  var justTpl = JUSTIFICATION_TEMPLATES[objectCategory];

  var now = new Date().toISOString();
  var unitValue = Math.round((totalValue / itemCount) * 100) / 100;

  // Estratégia e justificativa administrativa (por processo ou por item)
  var procurementStrategy;
  var administrativeJustification;
  var items;
  var procurementStrategies;
  var administrativeJustifications;

  if (itemCount === 1) {
    // Processo único: strategy e justificativa no nível do processo
    procurementStrategy = {
      targetType: 'process',
      procurementModality: modality,
      competitionStrategy: modCfg.competitionStrategy,
      divisionStrategy: modCfg.divisionStrategy,
      contractingJustification: modCfg.contractingJustification,
    };
    if (modCfg.legalBasis) {
      procurementStrategy.legalBasis = modCfg.legalBasis;
    }

    administrativeJustification = {
      targetType: 'process',
      problemStatement: justTpl.problemStatement,
      administrativeNeed: justTpl.administrativeNeed,
      expectedOutcome: justTpl.expectedOutcome,
    };
    if (modCfg.legalBasis) {
      administrativeJustification.legalBasis = modCfg.legalBasis;
    }
  } else {
    // Múltiplos itens
    items = [];
    procurementStrategies = [];
    administrativeJustifications = [];

    for (var i = 1; i <= itemCount; i++) {
      var itemId = 'item-' + i;
      items.push({
        id: itemId,
        description: objTpl.label + ' — Item ' + i,
        quantity: 1,
        unit: 'un',
      });

      var strategy = {
        targetType: 'item',
        targetId: itemId,
        procurementModality: modality,
        competitionStrategy: modCfg.competitionStrategy,
        divisionStrategy: 'MULTIPLE_ITEMS',
        contractingJustification: modCfg.contractingJustification,
      };
      if (modCfg.legalBasis) strategy.legalBasis = modCfg.legalBasis;
      procurementStrategies.push(strategy);

      var justification = {
        targetType: 'item',
        targetId: itemId,
        problemStatement: justTpl.problemStatement,
        administrativeNeed: justTpl.administrativeNeed,
        expectedOutcome: justTpl.expectedOutcome,
      };
      if (modCfg.legalBasis) justification.legalBasis = modCfg.legalBasis;
      administrativeJustifications.push(justification);
    }
  }

  // Payload completo
  var payload = {
    // DFD
    demandDescription: objTpl.demandDescription,
    hiringJustification: justTpl.administrativeNeed,
    administrativeObjective: justTpl.expectedOutcome,
    requestingDepartment: department,
    requesterName: 'Responsável pelo Planejamento de Contratações',
    requestDate: now,
    // ETP
    needDescription: objTpl.needDescription,
    expectedResults: justTpl.expectedOutcome,
    solutionSummary: objTpl.solutionSummary,
    technicalJustification: objTpl.technicalRequirements,
    analysisDate: now,
    responsibleAnalyst: 'Analista de Planejamento de Contratações',
    // TR
    objectDescription: objTpl.objectDescription,
    contractingPurpose: objTpl.contractingPurpose,
    technicalRequirements: objTpl.technicalRequirements,
    executionConditions: objTpl.executionConditions,
    acceptanceCriteria: objTpl.acceptanceCriteria,
    referenceDate: now,
    responsibleAuthor: 'Responsável pelo Termo de Referência',
    // PRICING
    pricingSourceDescription: objTpl.pricingSourceDescription,
    referenceItemsDescription: objTpl.referenceItemsDescription,
    estimatedUnitValue: unitValue,
    estimatedTotalValue: totalValue,
    pricingJustification: objTpl.pricingJustification,
    requestingDepartmentForPricing: department,
    requestingDepartmentPricingAlias: department.split(' ').slice(-2).join(' '),
  };

  if (itemCount === 1) {
    payload.procurementStrategy = procurementStrategy;
    payload.administrativeJustification = administrativeJustification;
  } else {
    payload.items = items;
    payload.procurementStrategies = procurementStrategies;
    payload.administrativeJustifications = administrativeJustifications;
  }

  return {
    processId: processId,
    phase: 'PLANNING',
    tenantId: 'tenant-operacional',
    userId: 'user-formulario',
    correlationId: 'form-' + Date.now(),
    payload: payload,
  };
}

/* --------------------------------------------------------------------------
 * Execução do formulário
 * -------------------------------------------------------------------------- */

function executeForm() {
  var submitBtn = document.getElementById('btn-form-submit');
  var loadingOverlay = document.getElementById('loading-overlay');
  var formResultSection = document.getElementById('form-result-section');
  var formResultHeader = document.getElementById('form-result-header');
  var formResultBody = document.getElementById('form-result-body');
  var formHint = document.getElementById('form-hint');

  if (!submitBtn) return;

  submitBtn.disabled = true;
  if (loadingOverlay) loadingOverlay.style.display = 'flex';
  if (formResultSection) formResultSection.style.display = 'none';
  if (formHint) formHint.textContent = 'Executando...';

  var request;
  try {
    request = buildPayloadFromForm();
  } catch (e) {
    if (submitBtn) submitBtn.disabled = false;
    if (loadingOverlay) loadingOverlay.style.display = 'none';
    if (formHint) formHint.textContent = 'Erro ao montar payload: ' + String(e);
    return;
  }

  fetch(BACKEND_URL + '/api/process/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
    .then(function(res) {
      var httpStatus = res.status;
      return res.json().then(function(data) {
        return { httpStatus: httpStatus, data: data };
      });
    })
    .then(function(payload) {
      if (formResultSection) formResultSection.style.display = 'block';
      var result = payload.data.result || {};
      var process_ = payload.data.process || {};
      var halted = result.halted !== undefined ? result.halted : Boolean(process_.halted);
      var finalStatus = result.finalStatus || process_.finalStatus || 'UNKNOWN';
      var executedMods = Array.isArray(result.executedModules) ? result.executedModules : [];
      var validations = Array.isArray(payload.data.validations) ? payload.data.validations
        : Array.isArray(result.validations) ? result.validations : [];

      var outcomeClass = halted ? 'halted' : 'success';
      var outcomeLabel = halted ? 'BLOQUEADO' : 'SUCESSO';

      if (formResultHeader) {
        formResultHeader.className = 'result-header ' + outcomeClass;
        formResultHeader.innerHTML =
          '<span class="result-status-pill ' + outcomeClass + '">' + outcomeLabel + '</span>' +
          '<span class="result-header-title">' + escapeHtml(request.processId) + ' — Formulário Controlado</span>';
      }

      if (formResultBody) {
        var codes = validations
          .filter(function(v) { return v && typeof v.code === 'string'; })
          .map(function(v) { return { code: v.code, severity: v.severity || '' }; });

        var modulesHtml = executedMods.length
          ? executedMods.map(function(m) { return '<span class="module-chip">' + escapeHtml(String(m)) + '</span>'; }).join('')
          : '<span style="font-size:0.8125rem;color:var(--gray-400)">não registrado</span>';

        var codesHtml = codes.length
          ? codes.map(function(c) {
              var isBlock = c.severity === 'BLOCK' || c.severity === 'ERROR';
              return '<span class="code-chip' + (isBlock ? ' block' : '') + '">' + escapeHtml(c.code) + '</span>';
            }).join('')
          : '<span style="font-size:0.8125rem;color:var(--gray-400)">nenhum código emitido</span>';

        var haltedValueClass = halted ? 'field-value status-halt' : 'field-value status-success';
        var haltedText = halted ? '⛔ SIM — processo bloqueado' : '✅ NÃO — pipeline concluído';

        formResultBody.innerHTML =
          '<div class="result-field">' +
            '<div class="field-label">Status Final</div>' +
            '<div class="field-value mono">' + escapeHtml(finalStatus) + '</div>' +
          '</div>' +
          '<div class="result-field">' +
            '<div class="field-label">Halt</div>' +
            '<div class="' + haltedValueClass + '">' + haltedText + '</div>' +
          '</div>' +
          '<div class="result-field">' +
            '<div class="field-label">HTTP</div>' +
            '<div class="field-value mono">' + payload.httpStatus + '</div>' +
          '</div>' +
          '<div class="result-field" style="grid-column: span 3">' +
            '<div class="field-label">Módulos Executados</div>' +
            '<div class="modules-wrap">' + modulesHtml + '</div>' +
          '</div>' +
          '<div class="result-field" style="grid-column: 1 / -1">' +
            '<div class="field-label">Códigos de Validação (' + codes.length + ')</div>' +
            '<div class="codes-wrap">' + codesHtml + '</div>' +
          '</div>';
      }

      if (formHint) formHint.textContent = 'Executado: ' + request.processId;
      // Atualiza histórico se visível
      if (typeof refreshHistoryIfVisible === 'function') refreshHistoryIfVisible();
    })
    .catch(function() {
      if (formHint) formHint.textContent = 'Erro de conexão com o backend.';
      if (typeof setStatusOffline === 'function') setStatusOffline();
    })
    .finally(function() {
      if (submitBtn) submitBtn.disabled = false;
      if (loadingOverlay) loadingOverlay.style.display = 'none';
    });
}

/* --------------------------------------------------------------------------
 * Utilitários internos do form
 * -------------------------------------------------------------------------- */

function escapeFormHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeFormAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

/* ==========================================================================
 * ETAPA E — CAMADA DE CONDUCAO OPERACIONAL (FASE INTERNA 1)
 * ========================================================================== */

var GUIDANCE_OPTIONS = {
  legalRegimes: [
    { value: 'LICITACAO', label: 'Licitacao' },
    { value: 'DISPENSA', label: 'Dispensa' },
    { value: 'INEXIGIBILIDADE', label: 'Inexigibilidade' },
  ],
  objectTypes: [
    { value: 'MATERIAL_CONSUMO', label: 'Material de Consumo', durable: false },
    { value: 'BEM_PERMANENTE', label: 'Bem Permanente', durable: true },
    { value: 'SERVICO_CONTINUO', label: 'Servico Continuo', durable: false },
    { value: 'SERVICO_TECNICO_ESPECIALIZADO', label: 'Servico Tecnico Especializado', durable: false },
  ],
  objectStructures: [
    { value: 'ITEM_UNICO', label: 'Item Unico' },
    { value: 'MULTIPLOS_ITENS', label: 'Multiplos Itens' },
    { value: 'LOTE', label: 'Lote' },
  ],
  executionForms: [
    { value: 'ENTREGA_UNICA', label: 'Entrega Unica' },
    { value: 'ENTREGA_PARCELADA', label: 'Entrega Parcelada' },
    { value: 'EXECUCAO_CONTINUA', label: 'Execucao Continua' },
    { value: 'EXECUCAO_POR_ETAPAS', label: 'Execucao por Etapas' },
  ],
  memoryModels: [
    { value: 'CONSUMO', label: 'Memoria por Consumo' },
    { value: 'DIMENSIONAMENTO', label: 'Memoria por Dimensionamento Institucional' },
  ],
  pricingModels: [
    { value: 'ITEM_UNICO', label: 'Pesquisa para Item Unico' },
    { value: 'MULTIPLOS_ITENS', label: 'Pesquisa por Multiplos Itens' },
    { value: 'LOTE', label: 'Pesquisa por Lote' },
  ],
};

var GUIDANCE_TEXT = {
  MATERIAL_CONSUMO: {
    dfd: 'Demanda de suprimento recorrente de itens consumiveis.',
    etp: 'Solução voltada a reposicao com quantidade estimada por historico de consumo.',
    tr: 'Objeto contratavel por especificacao de item de consumo e critérios de recebimento.',
  },
  BEM_PERMANENTE: {
    dfd: 'Demanda de incorporacao patrimonial com ciclo de vida duravel.',
    etp: 'Solução com foco em capacidade institucional e adequacao tecnica.',
    tr: 'Objeto contratavel com garantia, requisitos tecnicos e aceite funcional.',
  },
  SERVICO_CONTINUO: {
    dfd: 'Demanda de servico essencial com necessidade de continuidade.',
    etp: 'Solução com medicao recorrente, rotina operacional e nivel de servico.',
    tr: 'Objeto contratavel por desempenho e aceite periodico.',
  },
  SERVICO_TECNICO_ESPECIALIZADO: {
    dfd: 'Demanda de conhecimento especializado e produto tecnico rastreavel.',
    etp: 'Solução orientada a entrega por etapas e resultado tecnico comprovavel.',
    tr: 'Objeto contratavel com escopo tecnico, marcos e criterio de aceite de entrega.',
  },
};

var guidanceState = {
  step: 0,
  answers: {},
  invalidations: [],
  preflight: null,
  initializedFromCanonical: false,
  loadingOfficialOptions: false,
};

var GUIDANCE_STEPS = [
  { id: 'dfd', title: 'DFD — Fundamentacao', fields: ['department', 'legalRegime', 'objectType', 'objectStructure', 'executionForm', 'motivation'] },
  { id: 'etp', title: 'ETP — Solucao e Calculo', fields: ['problemModel', 'expectedOutcomeModel', 'solutionModel', 'memoryModel'] },
  { id: 'tr', title: 'TR — Contratacao e Aceite', fields: ['requirementModel', 'executionControlModel', 'acceptanceModel'] },
  { id: 'pricing', title: 'Pricing — Estrutura Economica', fields: ['pricingModel', 'estimatedTotalValue', 'itemCount'] },
  { id: 'review', title: 'Revisao Guiada', fields: [] },
];

function generateGuidanceProcessId() {
  var now = new Date();
  return 'PROC-E' +
    now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') + '-' +
    String(Math.floor(Math.random() * 900) + 100);
}

function renderFormSection(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;
  initializeGuidanceOptionsFromCanonical();
  if (!guidanceState.answers.processId) guidanceState.answers.processId = generateGuidanceProcessId();
  if (!guidanceState.answers.department) guidanceState.answers.department = DEPARTMENTS[0];

  var step = GUIDANCE_STEPS[guidanceState.step];
  container.innerHTML =
    '<p class="section-title">Conducao Operacional Guiada — ETAPA E</p>' +
    '<p class="section-desc">Sem pagina em branco: o fluxo e conduzido por microetapas com bloqueio preventivo e impacto downstream visivel.</p>' +
    buildProgressHtml() +
    buildInvalidationHtml() +
    '<div class="guidance-card">' +
      '<div class="guidance-title">' + escapeFormHtml(step.title) + '</div>' +
      '<div class="guidance-context">' + buildStepContext(step.id) + '</div>' +
      '<div class="guidance-fields">' + buildFieldsHtml(step.id) + '</div>' +
      '<div class="guidance-preflight" id="guidance-preflight"></div>' +
    '</div>' +
    '<div class="form-actions">' +
      '<button class="btn-secondary" id="btn-step-back"' + (guidanceState.step === 0 ? ' disabled' : '') + '>Voltar</button>' +
      '<button class="btn-secondary" id="btn-step-next">' + (step.id === 'review' ? 'Executar Processo' : 'Validar e Avancar') + '</button>' +
      '<span class="execute-hint" id="form-hint">' + buildHint(step.id) + '</span>' +
    '</div>' +
    '<div id="form-result-section" class="result-section" style="display:none;">' +
      '<div id="form-result-header" class="result-header"></div>' +
      '<div id="form-result-body" class="result-body"></div>' +
    '</div>';

  bindGuidanceActions();
}

function initializeGuidanceOptionsFromCanonical() {
  if (guidanceState.initializedFromCanonical) return;
  if (guidanceState.loadingOfficialOptions) return;
  guidanceState.loadingOfficialOptions = true;
  fetch(BACKEND_URL + '/api/process/guidance-options', { method: 'GET' })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var d = data && data.data ? data.data : null;
      if (!d) throw new Error('invalid options response');
      if (Array.isArray(d.legalRegime) && d.legalRegime.length) {
        GUIDANCE_OPTIONS.legalRegimes = d.legalRegime.map(function(v) { return { value: v, label: prettifyOption(v) }; });
      }
      if (Array.isArray(d.objectType) && d.objectType.length) {
        GUIDANCE_OPTIONS.objectTypes = d.objectType.map(function(v) {
          return { value: v, label: prettifyOption(v), durable: v === 'BEM_PERMANENTE' };
        });
      }
      if (Array.isArray(d.objectStructure) && d.objectStructure.length) {
        GUIDANCE_OPTIONS.objectStructures = d.objectStructure.map(function(v) { return { value: v, label: prettifyOption(v) }; });
      }
      if (Array.isArray(d.executionForm) && d.executionForm.length) {
        GUIDANCE_OPTIONS.executionForms = d.executionForm.map(function(v) { return { value: v, label: prettifyOption(v) }; });
      }
    })
    .catch(function() {
      // Fallback transitório: sem promover fixtures a fonte oficial.
    })
    .finally(function() {
      guidanceState.initializedFromCanonical = true;
      guidanceState.loadingOfficialOptions = false;
      var container = document.getElementById('form-container');
      if (container) renderFormSection('form-container');
    });

  // Fallback transitório imediato para nao quebrar uso offline.
  if (typeof DEMO_SCENARIOS === 'undefined' || !Array.isArray(DEMO_SCENARIOS) || !DEMO_SCENARIOS.length) {
    return;
  }
  var legalMap = {};
  var typeMap = {};
  var structureMap = {};
  var executionMap = {};
  DEMO_SCENARIOS.forEach(function(s) {
    var p = (s && s.request && s.request.payload) || {};
    if (p.legalRegime) legalMap[p.legalRegime] = true;
    if (p.objectType) typeMap[p.objectType] = true;
    if (p.objectStructure) structureMap[p.objectStructure] = true;
    if (p.executionForm) executionMap[p.executionForm] = true;
  });
  GUIDANCE_OPTIONS.legalRegimes = Object.keys(legalMap).map(function(v) { return { value: v, label: prettifyOption(v) }; });
  GUIDANCE_OPTIONS.objectTypes = Object.keys(typeMap).map(function(v) {
    return { value: v, label: prettifyOption(v), durable: v === 'BEM_PERMANENTE' };
  });
  GUIDANCE_OPTIONS.objectStructures = Object.keys(structureMap).map(function(v) { return { value: v, label: prettifyOption(v) }; });
  GUIDANCE_OPTIONS.executionForms = Object.keys(executionMap).map(function(v) { return { value: v, label: prettifyOption(v) }; });
}

function prettifyOption(raw) {
  return String(raw).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, function(c) { return c.toUpperCase(); });
}

function buildProgressHtml() {
  var html = '<div class="guidance-progress">';
  for (var i = 0; i < GUIDANCE_STEPS.length; i++) {
    var cls = i === guidanceState.step ? ' active' : (i < guidanceState.step ? ' done' : '');
    html += '<div class="guidance-step' + cls + '">' + (i + 1) + '. ' + escapeFormHtml(GUIDANCE_STEPS[i].id.toUpperCase()) + '</div>';
  }
  html += '</div>';
  return html;
}

function buildInvalidationHtml() {
  if (!guidanceState.invalidations.length) return '';
  return '<div class="guidance-warning">Mudanca estrutural detectada: ' + escapeFormHtml(guidanceState.invalidations.join(' | ')) + '</div>';
}

function buildStepContext(stepId) {
  var objType = guidanceState.answers.objectType;
  var text = objType && GUIDANCE_TEXT[objType] ? GUIDANCE_TEXT[objType][stepId] : null;
  if (stepId === 'review') return buildReviewHtml();
  return text || 'Defina esta microetapa para liberar o proximo bloco sem inconsistencia silenciosa.';
}

function buildFieldsHtml(stepId) {
  if (stepId === 'dfd') {
    return '' +
      selectField('department', 'Unidade Requisitante', DEPARTMENTS.map(function(d) { return { value: d, label: d }; })) +
      selectField('legalRegime', 'Regime Juridico', GUIDANCE_OPTIONS.legalRegimes) +
      selectField('objectType', 'Tipo de Objeto', GUIDANCE_OPTIONS.objectTypes) +
      selectField('objectStructure', 'Estrutura do Objeto', GUIDANCE_OPTIONS.objectStructures) +
      selectField('executionForm', 'Forma de Execucao', eligibleExecutionOptions()) +
      selectField('motivation', 'Motivacao Inicial', [
        { value: 'CONTINUIDADE', label: 'Continuidade de servico' },
        { value: 'MODERNIZACAO', label: 'Modernizacao operacional' },
        { value: 'ADEQUACAO_NORMATIVA', label: 'Adequacao normativa' },
      ]);
  }
  if (stepId === 'etp') {
    return '' +
      selectField('problemModel', 'Problema Administrativo', [
        { value: 'INSUFICIENCIA_CAPACIDADE', label: 'Insuficiencia de capacidade' },
        { value: 'RISCO_DESCONTINUIDADE', label: 'Risco de descontinuidade' },
        { value: 'LACUNA_TECNICA', label: 'Lacuna tecnica especializada' },
      ]) +
      selectField('expectedOutcomeModel', 'Resultado Pretendido', [
        { value: 'CONTINUIDADE_OPERACIONAL', label: 'Continuidade operacional' },
        { value: 'GANHO_EFICIENCIA', label: 'Ganho de eficiencia' },
        { value: 'REDUCAO_RISCO', label: 'Reducao de risco administrativo' },
      ]) +
      selectField('solutionModel', 'Solucao Administrativa', [
        { value: 'AQUISICAO', label: 'Aquisicao estruturada' },
        { value: 'CONTRATACAO_SERVICO', label: 'Contratacao de servico' },
      ]) +
      selectField('memoryModel', 'Modelo de Memoria de Calculo', eligibleMemoryOptions());
  }
  if (stepId === 'tr') {
    return '' +
      selectField('requirementModel', 'Requisitos Tecnicos e Administrativos', [
        { value: 'ESPECIFICACAO_OBJETIVA', label: 'Especificacao objetiva por requisito' },
        { value: 'REQUISITO_DESEMPENHO', label: 'Requisito por desempenho' },
      ]) +
      selectField('executionControlModel', 'Modelo de Execucao Contratual', [
        { value: 'CRONOGRAMA_ETAPAS', label: 'Cronograma por etapas' },
        { value: 'ROTINA_CONTINUA', label: 'Rotina continua com medicao' },
        { value: 'ENTREGA_FISICA', label: 'Entrega fisica com recebimento' },
      ]) +
      selectField('acceptanceModel', 'Criterio de Medicao e Aceite', [
        { value: 'ACEITE_TECNICO', label: 'Aceite tecnico formal' },
        { value: 'ACEITE_POR_MEDICAO', label: 'Aceite por medicao periodica' },
        { value: 'ACEITE_POR_ENTREGA', label: 'Aceite por entrega validada' },
      ]);
  }
  if (stepId === 'pricing') {
    return '' +
      selectField('pricingModel', 'Modelo de Pesquisa', eligiblePricingOptions()) +
      textField('estimatedTotalValue', 'Valor Total Estimado (R$)', '50000') +
      selectField('itemCount', 'Quantidade de Itens', [
        { value: '1', label: '1 item' },
        { value: '2', label: '2 itens' },
        { value: '3', label: '3 itens' },
      ]);
  }
  return '';
}

function buildReviewHtml() {
  var missing = collectMissingForAllSteps();
  if (missing.length) {
    return 'Pendencias para consolidacao: ' + escapeFormHtml(missing.join(', '));
  }
  return 'Revisao concluida: microetapas preenchidas. Proximo passo executa o motor com rastreabilidade.';
}

function buildHint(stepId) {
  if (stepId === 'review') return 'Revise pendencias e execute.';
  return 'Avance apenas apos pre-validacao da microetapa.';
}

function selectField(id, label, options) {
  var value = guidanceState.answers[id] || '';
  var html = '<div class="form-group"><label class="form-label" for="g-' + id + '">' + escapeFormHtml(label) + '</label>';
  html += '<select class="form-select" id="g-' + id + '"><option value="">Selecione...</option>';
  options.forEach(function(o) {
    var selected = o.value === value ? ' selected' : '';
    html += '<option value="' + escapeFormAttr(o.value) + '"' + selected + '>' + escapeFormHtml(o.label) + '</option>';
  });
  html += '</select></div>';
  return html;
}

function textField(id, label, fallback) {
  var value = guidanceState.answers[id] || fallback || '';
  return '<div class="form-group"><label class="form-label" for="g-' + id + '">' + escapeFormHtml(label) + '</label>' +
    '<input class="form-input" id="g-' + id + '" type="number" min="1" step="0.01" value="' + escapeFormAttr(value) + '" /></div>';
}

function eligibleExecutionOptions() {
  var type = guidanceState.answers.objectType;
  if (type === 'SERVICO_CONTINUO') return [{ value: 'EXECUCAO_CONTINUA', label: 'Execucao Continua' }];
  if (type === 'SERVICO_TECNICO_ESPECIALIZADO') return [{ value: 'EXECUCAO_POR_ETAPAS', label: 'Execucao por Etapas' }];
  return [
    { value: 'ENTREGA_UNICA', label: 'Entrega Unica' },
    { value: 'ENTREGA_PARCELADA', label: 'Entrega Parcelada' },
  ];
}

function eligibleMemoryOptions() {
  var type = guidanceState.answers.objectType;
  if (type === 'BEM_PERMANENTE') return [{ value: 'DIMENSIONAMENTO', label: 'Memoria por Dimensionamento Institucional' }];
  return GUIDANCE_OPTIONS.memoryModels;
}

function eligiblePricingOptions() {
  var structure = guidanceState.answers.objectStructure;
  if (structure === 'ITEM_UNICO') return [{ value: 'ITEM_UNICO', label: 'Pesquisa para Item Unico' }];
  if (structure === 'LOTE') return [{ value: 'LOTE', label: 'Pesquisa por Lote' }];
  return [{ value: 'MULTIPLOS_ITENS', label: 'Pesquisa por Multiplos Itens' }];
}

function bindGuidanceActions() {
  var step = GUIDANCE_STEPS[guidanceState.step];
  step.fields.forEach(function(field) {
    var el = document.getElementById('g-' + field);
    if (!el) return;
    el.addEventListener('change', function() {
      registerAnswer(field, this.value);
    });
    if (el.tagName === 'INPUT') {
      el.addEventListener('input', function() { registerAnswer(field, this.value); });
    }
  });

  var back = document.getElementById('btn-step-back');
  if (back) back.addEventListener('click', function() {
    guidanceState.step = Math.max(0, guidanceState.step - 1);
    renderFormSection('form-container');
  });

  var next = document.getElementById('btn-step-next');
  if (next) next.addEventListener('click', function() {
    runPreValidationAndAdvance(step.id);
  });
}

function registerAnswer(field, value) {
  var prev = guidanceState.answers[field];
  guidanceState.answers[field] = value;
  if (prev && prev !== value && isUpstreamField(field)) {
    invalidateDownstream(field);
  }
}

function isUpstreamField(field) {
  return ['legalRegime', 'objectType', 'objectStructure', 'executionForm', 'solutionModel', 'memoryModel'].indexOf(field) !== -1;
}

function invalidateDownstream(field) {
  var impacted = [];
  var clearFields = [];
  if (field === 'legalRegime' || field === 'objectType' || field === 'objectStructure' || field === 'executionForm') {
    impacted = ['ETP', 'TR', 'PRICING'];
    clearFields = ['problemModel', 'expectedOutcomeModel', 'solutionModel', 'memoryModel', 'requirementModel', 'executionControlModel', 'acceptanceModel', 'pricingModel'];
  } else if (field === 'solutionModel' || field === 'memoryModel') {
    impacted = ['TR', 'PRICING'];
    clearFields = ['requirementModel', 'executionControlModel', 'acceptanceModel', 'pricingModel'];
  }
  clearFields.forEach(function(f) { delete guidanceState.answers[f]; });
  guidanceState.invalidations = ['Alteracao em ' + field + ' invalidou: ' + impacted.join(', ')];
}

function collectMissingForStep(stepId) {
  var step = GUIDANCE_STEPS.filter(function(s) { return s.id === stepId; })[0];
  var missing = [];
  if (!step) return missing;
  step.fields.forEach(function(f) {
    if (!guidanceState.answers[f]) missing.push(f);
  });
  return missing;
}

function collectMissingForAllSteps() {
  var all = [];
  GUIDANCE_STEPS.forEach(function(s) {
    if (s.id === 'review') return;
    all = all.concat(collectMissingForStep(s.id));
  });
  return all;
}

function runPreValidationAndAdvance(stepId) {
  var hint = document.getElementById('form-hint');
  var preflight = document.getElementById('guidance-preflight');
  var missing = collectMissingForStep(stepId);
  if (missing.length) {
    if (preflight) preflight.innerHTML = '<span class="guidance-block">Bloqueado: faltam ' + escapeFormHtml(missing.join(', ')) + '.</span>';
    return;
  }
  var structuralError = checkLocalStructuralConsistency();
  if (structuralError) {
    if (preflight) preflight.innerHTML = '<span class="guidance-block">Bloqueio preventivo: ' + escapeFormHtml(structuralError) + '.</span>';
    return;
  }

  if (stepId === 'review') {
    executeForm();
    return;
  }

  if (hint) hint.textContent = 'Pre-validando no motor...';
  runServerPreflight()
    .then(function(msg) {
      if (preflight) preflight.innerHTML = '<span class="guidance-ok">' + escapeFormHtml(msg) + '</span>';
      guidanceState.step = Math.min(GUIDANCE_STEPS.length - 1, guidanceState.step + 1);
      setTimeout(function() { renderFormSection('form-container'); }, 200);
    })
    .catch(function(err) {
      if (preflight) preflight.innerHTML = '<span class="guidance-block">' + escapeFormHtml(String(err)) + '</span>';
    });
}

function checkLocalStructuralConsistency() {
  var type = guidanceState.answers.objectType;
  var memory = guidanceState.answers.memoryModel;
  var structure = guidanceState.answers.objectStructure;
  var pricing = guidanceState.answers.pricingModel;
  var execution = guidanceState.answers.executionForm;

  if (type === 'BEM_PERMANENTE' && memory === 'CONSUMO') {
    return 'bem permanente nao pode usar memoria por consumo';
  }
  if (structure && pricing && structure !== pricing) {
    return 'modelo de pricing deve refletir a estrutura do objeto';
  }
  if (type === 'SERVICO_CONTINUO' && execution && execution !== 'EXECUCAO_CONTINUA') {
    return 'servico continuo exige execucao continua';
  }
  if (type === 'SERVICO_TECNICO_ESPECIALIZADO' && execution && execution !== 'EXECUCAO_POR_ETAPAS') {
    return 'servico tecnico especializado exige execucao por etapas';
  }
  return null;
}

function runServerPreflight() {
  var request = buildPayloadFromForm();
  return fetch(BACKEND_URL + '/api/process/preflight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var result = data.result || {};
      var validations = Array.isArray(data.validations) ? data.validations : [];
      var block = validations.some(function(v) { return v && (v.severity === 'BLOCK' || v.severity === 'ERROR'); });
      if (block || result.halted) {
        var code = firstValidationCode(validations) || result.haltedBy || 'MOTOR_BLOCK';
        throw new Error('motor bloqueou no preflight: ' + code);
      }
      return 'preflight aprovado: sem bloqueio impeditivo do motor';
    });
}

function firstValidationCode(validations) {
  for (var i = 0; i < validations.length; i++) {
    if (validations[i] && validations[i].code) return validations[i].code;
  }
  return null;
}

function buildPayloadFromForm() {
  var a = guidanceState.answers;
  var processId = (a.processId || generateGuidanceProcessId()).trim();
  a.processId = processId;
  var now = new Date().toISOString();
  var itemCount = parseInt(a.itemCount || '1', 10);
  var totalValue = parseFloat(a.estimatedTotalValue || '50000');
  var unitValue = Math.round((totalValue / Math.max(itemCount, 1)) * 100) / 100;

  var objectLabel = optionLabel(GUIDANCE_OPTIONS.objectTypes, a.objectType);
  var regimeLabel = optionLabel(GUIDANCE_OPTIONS.legalRegimes, a.legalRegime);

  var payload = {
    legalRegime: a.legalRegime,
    objectType: a.objectType,
    objectStructure: a.objectStructure,
    executionForm: a.executionForm,
    demandDescription: 'Demanda estruturada para ' + objectLabel + ' sob regime ' + regimeLabel + '.',
    hiringJustification: 'Motivacao inicial: ' + (a.motivation || '') + '.',
    administrativeObjective: 'Resultado pretendido: ' + (a.expectedOutcomeModel || '') + '.',
    requestingDepartment: a.department,
    requesterName: 'Responsavel pelo Planejamento de Contratacoes',
    requestDate: now,
    needDescription: 'Problema administrativo classificado como ' + (a.problemModel || '') + '.',
    expectedResults: 'Resultado institucional esperado: ' + (a.expectedOutcomeModel || '') + '.',
    solutionSummary: 'Solucao administrativa: ' + (a.solutionModel || '') + '.',
    technicalJustification: 'Modelo de memoria de calculo: ' + (a.memoryModel || '') + '.',
    analysisDate: now,
    responsibleAnalyst: 'Analista de Planejamento de Contratacoes',
    objectDescription: 'Objeto contratavel estruturado para ' + objectLabel + '.',
    contractingPurpose: 'Finalidade da contratacao orientada ao problema administrativo classificado.',
    technicalRequirements: 'Modelo de requisitos: ' + (a.requirementModel || '') + '.',
    executionConditions: 'Modelo de execucao contratual: ' + (a.executionControlModel || '') + '.',
    acceptanceCriteria: 'Modelo de aceite: ' + (a.acceptanceModel || '') + '.',
    referenceDate: now,
    responsibleAuthor: 'Responsavel pelo Termo de Referencia',
    pricingSourceDescription: 'Modelo de pesquisa selecionado: ' + (a.pricingModel || '') + '.',
    referenceItemsDescription: 'Estrutura declarada: ' + (a.objectStructure || '') + '.',
    estimatedUnitValue: unitValue,
    estimatedTotalValue: totalValue,
    pricingJustification: 'Consolidacao economica orientada por estrutura do objeto.',
    requestingDepartmentForPricing: a.department,
    requestingDepartmentPricingAlias: shortDepartment(a.department),
  };

  if (itemCount > 1) {
    payload.items = [];
    payload.procurementStrategies = [];
    payload.administrativeJustifications = [];
    for (var i = 1; i <= itemCount; i++) {
      var itemId = 'item-' + i;
      payload.items.push({ id: itemId, description: objectLabel + ' - Item ' + i, quantity: 1, unit: 'un' });
      payload.procurementStrategies.push({
        targetType: 'item',
        targetId: itemId,
        procurementModality: mapRegimeToModality(a.legalRegime),
        competitionStrategy: a.legalRegime === 'LICITACAO' ? 'OPEN_COMPETITION' : 'DIRECT_SELECTION',
        divisionStrategy: a.objectStructure === 'LOTE' ? 'LOTS' : 'MULTIPLE_ITEMS',
        contractingJustification: 'Estrategia estruturada por item e coerencia de objeto.',
      });
      payload.administrativeJustifications.push({
        targetType: 'item',
        targetId: itemId,
        problemStatement: 'Problema administrativo classificado em microetapa ETP.',
        administrativeNeed: 'Necessidade administrativa estruturada para o item.',
        expectedOutcome: 'Resultado esperado orientado por conducao guiada.',
      });
    }
  } else {
    payload.procurementStrategy = {
      targetType: 'process',
      procurementModality: mapRegimeToModality(a.legalRegime),
      competitionStrategy: a.legalRegime === 'LICITACAO' ? 'OPEN_COMPETITION' : 'DIRECT_SELECTION',
      divisionStrategy: 'SINGLE_CONTRACT',
      contractingJustification: 'Estrategia estruturada sem campo livre inicial.',
    };
    payload.administrativeJustification = {
      targetType: 'process',
      problemStatement: 'Problema administrativo classificado em microetapa ETP.',
      administrativeNeed: 'Necessidade administrativa orientada por contexto.',
      expectedOutcome: 'Resultado esperado definido antes da consolidacao.',
    };
  }

  return {
    processId: processId,
    phase: 'PLANNING',
    tenantId: 'tenant-operacional',
    userId: 'user-conducao-etapa-e',
    correlationId: 'etapa-e-' + Date.now(),
    payload: payload,
  };
}

function mapRegimeToModality(regime) {
  if (regime === 'LICITACAO') return 'PREGAO';
  if (regime === 'INEXIGIBILIDADE') return 'INEXIGIBILIDADE';
  return 'DISPENSA';
}

function optionLabel(options, value) {
  var found = options.filter(function(o) { return o.value === value; })[0];
  return found ? found.label : value;
}

function shortDepartment(dep) {
  return String(dep || '').split(' ').slice(-2).join(' ') || 'Depto';
}
