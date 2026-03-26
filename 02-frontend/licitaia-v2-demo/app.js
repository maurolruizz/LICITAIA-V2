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
var SESSION_STORAGE_KEY = 'decyon.fi7.session';

/* --------------------------------------------------------------------------
 * Estado
 * -------------------------------------------------------------------------- */

var state = {
  selectedScenario: null,
  isExecuting: false,
  backendOnline: false,
  activeTab: 'demo',
  session: null,
  authContext: null,
  institutionalSettings: null,
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
  sessionLabel:    document.getElementById('session-label'),
  btnLogout:       document.getElementById('btn-logout'),
  loginForm:       document.getElementById('login-form'),
  loginStatus:     document.getElementById('login-status'),
  authContextView: document.getElementById('auth-context-view'),
  settingsForm:    document.getElementById('institutional-settings-form'),
  settingsStatus:  document.getElementById('settings-status'),
  btnSaveSettings: document.getElementById('btn-save-settings'),
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
  var sections = ['section-demo', 'section-form', 'section-admin', 'section-history'];
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

  if (tabName === 'admin') {
    renderAuthContext();
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

  if (els.loginForm) {
    els.loginForm.addEventListener('submit', onSubmitLogin);
  }
  if (els.settingsForm) {
    els.settingsForm.addEventListener('submit', onSubmitInstitutionalSettings);
  }
  if (els.btnLogout) {
    els.btnLogout.addEventListener('click', onLogoutClick);
  }
}

function persistSession(session) {
  state.session = session;
  try {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (_) {}
}

function restoreSession() {
  try {
    var raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return;
    var parsed = JSON.parse(raw);
    if (parsed && parsed.accessToken && parsed.refreshToken && parsed.tenant && parsed.user) {
      state.session = parsed;
    }
  } catch (_) {}
}

function getAuthHeaders() {
  if (!state.session || !state.session.accessToken) return {};
  return { Authorization: 'Bearer ' + state.session.accessToken };
}

window.getAuthHeaders = getAuthHeaders;

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

function setLoginStatus(message) {
  if (els.loginStatus) els.loginStatus.textContent = message;
}

function setSettingsStatus(message) {
  if (els.settingsStatus) els.settingsStatus.textContent = message;
}

function updateSessionBadge() {
  if (!els.sessionLabel || !els.btnLogout) return;
  if (!state.session || !state.authContext) {
    els.sessionLabel.textContent = 'Não autenticado';
    els.btnLogout.style.display = 'none';
    return;
  }
  var role = state.authContext.role || 'sem-role';
  els.sessionLabel.textContent = state.authContext.email + ' (' + role + ')';
  els.btnLogout.style.display = 'inline-flex';
}

function renderAuthContext() {
  if (!els.authContextView) return;
  if (!state.session || !state.authContext) {
    els.authContextView.textContent = 'Sem sessão ativa.';
    return;
  }
  var ctx = state.authContext;
  els.authContextView.innerHTML =
    '<div><strong>Usuário:</strong> ' + escapeHtml(ctx.name || '') + ' (' + escapeHtml(ctx.email || '') + ')</div>' +
    '<div><strong>Papel:</strong> ' + escapeHtml(ctx.role || '') + '</div>' +
    '<div><strong>Tenant:</strong> ' + escapeHtml(ctx.tenantSlug || '') + ' (' + escapeHtml(ctx.tenantName || '') + ')</div>';
}

function applySettingsEditability() {
  if (!els.settingsForm || !els.btnSaveSettings) return;
  var isAdmin = state.authContext && state.authContext.role === 'TENANT_ADMIN';
  var inputs = els.settingsForm.querySelectorAll('input');
  inputs.forEach(function(input) {
    input.readOnly = !isAdmin;
    input.disabled = !state.session;
  });
  els.btnSaveSettings.disabled = !isAdmin;
  els.btnSaveSettings.style.display = isAdmin ? 'inline-flex' : 'none';
  if (!state.session) {
    setSettingsStatus('Faça login para carregar dados.');
  } else if (!isAdmin) {
    setSettingsStatus('Perfil TENANT_USER: leitura permitida; atualização bloqueada (RBAC backend mantém 403).');
  } else {
    setSettingsStatus('Perfil TENANT_ADMIN: edição habilitada.');
  }
}

function fillSettingsForm(data) {
  if (!els.settingsForm || !data) return;
  ['organizationName', 'organizationLegalName', 'documentNumber', 'defaultTimezone', 'defaultLocale'].forEach(function(key) {
    var input = els.settingsForm.querySelector('[name="' + key + '"]');
    if (input) input.value = data[key] || '';
  });
}

function readSettingsFormPayload() {
  var payload = {};
  ['organizationName', 'organizationLegalName', 'documentNumber', 'defaultTimezone', 'defaultLocale'].forEach(function(key) {
    var input = els.settingsForm ? els.settingsForm.querySelector('[name="' + key + '"]') : null;
    if (input) payload[key] = input.value;
  });
  return payload;
}

function handleUnauthorizedSession() {
  persistSession(null);
  state.authContext = null;
  state.institutionalSettings = null;
  renderAuthContext();
  applySettingsEditability();
  updateSessionBadge();
}

function fetchWithAuth(path, opts) {
  var headers = Object.assign({}, (opts && opts.headers) || {}, getAuthHeaders());
  var finalOpts = Object.assign({}, opts || {}, { headers: headers });
  return fetch(BACKEND_URL + path, finalOpts);
}

function loadAuthContextAndSettings() {
  if (!state.session || !state.session.accessToken) {
    renderAuthContext();
    applySettingsEditability();
    updateSessionBadge();
    return Promise.resolve();
  }
  return fetchWithAuth('/api/users/me', { method: 'GET' })
    .then(function(res) {
      if (res.status === 401) throw new Error('UNAUTH');
      return res.json().then(function(body) {
        return { status: res.status, body: body };
      });
    })
    .then(function(payload) {
      if (payload.status !== 200 || !payload.body.success || !payload.body.data) {
        throw new Error('Falha ao carregar /api/users/me');
      }
      state.authContext = {
        id: payload.body.data.id,
        name: payload.body.data.name,
        email: payload.body.data.email,
        role: payload.body.data.role,
        tenantId: state.session.tenant.id,
        tenantSlug: state.session.tenant.slug,
        tenantName: state.session.tenant.name,
      };
      renderAuthContext();
      updateSessionBadge();
      return fetchWithAuth('/api/institutional-settings', { method: 'GET' });
    })
    .then(function(res) {
      if (res.status === 401) throw new Error('UNAUTH');
      return res.json().then(function(body) {
        return { status: res.status, body: body };
      });
    })
    .then(function(payload) {
      if (payload.status !== 200 || !payload.body.success || !payload.body.data) {
        throw new Error('Falha ao carregar /api/institutional-settings');
      }
      state.institutionalSettings = payload.body.data;
      fillSettingsForm(payload.body.data);
      applySettingsEditability();
      setLoginStatus('Sessão ativa e contexto carregado com sucesso.');
    })
    .catch(function(err) {
      if (err && err.message === 'UNAUTH') {
        handleUnauthorizedSession();
        setLoginStatus('Sessão expirada. Faça login novamente.');
        return;
      }
      showError('Falha ao carregar contexto autenticado.');
    });
}

function onSubmitLogin(evt) {
  evt.preventDefault();
  if (!els.loginForm) return;
  var formData = new FormData(els.loginForm);
  var payload = {
    tenantSlug: String(formData.get('tenantSlug') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    password: String(formData.get('password') || ''),
  };
  setLoginStatus('Autenticando...');
  fetch(BACKEND_URL + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(function(res) {
      return res.json().then(function(body) {
        return { status: res.status, body: body };
      });
    })
    .then(function(result) {
      if (result.status !== 200 || !result.body.success || !result.body.data) {
        throw new Error((result.body.error && result.body.error.message) || 'Falha de login.');
      }
      persistSession({
        accessToken: result.body.data.accessToken,
        refreshToken: result.body.data.refreshToken,
        tenant: result.body.data.tenant,
        user: result.body.data.user,
      });
      setLoginStatus('Login concluído. Carregando contexto...');
      return loadAuthContextAndSettings();
    })
    .catch(function(err) {
      handleUnauthorizedSession();
      setLoginStatus('Falha no login: ' + (err && err.message ? err.message : 'erro inesperado'));
    });
}

function onSubmitInstitutionalSettings(evt) {
  evt.preventDefault();
  if (!state.authContext) return;
  if (state.authContext.role !== 'TENANT_ADMIN') {
    setSettingsStatus('Atualização bloqueada no frontend para TENANT_USER.');
    return;
  }
  setSettingsStatus('Salvando...');
  fetchWithAuth('/api/institutional-settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(readSettingsFormPayload()),
  })
    .then(function(res) {
      return res.json().then(function(body) {
        return { status: res.status, body: body };
      });
    })
    .then(function(result) {
      if (result.status === 403) {
        setSettingsStatus('Backend retornou 403 (RBAC aplicado).');
        return;
      }
      if (result.status !== 200 || !result.body.success) {
        throw new Error((result.body.error && result.body.error.message) || 'Falha ao salvar.');
      }
      state.institutionalSettings = result.body.data;
      fillSettingsForm(result.body.data);
      setSettingsStatus('Configuração salva com sucesso.');
    })
    .catch(function(err) {
      setSettingsStatus('Erro ao salvar: ' + (err && err.message ? err.message : 'erro inesperado'));
    });
}

function onLogoutClick() {
  if (!state.session) return handleUnauthorizedSession();
  fetchWithAuth('/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: state.session.refreshToken }),
  })
    .finally(function() {
      handleUnauthorizedSession();
      setLoginStatus('Sessão encerrada com sucesso.');
      activateTab('admin');
    });
}

/* --------------------------------------------------------------------------
 * Renderização de cenários (Tab Demo)
 * -------------------------------------------------------------------------- */

var BADGE_CLASS_MAP = {
  SOLID_SUCCESS:       'badge-success',
  SOLID_JURIDICAL:     'badge-juridical',
  LEGITIMATE_BLOCK:    'badge-block',
  SOLID_MULTI_ITEM:    'badge-success',
  SOLID_CALCULATION:   'badge-calculation',
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

  var fullValidations = validations.filter(function(v) { return v && typeof v.code === 'string' && v.code; });
  var blockingCount   = fullValidations.filter(function(v) {
    var sev = typeof v.severity === 'string' ? v.severity.toUpperCase() : '';
    return sev === 'BLOCK' || sev === 'ERROR';
  }).length;
  var nonBlockingCount = fullValidations.length - blockingCount;

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

  var validationsHtml = buildValidationListHtml(fullValidations);

  var haltedByHtml = haltedBy
    ? '<span class="field-value mono">' + escapeHtml(haltedBy) + '</span>'
    : (haltDetail
      ? '<span class="field-value mono">' + escapeHtml(haltDetail) + '</span>'
      : '<span class="field-value" style="color:var(--gray-400)">\u2014</span>');

  var haltedValueClass = halted ? 'field-value status-halt' : 'field-value status-success';
  var haltedText = halted
    ? '\u26d4 SIM \u2014 processo bloqueado'
    : '\u2705 N\u00c3O \u2014 pipeline conclu\u00eddo';

  var successWarningBannerHtml = (!halted && nonBlockingCount > 0)
    ? buildSuccessWithWarningsBanner(nonBlockingCount)
    : '';

  // ETAPA F — Blindagem: detecta divergência entre resultado real e expectativa do cenário oficial.
  var divergenceHtml = '';
  var expectedHalt        = scenario.expectedHalt !== undefined ? Boolean(scenario.expectedHalt) : null;
  var expectedFinalStatus = scenario.expectedFinalStatus || null;
  var haltMismatch   = expectedHalt !== null && halted !== expectedHalt;
  var statusMismatch = expectedFinalStatus !== null && finalStatus !== expectedFinalStatus;
  if (haltMismatch || statusMismatch) {
    var divergenceLines = [];
    if (haltMismatch) {
      divergenceLines.push(
        'halt: esperado ' + (expectedHalt ? 'bloqueado' : 'sucesso') +
        ', obtido ' + (halted ? 'bloqueado' : 'sucesso')
      );
    }
    if (statusMismatch) {
      divergenceLines.push(
        'finalStatus: esperado ' + escapeHtml(expectedFinalStatus) +
        ', obtido ' + escapeHtml(finalStatus)
      );
    }
    divergenceHtml =
      '<div style="grid-column:1/-1;display:flex;align-items:flex-start;gap:0.625rem;' +
        'padding:0.75rem 1rem;background:var(--red-light);border:1.5px solid var(--red-border);' +
        'border-radius:var(--radius);margin-bottom:0.25rem">' +
        '<span style="font-size:1rem;flex-shrink:0">\u26a0\ufe0f</span>' +
        '<div>' +
          '<div style="font-size:0.8125rem;font-weight:700;color:var(--red);margin-bottom:0.25rem">' +
            'DIVERG\u00caNCIA: resultado n\u00e3o corresponde \u00e0 expectativa oficial do cen\u00e1rio' +
          '</div>' +
          '<div style="font-size:0.75rem;color:var(--gray-700);line-height:1.5">' +
            escapeHtml(divergenceLines.join(' | ')) +
          '</div>' +
          '<div style="font-size:0.75rem;color:var(--gray-500);margin-top:0.25rem;font-style:italic">' +
            'Cen\u00e1rio oficial requer corre\u00e7\u00e3o de payload ou de expectativa.' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  els.resultBody.innerHTML =
    divergenceHtml +
    (successWarningBannerHtml ? successWarningBannerHtml : '') +
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
      '<div class="field-label">Valida\u00e7\u00f5es do Motor (' + fullValidations.length + ')</div>' +
      '<div style="margin-top:0.25rem">' + validationsHtml + '</div>' +
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
  restoreSession();

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

  updateSessionBadge();
  applySettingsEditability();
  void loadAuthContextAndSettings();
}

init();
