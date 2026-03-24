/**
 * FASE 41 — Histórico de execuções persistidas (versão auditável).
 *
 * Melhorias sobre a Fase 40:
 *   - Lista mais legível: exibe finalStatus, halted explícito, contagem de
 *     validações e módulos executados resumidos.
 *   - Filtros mínimos: por status (halted/ok/todos), por finalStatus, busca por processId.
 *   - Ordenação estável e explícita: mais recente primeiro.
 *   - Detalhe auditável com duas leituras:
 *       1. Resumo operacional (buildExecutionSummary)
 *       2. Leitura executiva (métricas essenciais)
 *       3. Leitura técnica completa (payload + resposta JSON + metadados)
 *
 * Consome GET /api/process-executions (lista) e
 *          GET /api/process-executions/:id (detalhe).
 * Sem lógica de motor. Sem reinterpretação de regras.
 */

'use strict';

/* --------------------------------------------------------------------------
 * Estado do histórico
 * -------------------------------------------------------------------------- */

var historyState = {
  list:       [],
  filteredList: [],
  selectedId: null,
  loading:    false,
  filters: {
    search:      '',
    haltedFilter: 'all',   // 'all' | 'halted' | 'ok'
    statusFilter: 'all',   // 'all' | qualquer finalStatus
  },
};

/* --------------------------------------------------------------------------
 * Carregamento da lista
 * -------------------------------------------------------------------------- */

function loadHistory() {
  var container = document.getElementById('history-list-container');
  var detail    = document.getElementById('history-detail-container');
  if (!container) return;

  historyState.loading = true;
  container.innerHTML  = '<div class="history-loading">Carregando execuções...</div>';
  if (detail) detail.style.display = 'none';

  fetch(BACKEND_URL + '/api/process-executions', { method: 'GET' })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      historyState.list    = Array.isArray(data.data) ? data.data : [];
      historyState.loading = false;
      applyFiltersAndRender();
    })
    .catch(function() {
      historyState.loading = false;
      container.innerHTML  =
        '<div class="history-empty">' +
          '<span style="font-size:1.25rem">⚠</span>' +
          '<span>Não foi possível carregar o histórico.</span>' +
          '<button class="btn-secondary" onclick="loadHistory()">Tentar novamente</button>' +
        '</div>';
    });
}

/* --------------------------------------------------------------------------
 * Filtros
 * -------------------------------------------------------------------------- */

function applyFiltersAndRender() {
  var filters = historyState.filters;
  var list    = historyState.list;

  var filtered = list.filter(function(item) {
    var matchHalted = filters.haltedFilter === 'all'
      || (filters.haltedFilter === 'halted' && item.halted)
      || (filters.haltedFilter === 'ok'     && !item.halted);

    var matchStatus = filters.statusFilter === 'all'
      || item.finalStatus === filters.statusFilter;

    var search = filters.search.trim().toLowerCase();
    var matchSearch = !search
      || (item.processId && item.processId.toLowerCase().indexOf(search) !== -1)
      || item.id.toLowerCase().indexOf(search) !== -1;

    return matchHalted && matchStatus && matchSearch;
  });

  historyState.filteredList = filtered;
  renderHistoryFilters();
  renderHistoryList(filtered);
}

function renderHistoryFilters() {
  var container = document.getElementById('history-filters-container');
  if (!container) return;

  var distinctStatuses = [];
  historyState.list.forEach(function(item) {
    if (item.finalStatus && distinctStatuses.indexOf(item.finalStatus) === -1) {
      distinctStatuses.push(item.finalStatus);
    }
  });

  var statusOptions = '<option value="all">Todos os status</option>' +
    distinctStatuses.map(function(s) {
      var sel = historyState.filters.statusFilter === s ? ' selected' : '';
      return '<option value="' + escapeHtml(s) + '"' + sel + '>' + escapeHtml(s) + '</option>';
    }).join('');

  var haltedSel = function(v) {
    return historyState.filters.haltedFilter === v ? ' selected' : '';
  };

  var searchVal = escapeHtml(historyState.filters.search);
  var total     = historyState.list.length;
  var showing   = historyState.filteredList.length;
  var countHint = (total !== showing)
    ? '<span class="filter-count">' + showing + ' de ' + total + '</span>'
    : '<span class="filter-count">' + total + ' execuções</span>';

  container.innerHTML =
    '<div class="history-filters">' +
      '<input class="filter-search" id="filter-search" type="text" ' +
        'placeholder="Buscar por processo ID…" ' +
        'value="' + searchVal + '" ' +
        'aria-label="Buscar por processo ID" />' +
      '<select class="filter-select" id="filter-halted" aria-label="Filtrar por halt">' +
        '<option value="all"' + haltedSel('all') + '>Todos (halt)</option>' +
        '<option value="ok"'    + haltedSel('ok')    + '>Somente sucesso</option>' +
        '<option value="halted"'+ haltedSel('halted')+ '>Somente bloqueados</option>' +
      '</select>' +
      '<select class="filter-select" id="filter-status" aria-label="Filtrar por finalStatus">' +
        statusOptions +
      '</select>' +
      (historyState.list.length
        ? '<button class="filter-clear btn-secondary" id="filter-clear">Limpar</button>'
        : '') +
      countHint +
    '</div>';

  var searchEl = document.getElementById('filter-search');
  if (searchEl) {
    searchEl.addEventListener('input', function() {
      historyState.filters.search = this.value;
      applyFiltersAndRender();
    });
  }

  var haltedEl = document.getElementById('filter-halted');
  if (haltedEl) {
    haltedEl.addEventListener('change', function() {
      historyState.filters.haltedFilter = this.value;
      applyFiltersAndRender();
    });
  }

  var statusEl = document.getElementById('filter-status');
  if (statusEl) {
    statusEl.addEventListener('change', function() {
      historyState.filters.statusFilter = this.value;
      applyFiltersAndRender();
    });
  }

  var clearEl = document.getElementById('filter-clear');
  if (clearEl) {
    clearEl.addEventListener('click', function() {
      historyState.filters = { search: '', haltedFilter: 'all', statusFilter: 'all' };
      applyFiltersAndRender();
    });
  }
}

/* --------------------------------------------------------------------------
 * Renderização da lista
 * -------------------------------------------------------------------------- */

function renderHistoryList(filtered) {
  var container = document.getElementById('history-list-container');
  if (!container) return;

  if (!filtered.length) {
    container.innerHTML =
      '<div class="history-empty">' +
        '<span style="font-size:2rem">📋</span>' +
        (historyState.list.length
          ? '<span>Nenhuma execução corresponde aos filtros aplicados.</span>'
          : '<span>Nenhuma execução registrada ainda.</span>') +
        (!historyState.list.length
          ? '<span style="font-size:0.8125rem;color:var(--gray-400)">Execute um cenário na aba Demo ou no Formulário para criar registros aqui.</span>'
          : '') +
      '</div>';
    return;
  }

  var rows = filtered.map(function(item) {
    var isHalted   = Boolean(item.halted);
    var badgeClass = isHalted ? 'badge-block' : 'badge-success';
    var haltLabel  = isHalted ? 'Bloqueado' : 'Sucesso';

    var processIdLabel = item.processId
      ? escapeHtml(item.processId)
      : '<span class="text-muted">—</span>';

    var statusLabel = item.finalStatus
      ? '<span class="status-mono">' + escapeHtml(item.finalStatus) + '</span>'
      : '<span class="text-muted">—</span>';

    var dateStr   = formatDate(item.createdAt);
    var validCount = (typeof item.validationCodesCount === 'number')
      ? item.validationCodesCount : '—';

    var modulesArr = Array.isArray(item.modulesExecuted) ? item.modulesExecuted : [];
    var modulesLabel;
    if (!modulesArr.length) {
      modulesLabel = '<span class="text-muted">—</span>';
    } else if (modulesArr.length <= 3) {
      modulesLabel = modulesArr.map(function(m) {
        return '<span class="module-chip-mini">' + escapeHtml(String(m)) + '</span>';
      }).join('');
    } else {
      modulesLabel = modulesArr.slice(0, 2).map(function(m) {
        return '<span class="module-chip-mini">' + escapeHtml(String(m)) + '</span>';
      }).join('') + '<span class="module-chip-mini more">+' + (modulesArr.length - 2) + '</span>';
    }

    return (
      '<div class="history-row" data-id="' + escapeHtml(item.id) + '" ' +
        'role="button" tabindex="0" ' +
        'aria-label="Ver detalhes da execução ' + escapeHtml(item.processId || item.id) + '">' +
        '<div class="history-row-status">' +
          '<span class="card-badge ' + badgeClass + '">' + haltLabel + '</span>' +
        '</div>' +
        '<div class="history-row-process">' +
          '<div class="row-process-id">' + processIdLabel + '</div>' +
          '<div class="row-final-status">' + statusLabel + '</div>' +
        '</div>' +
        '<div class="history-row-date">' + escapeHtml(dateStr) + '</div>' +
        '<div class="history-row-http">' +
          '<span class="field-value mono">' + item.httpStatus + '</span>' +
        '</div>' +
        '<div class="history-row-validations">' +
          '<span class="valid-count">' + validCount + '</span>' +
        '</div>' +
        '<div class="history-row-modules">' + modulesLabel + '</div>' +
        '<div class="history-row-arrow">›</div>' +
      '</div>'
    );
  }).join('');

  container.innerHTML =
    '<div class="history-header-row">' +
      '<div class="history-col-label">Halt</div>' +
      '<div class="history-col-label">Processo / Status Final</div>' +
      '<div class="history-col-label">Data / Hora</div>' +
      '<div class="history-col-label">HTTP</div>' +
      '<div class="history-col-label" title="Qtd. validações">Val.</div>' +
      '<div class="history-col-label">Módulos</div>' +
      '<div></div>' +
    '</div>' +
    rows;

  container.querySelectorAll('.history-row').forEach(function(row) {
    var id = row.getAttribute('data-id');
    row.addEventListener('click', function() { loadExecutionDetail(id); });
    row.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); loadExecutionDetail(id); }
    });
  });
}

/* --------------------------------------------------------------------------
 * Carregamento e renderização do detalhe
 * -------------------------------------------------------------------------- */

function loadExecutionDetail(id) {
  var detail = document.getElementById('history-detail-container');
  if (!detail) return;

  document.querySelectorAll('.history-row').forEach(function(r) {
    r.classList.toggle('selected', r.getAttribute('data-id') === id);
  });

  detail.style.display = 'block';
  detail.innerHTML = '<div class="history-loading">Carregando detalhe...</div>';
  detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  fetch(BACKEND_URL + '/api/process-executions/' + encodeURIComponent(id), { method: 'GET' })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (!data.success || !data.data) {
        detail.innerHTML = '<div class="history-empty">Execução não encontrada.</div>';
        return;
      }
      renderDetail(detail, data.data);
    })
    .catch(function() {
      detail.innerHTML = '<div class="history-empty">Erro ao carregar detalhe.</div>';
    });
}

/* --------------------------------------------------------------------------
 * Renderização do detalhe auditável (três camadas)
 * -------------------------------------------------------------------------- */

function renderDetail(container, execution) {
  // ETAPA F — leitura defensiva: garante arrays mesmo em registros antigos
  var safeModules = Array.isArray(execution.modulesExecuted) ? execution.modulesExecuted : [];
  var safeCodes   = Array.isArray(execution.validationCodes)  ? execution.validationCodes  : [];

  // ETAPA F — extrai objetos de validação completos do response persistido
  // Prioridade: response.validations > response.result.validations > fallback vazio
  var responseData = (execution.response && typeof execution.response === 'object') ? execution.response : {};
  var fullValidations = [];
  if (Array.isArray(responseData['validations'])) {
    fullValidations = responseData['validations'].filter(function(v) {
      return v && typeof v === 'object' && typeof v['code'] === 'string' && v['code'];
    });
  } else {
    var resultData = (responseData['result'] && typeof responseData['result'] === 'object')
      ? responseData['result'] : {};
    if (Array.isArray(resultData['validations'])) {
      fullValidations = resultData['validations'].filter(function(v) {
        return v && typeof v === 'object' && typeof v['code'] === 'string' && v['code'];
      });
    }
  }

  var blockingCount    = fullValidations.filter(function(v) {
    var sev = typeof v['severity'] === 'string' ? v['severity'].toUpperCase() : '';
    return sev === 'BLOCK' || sev === 'ERROR';
  }).length;
  var nonBlockingCount = fullValidations.length - blockingCount;

  var isHalted    = Boolean(execution.halted);
  var statusClass = isHalted ? 'halted' : 'success';
  var statusLabel = isHalted ? 'BLOQUEADO' : 'SUCESSO';
  var processId   = (execution.requestPayload && typeof execution.requestPayload.processId === 'string')
    ? execution.requestPayload.processId : '—';

  // Camada 1: Resumo operacional — usa shape normalizado para garantir consistência
  var summaryInput = {
    halted:          isHalted,
    haltedBy:        execution.haltedBy,
    validationCodes: safeCodes,
    modulesExecuted: safeModules,
  };
  var summary    = buildExecutionSummary(summaryInput);
  var summaryTypeClass = 'summary-' + summary.type;

  // Camada 2: Módulos (leitura executiva)
  var modulesHtml = safeModules.length
    ? safeModules.map(function(m) {
        return '<span class="module-chip">' + escapeHtml(String(m)) + '</span>';
      }).join('')
    : '<span class="text-muted">n\u00e3o registrado</span>';

  // ETAPA F — render semântico: usa fullValidations se disponíveis, senão fallback para string codes
  var validationsHtml;
  if (fullValidations.length > 0) {
    validationsHtml = buildValidationListHtml(fullValidations);
  } else if (safeCodes.length > 0) {
    validationsHtml = '<div class="val-list">' +
      safeCodes.map(function(c) {
        return '<div class="val-item sev-info"><div class="val-item-header">' +
          '<span class="val-code">' + escapeHtml(String(c)) + '</span>' +
          '</div></div>';
      }).join('') + '</div>';
  } else {
    validationsHtml = '<span class="text-muted">nenhum c\u00f3digo</span>';
  }

  var successWarningBannerHtml = (!isHalted && nonBlockingCount > 0)
    ? buildSuccessWithWarningsBanner(nonBlockingCount)
    : '';

  var haltedByHtml = execution.haltedBy
    ? '<span class="field-value mono">' + escapeHtml(execution.haltedBy) + '</span>'
    : '<span class="text-muted">\u2014</span>';

  var haltedValueClass = isHalted ? 'field-value status-halt' : 'field-value status-success';
  var haltedText       = isHalted ? '\u26d4 SIM \u2014 processo bloqueado' : '\u2705 N\u00c3O \u2014 pipeline conclu\u00eddo';

  // Camada 3: Payload resumido
  var payloadSummaryHtml = buildPayloadSummary(execution.requestPayload);

  container.innerHTML =
    // ── Cabeçalho do detalhe ──
    '<div class="detail-header ' + statusClass + '">' +
      '<span class="result-status-pill ' + statusClass + '">' + statusLabel + '</span>' +
      '<span class="result-header-title">' +
        escapeHtml(processId) + ' — ' + escapeHtml(formatDate(execution.createdAt)) +
      '</span>' +
      '<button class="detail-close-btn" onclick="closeDetail()" aria-label="Fechar detalhe">✕</button>' +
    '</div>' +

    '<div class="detail-body">' +

    // ── Camada 1: Resumo operacional ──
    '<div class="exec-summary ' + summaryTypeClass + '" role="status">' +
      '<div class="exec-summary-icon">' + summary.icon + '</div>' +
      '<div class="exec-summary-text">' +
        '<div class="exec-summary-label">' + escapeHtml(summary.label) + '</div>' +
        '<div class="exec-summary-detail">' + escapeHtml(summary.detail) + '</div>' +
      '</div>' +
    '</div>' +

    // ── Camada 2: Leitura executiva (métricas essenciais) ──
    '<div class="detail-section">' +
      '<div class="detail-section-title">Leitura Executiva — Métricas da Execução</div>' +
      '<div class="detail-metrics">' +
        '<div class="result-field">' +
          '<div class="field-label">Status Final</div>' +
          '<div class="field-value mono">' + escapeHtml(execution.finalStatus || '—') + '</div>' +
        '</div>' +
        '<div class="result-field">' +
          '<div class="field-label">Halt</div>' +
          '<div class="' + haltedValueClass + '">' + haltedText + '</div>' +
        '</div>' +
        '<div class="result-field">' +
          '<div class="field-label">HTTP</div>' +
          '<div class="field-value mono">' + (execution.httpStatus || '—') + '</div>' +
        '</div>' +
        '<div class="result-field">' +
          '<div class="field-label">Interrompido por</div>' +
          haltedByHtml +
        '</div>' +
        '<div class="result-field">' +
          '<div class="field-label">Valida\u00e7\u00f5es</div>' +
          '<div class="field-value mono">' + (fullValidations.length > 0 ? fullValidations.length : safeCodes.length) + '</div>' +
        '</div>' +
        '<div class="result-field">' +
          '<div class="field-label">Módulos</div>' +
          '<div class="field-value mono">' + safeModules.length + '</div>' +
        '</div>' +
        '<div class="result-field" style="grid-column: span 3">' +
          '<div class="field-label">ID da Execução</div>' +
          '<div class="field-value mono" style="font-size:0.75rem">' + escapeHtml(execution.id) + '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // ── Framing: sucesso com warnings ──
    (successWarningBannerHtml ? '<div>' + successWarningBannerHtml + '</div>' : '') +

    // ── Módulos executados ──
    '<div class="detail-section">' +
      '<div class="detail-section-title">M\u00f3dulos Executados (' + safeModules.length + ')</div>' +
      '<div class="modules-wrap" style="padding:0.75rem 1rem">' + modulesHtml + '</div>' +
    '</div>' +

    // ── Validações semânticas ──
    '<div class="detail-section">' +
      '<div class="detail-section-title">Valida\u00e7\u00f5es do Motor (' +
        (fullValidations.length > 0 ? fullValidations.length : safeCodes.length) + ')</div>' +
      '<div style="padding:0.75rem 1rem">' + validationsHtml + '</div>' +
    '</div>' +

    // ── Camada 3: Leitura técnica — Payload enviado ──
    '<div class="detail-section">' +
      '<div class="detail-section-title detail-collapsible" onclick="toggleCollapsible(this)">' +
        '▶ Leitura Técnica — Payload Enviado ao Motor' +
      '</div>' +
      '<div style="display:none">' + payloadSummaryHtml + '</div>' +
    '</div>' +

    // ── Resposta completa (JSON bruto) ──
    '<div class="detail-section">' +
      '<div class="detail-section-title detail-collapsible" onclick="toggleCollapsible(this)">' +
        '▶ Leitura Técnica — Resposta Completa do Motor (JSON)' +
      '</div>' +
      '<pre class="detail-json" style="display:none">' +
        escapeHtml(JSON.stringify(execution.response, null, 2)) +
      '</pre>' +
    '</div>' +

    '</div>'; // end detail-body
}

/* --------------------------------------------------------------------------
 * Resumo do payload (leitura técnica — campos de identificação)
 * -------------------------------------------------------------------------- */

function buildPayloadSummary(payload) {
  if (!payload || typeof payload !== 'object') return '<em class="text-muted">indisponível</em>';

  var topFields = [
    { key: 'processId',     label: 'Processo ID' },
    { key: 'phase',         label: 'Fase' },
    { key: 'tenantId',      label: 'Tenant' },
    { key: 'userId',        label: 'Usuário' },
    { key: 'correlationId', label: 'Correlation ID' },
  ];

  var payloadObj = payload.payload || {};
  var innerFields = [
    { key: 'demandDescription',    label: 'Descrição da Demanda' },
    { key: 'objectDescription',    label: 'Objeto' },
    { key: 'requestingDepartment', label: 'Unidade Requisitante' },
    { key: 'estimatedTotalValue',  label: 'Valor Total Estimado' },
    { key: 'contractingPurpose',   label: 'Finalidade da Contratação' },
  ];

  var html = '<div class="payload-summary">';

  topFields.forEach(function(f) {
    if (payload[f.key] !== undefined) {
      html += '<div class="payload-row">' +
        '<span class="payload-key">' + escapeHtml(f.label) + '</span>' +
        '<span class="payload-val">' + escapeHtml(String(payload[f.key])) + '</span>' +
        '</div>';
    }
  });

  innerFields.forEach(function(f) {
    if (payloadObj[f.key] !== undefined) {
      var val = String(payloadObj[f.key]);
      if (val.length > 140) val = val.substring(0, 140) + '…';
      html += '<div class="payload-row">' +
        '<span class="payload-key">' + escapeHtml(f.label) + '</span>' +
        '<span class="payload-val">' + escapeHtml(val) + '</span>' +
        '</div>';
    }
  });

  html += '</div>';
  return html;
}

/* --------------------------------------------------------------------------
 * Controles de UI
 * -------------------------------------------------------------------------- */

function closeDetail() {
  var detail = document.getElementById('history-detail-container');
  if (detail) detail.style.display = 'none';
  document.querySelectorAll('.history-row').forEach(function(r) {
    r.classList.remove('selected');
  });
}

function toggleCollapsible(titleEl) {
  var content = titleEl.nextElementSibling;
  if (!content) return;
  var isOpen = content.style.display !== 'none';
  content.style.display = isOpen ? 'none' : 'block';
  titleEl.textContent   = (isOpen ? '▶' : '▼') + titleEl.textContent.slice(1);
}

function refreshHistoryIfVisible() {
  var section = document.getElementById('section-history');
  if (section && section.style.display !== 'none') {
    loadHistory();
  }
}

/* --------------------------------------------------------------------------
 * Utilitários
 * -------------------------------------------------------------------------- */

function formatDate(isoStr) {
  if (!isoStr) return '—';
  try {
    var d = new Date(isoStr);
    return d.toLocaleDateString('pt-BR') +
      ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    return isoStr;
  }
}
