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
