/**
 * FASE 39/40 — DECYON / LICITAIA V2
 * Coordenação da aplicação: navegação entre tabs, healthcheck, demo de cenários.
 *
 * Consome o backend real (POST /api/process/run, GET /health,
 * GET /api/process-executions, GET /api/process-executions/:id).
 * Sem mock. Sem duplicação do motor.
 */

'use strict';

/* --------------------------------------------------------------------------
 * Configuração
 * -------------------------------------------------------------------------- */

var BACKEND_URL = 'http://localhost:3001';
var HEALTH_INTERVAL_MS = 30000;

/* --------------------------------------------------------------------------
 * Estado
 * -------------------------------------------------------------------------- */

var state = {
  selectedScenario: null,
  isExecuting: false,
  backendOnline: false,
  activeTab: 'demo',
};

/* --------------------------------------------------------------------------
 * Referências DOM
 * -------------------------------------------------------------------------- */

var els = {
  statusDot:       document.getElementById('status-dot'),
  statusLabel:     document.getElementById('status-label'),
  scenariosGrid:   document.getElementById('scenarios-grid'),
  btnExecute:      document.getElementById('btn-execute'),
  executeHint:     document.getElementById('execute-hint'),
  resultSection:   document.getElementById('result-section'),
  resultHeader:    document.getElementById('result-header'),
  resultBody:      document.getElementById('result-body'),
  loadingOverlay:  document.getElementById('loading-overlay'),
  errorToast:      document.getElementById('error-toast'),
  errorToastMsg:   document.getElementById('error-toast-msg'),
  footerBackend:   document.getElementById('footer-backend-url'),
};

/* --------------------------------------------------------------------------
 * Navegação entre Tabs
 * -------------------------------------------------------------------------- */

function activateTab(tabName) {
  state.activeTab = tabName;

  // Atualiza botões de tab
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    var active = btn.getAttribute('data-tab') === tabName;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  // Mostra/oculta seções
  var sections = ['section-demo', 'section-form', 'section-history'];
  sections.forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.style.display = (id === 'section-' + tabName) ? 'block' : 'none';
  });

  // Ao ativar Formulário: renderiza se ainda não foi renderizado
  if (tabName === 'form') {
    var formContainer = document.getElementById('form-container');
    if (formContainer && !formContainer.hasChildNodes()) {
      renderFormSection('form-container');
    }
  }

  // Ao ativar Histórico: carrega lista
  if (tabName === 'history') {
    loadHistory();
  }
}

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      activateTab(btn.getAttribute('data-tab'));
    });
  });

  var refreshBtn = document.getElementById('btn-refresh-history');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadHistory);
  }
}

/* --------------------------------------------------------------------------
 * Health Check
 * -------------------------------------------------------------------------- */

function setStatusChecking() {
  els.statusDot.className = 'status-dot checking';
  els.statusLabel.textContent = 'Verificando backend...';
}

function setStatusOnline(data) {
  state.backendOnline = true;
  els.statusDot.className = 'status-dot online';
  els.statusLabel.textContent =
    'Backend ativo \u2014 ' + data.service + ' v' + data.version + ' (' + data.environment + ')';
}

function setStatusOffline() {
  state.backendOnline = false;
  els.statusDot.className = 'status-dot offline';
  els.statusLabel.textContent = 'Backend indispon\u00edvel — inicie com: npm run dev';
}

function checkHealth() {
  setStatusChecking();
  fetch(BACKEND_URL + '/health', { method: 'GET' })
    .then(function(res) {
      if (!res.ok) { setStatusOffline(); return; }
      return res.json();
    })
    .then(function(data) {
      if (data) setStatusOnline(data);
    })
    .catch(function() {
      setStatusOffline();
    });
}

/* --------------------------------------------------------------------------
 * Renderização de cenários (Tab Demo)
 * -------------------------------------------------------------------------- */

var BADGE_CLASS_MAP = {
  SOLID_SUCCESS:    'badge-success',
  SOLID_JURIDICAL:  'badge-juridical',
  LEGITIMATE_BLOCK: 'badge-block',
  SOLID_MULTI_ITEM: 'badge-success',
};

function renderScenarios() {
  var grid = els.scenariosGrid;
  if (!grid) return;
  grid.innerHTML = '';

  DEMO_SCENARIOS.forEach(function(scenario) {
    var card = document.createElement('div');
    card.className = 'scenario-card';
    card.setAttribute('data-id', scenario.demoId);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Selecionar ' + scenario.demoId);

    var badgeClass = BADGE_CLASS_MAP[scenario.classification] || 'badge-partial';

    card.innerHTML =
      '<div class="card-id">' + escapeHtml(scenario.demoId) + '</div>' +
      '<div class="card-title">' + escapeHtml(scenario.demoTitle) + '</div>' +
      '<div class="card-badge ' + badgeClass + '">' + escapeHtml(scenario.classificationLabel) + '</div>' +
      '<div class="card-desc">' + escapeHtml(scenario.shortDesc) + '</div>';

    card.addEventListener('click', function() { selectScenario(scenario); });
    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectScenario(scenario); }
    });

    grid.appendChild(card);
  });
}

function selectScenario(scenario) {
  if (state.isExecuting) return;

  state.selectedScenario = scenario;

  document.querySelectorAll('.scenario-card').forEach(function(c) {
    c.classList.remove('selected');
  });

  var card = document.querySelector('[data-id="' + scenario.demoId + '"]');
  if (card) card.classList.add('selected');

  els.btnExecute.disabled = false;
  els.executeHint.textContent = 'Pronto: ' + scenario.demoId + ' \u2014 ' + scenario.classificationLabel;

  els.resultSection.style.display = 'none';
}

/* --------------------------------------------------------------------------
 * Execução de Cenário (Tab Demo)
 * -------------------------------------------------------------------------- */

function executeScenario() {
  if (!state.selectedScenario || state.isExecuting) return;

  state.isExecuting = true;
  els.btnExecute.disabled = true;
  els.loadingOverlay.style.display = 'flex';
  els.resultSection.style.display = 'none';
  hideError();

  var scenario = state.selectedScenario;

  fetch(BACKEND_URL + '/api/process/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scenario.request),
  })
    .then(function(res) {
      var httpStatus = res.status;
      return res.json().then(function(data) {
        return { httpStatus: httpStatus, data: data };
      });
    })
    .then(function(payload) {
      renderResult(scenario, payload.data, payload.httpStatus);
      // Atualiza histórico se a aba estiver aberta
      refreshHistoryIfVisible();
    })
    .catch(function() {
      showError(
        'Erro de conex\u00e3o com o backend em ' + BACKEND_URL +
        '. Verifique se o backend est\u00e1 rodando (npm run dev em 03-backend-api).'
      );
      setStatusOffline();
    })
    .finally(function() {
      state.isExecuting = false;
      els.btnExecute.disabled = false;
      els.loadingOverlay.style.display = 'none';
    });
}

/* --------------------------------------------------------------------------
 * Renderização do resultado (Tab Demo)
 * -------------------------------------------------------------------------- */

function renderResult(scenario, data, httpStatus) {
  els.resultSection.style.display = 'block';

  if (!data || typeof data !== 'object') {
    renderErrorResult('Resposta inv\u00e1lida do backend (n\u00e3o \u00e9 JSON).');
    scrollToResult();
    return;
  }

  if (data.success === false && data.error && !data.result) {
    renderErrorResult((data.error.message || 'Erro na execu\u00e7\u00e3o.') + ' [' + httpStatus + ']');
    scrollToResult();
    return;
  }

  var result       = data.result || {};
  var process_     = data.process || {};
  var halted       = result.halted !== undefined ? result.halted : (process_.halted || false);
  var finalStatus  = result.finalStatus || process_.finalStatus || 'UNKNOWN';
  var executedMods = Array.isArray(result.executedModules) ? result.executedModules : [];
  var validations  = Array.isArray(data.validations)   ? data.validations
                   : Array.isArray(result.validations) ? result.validations : [];

  var codes = validations
    .filter(function(v) { return v && typeof v.code === 'string' && v.code; })
    .map(function(v) { return { code: v.code, severity: v.severity || '' }; });

  var haltedBy   = result.haltedBy || null;
  var haltDetail = (result.haltedDetail && result.haltedDetail.code) || null;

  var outcomeClass = halted ? 'halted' : 'success';
  var outcomeLabel = halted ? 'BLOQUEADO' : 'SUCESSO';

  els.resultHeader.className = 'result-header ' + outcomeClass;
  els.resultHeader.innerHTML =
    '<span class="result-status-pill ' + outcomeClass + '">' + outcomeLabel + '</span>' +
    '<span class="result-header-title">' +
      escapeHtml(scenario.demoId) + ' \u2014 ' + escapeHtml(scenario.demoTitle) +
    '</span>';

  var modulesHtml = executedMods.length
    ? executedMods.map(function(m) { return '<span class="module-chip">' + escapeHtml(String(m)) + '</span>'; }).join('')
    : '<span style="font-size:0.8125rem;color:var(--gray-400)">n\u00e3o registrado</span>';

  var codesHtml = codes.length
    ? codes.map(function(c) {
        var isBlock = c.severity === 'BLOCK' || c.severity === 'ERROR';
        return '<span class="code-chip' + (isBlock ? ' block' : '') + '">' + escapeHtml(c.code) + '</span>';
      }).join('')
    : '<span style="font-size:0.8125rem;color:var(--gray-400)">nenhum c\u00f3digo emitido</span>';

  var haltedByHtml = haltedBy
    ? '<span class="field-value mono">' + escapeHtml(haltedBy) + '</span>'
    : (haltDetail
      ? '<span class="field-value mono">' + escapeHtml(haltDetail) + '</span>'
      : '<span class="field-value" style="color:var(--gray-400)">\u2014</span>');

  var haltedValueClass = halted ? 'field-value status-halt' : 'field-value status-success';
  var haltedText = halted
    ? '\u26d4 SIM \u2014 processo bloqueado'
    : '\u2705 N\u00c3O \u2014 pipeline conclu\u00eddo';

  els.resultBody.innerHTML =
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
      '<div class="field-value mono">' + httpStatus + '</div>' +
    '</div>' +
    '<div class="result-field">' +
      '<div class="field-label">Bloqueado por</div>' +
      haltedByHtml +
    '</div>' +
    '<div class="result-field" style="grid-column: span 2">' +
      '<div class="field-label">M\u00f3dulos Executados</div>' +
      '<div class="modules-wrap">' + modulesHtml + '</div>' +
    '</div>' +
    '<div class="result-field" style="grid-column: 1 / -1">' +
      '<div class="field-label">C\u00f3digos de Valida\u00e7\u00e3o (' + codes.length + ')</div>' +
      '<div class="codes-wrap">' + codesHtml + '</div>' +
    '</div>' +
    '<div class="result-proof">' +
      '<div class="proof-label">O que este cen\u00e1rio prova</div>' +
      '<div class="proof-text">' + escapeHtml(scenario.whatItProves) + '</div>' +
    '</div>';

  scrollToResult();
}

function renderErrorResult(message) {
  els.resultHeader.className = 'result-header error';
  els.resultHeader.innerHTML =
    '<span class="result-status-pill error">ERRO</span>' +
    '<span class="result-header-title">' + escapeHtml(message) + '</span>';
  els.resultBody.innerHTML = '';
}

function scrollToResult() {
  setTimeout(function() {
    els.resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 50);
}

/* --------------------------------------------------------------------------
 * Error toast
 * -------------------------------------------------------------------------- */

function showError(message) {
  els.errorToastMsg.textContent = message;
  els.errorToast.style.display = 'flex';
}

function hideError() {
  els.errorToast.style.display = 'none';
}

/* --------------------------------------------------------------------------
 * Utilitários
 * -------------------------------------------------------------------------- */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* --------------------------------------------------------------------------
 * Inicialização
 * -------------------------------------------------------------------------- */

function init() {
  if (els.footerBackend) {
    els.footerBackend.textContent = BACKEND_URL;
  }

  // Tabs
  initTabs();

  // Demo: renderiza cards de cenário
  renderScenarios();

  // Healthcheck inicial e periódico
  checkHealth();
  setInterval(checkHealth, HEALTH_INTERVAL_MS);

  // Demo: botão executar
  if (els.btnExecute) {
    els.btnExecute.addEventListener('click', executeScenario);
  }

  // Fechar toast de erro
  var closeBtn = document.getElementById('error-toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', hideError);
  }
}

init();
