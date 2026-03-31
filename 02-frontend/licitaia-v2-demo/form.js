'use strict';

var FLOW_UI = {
  containerId: null,
  processId: null,
  state: null,
  draft: {},
  loading: false,
  error: null,
};

var MESSAGE_CATALOG = {
  CONDUCAO_STEP_INIT: 'Etapa INIT',
  CONDUCAO_STEP_CONTEXT: 'Etapa CONTEXT',
  CONDUCAO_STEP_REGIME: 'Etapa REGIME',
  CONDUCAO_STEP_DFD: 'Etapa DFD',
  CONDUCAO_STEP_ETP: 'Etapa ETP',
  CONDUCAO_STEP_TR: 'Etapa TR',
  CONDUCAO_STEP_PRICING: 'Etapa PRICING',
  CONDUCAO_STEP_REVIEW: 'Etapa REVIEW',
  CONDUCAO_STEP_OUTPUT: 'Etapa OUTPUT',
  CONDUCAO_INSTRUCTION_FILL_REQUIRED_FIELDS: 'Preencha os campos obrigatórios.',
  CONDUCAO_INSTRUCTION_RESOLVE_BLOCKINGS: 'Resolva os bloqueios ativos.',
  CONDUCAO_INSTRUCTION_RUN_REVIEW: 'Execute a revisão para continuar.',
  CONDUCAO_INSTRUCTION_VIEW_RESULT: 'Visualize o resultado consolidado.',
  REVIEW_PANEL_TITLE: 'Painel de Revisão',
  REVIEW_PANEL_INSTRUCTION_PRE_EXEC: 'Revisão pendente de execução.',
  REVIEW_PANEL_INSTRUCTION_POST_EXEC: 'Revisão executada.',
  REVIEW_BLOCK_STATIC_SUMMARY: 'Resumo da revisão',
  REVIEW_BLOCK_OUTCOME_LINE: 'Desfecho',
  REVIEW_BLOCK_MODULES_LINE: 'Módulos',
  REVIEW_TRIGGER_PRIMARY_LABEL: 'Executar revisão',
  OUTPUT_PANEL_TITLE: 'Painel de Saída',
  OUTPUT_PANEL_INSTRUCTION_VIEW: 'Resultado disponível para consulta.',
  OUTPUT_BLOCK_RESULT_SUMMARY: 'Resumo do resultado',
  BLOCKING_STATE_INVALID_TRANSITION: 'Transição inválida de fluxo.',
  BLOCKING_STATE_REVIEW_NOT_AVAILABLE: 'Revisão indisponível nesta etapa.',
  BLOCKING_STATE_OUTPUT_NOT_AVAILABLE: 'Saída indisponível nesta etapa.',
  BLOCKING_STATE_REGIME_FROZEN: 'Regime congelado para edição.',
  BLOCKING_STATE_INVALIDATED_DOWNSTREAM: 'Etapas downstream invalidadas.',
  BLOCKING_UI_STATE_STALE: 'Estado da UI está obsoleto.',
  BLOCKING_UI_RENDER_TOKEN_MISMATCH: 'Token de renderização divergente.',
  BLOCKING_MOTOR_HALTED_BY_VALIDATION: 'Motor interrompido por validação.',
  BLOCKING_MOTOR_HALTED_BY_DEPENDENCY: 'Motor interrompido por dependência.',
  BLOCKING_MOTOR_HALTED_BY_MODULE: 'Motor interrompido por módulo.',
  BLOCKING_MOTOR_CLASSIFICATION_PREFLIGHT: 'Motor interrompido no preflight classificatório.',
  ERROR_STATE_STALE: 'Estado desatualizado. Recarregando automaticamente.',
};

function t(key) {
  if (!key) return 'messageKey indefinida';
  return Object.prototype.hasOwnProperty.call(MESSAGE_CATALOG, key)
    ? MESSAGE_CATALOG[key]
    : '[' + key + ']';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function hasHardBlocking(state) {
  var blockings = state && Array.isArray(state.activeBlockings) ? state.activeBlockings : [];
  return blockings.some(function (b) { return b && b.severity === 'HARD'; });
}

function guardFromState(state) {
  return {
    expectedRevision: state.revision,
    expectedRenderToken: state.renderToken,
  };
}

function flowFetch(path, opts) {
  return fetch(BACKEND_URL + path, opts || {}).then(function (res) {
    return res.json().then(function (body) {
      return { status: res.status, body: body };
    });
  });
}

function ensureFlowSession() {
  if (FLOW_UI.processId) return Promise.resolve();
  return flowFetch('/api/process/flow-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }).then(function (result) {
    if (result.status !== 200 || !result.body.success || !result.body.data) {
      throw new Error('FLOW_SESSION_CREATE_FAILED');
    }
    FLOW_UI.processId = result.body.data.processId;
    FLOW_UI.state = result.body.data.state;
    syncDraftFromState();
  });
}

function refetchState() {
  if (!FLOW_UI.processId) return Promise.resolve();
  return flowFetch('/api/process/flow-state?processId=' + encodeURIComponent(FLOW_UI.processId), {
    method: 'GET',
  }).then(function (result) {
    if (result.status !== 200 || !result.body.success || !result.body.data) {
      throw new Error('FLOW_STATE_FETCH_FAILED');
    }
    FLOW_UI.state = result.body.data.state;
    syncDraftFromState();
  });
}

function syncDraftFromState() {
  var form = FLOW_UI.state && FLOW_UI.state.currentStepForm;
  FLOW_UI.draft = {};
  if (!form || form.mode !== 'CONDUCTION_STEP_FORM') return;
  (form.fields || []).forEach(function (f) {
    if (!f || !f.state || !f.state.fieldId) return;
    var v = f.state.value;
    FLOW_UI.draft[f.state.fieldId] = v ? v.value : '';
  });
}

function sendCommand(action, payload) {
  if (!FLOW_UI.state || !FLOW_UI.processId) return Promise.resolve();
  FLOW_UI.loading = true;
  FLOW_UI.error = null;
  renderFlow();

  var commandBody = {
    processId: FLOW_UI.processId,
    action: action,
    guard: guardFromState(FLOW_UI.state),
  };
  if (payload && payload.updates) commandBody.updates = payload.updates;

  return flowFetch('/api/process/flow-command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(commandBody),
  })
    .then(function (result) {
      if (result.status === 409 && result.body && result.body.error && result.body.error.code === 'STATE_STALE') {
        FLOW_UI.error = t(result.body.error.messageKey || 'ERROR_STATE_STALE');
        return refetchState();
      }
      if (result.status !== 200 || !result.body.success || !result.body.data) {
        throw new Error((result.body && result.body.error && result.body.error.code) || 'FLOW_COMMAND_FAILED');
      }
      FLOW_UI.state = result.body.data.state;
      syncDraftFromState();
    })
    .catch(function (error) {
      FLOW_UI.error = error instanceof Error ? error.message : String(error);
    })
    .finally(function () {
      FLOW_UI.loading = false;
      renderFlow();
    });
}

function onSaveCurrentStep() {
  var form = FLOW_UI.state && FLOW_UI.state.currentStepForm;
  if (!form || form.mode !== 'CONDUCTION_STEP_FORM') return;

  var updates = (form.fields || []).map(function (field) {
    var spec = field.spec;
    var raw = FLOW_UI.draft[spec.fieldId];
    var value;
    if (spec.fieldType === 'NUMBER') {
      value = { valueType: 'NUMBER', value: Number(raw) };
    } else if (spec.fieldType === 'BOOLEAN') {
      value = { valueType: 'BOOLEAN', value: raw === true || raw === 'true' };
    } else {
      value = { valueType: 'STRING', value: String(raw || '') };
    }
    return { fieldId: spec.fieldId, value: value, isValid: true };
  });

  sendCommand('SAVE_CURRENT_STEP', { updates: updates });
}

function onActionClick(action) {
  if (!FLOW_UI.state) return;
  var allowed = Array.isArray(FLOW_UI.state.allowedActions) ? FLOW_UI.state.allowedActions : [];
  if (allowed.indexOf(action) === -1) return;

  if (action === 'SAVE_CURRENT_STEP') {
    onSaveCurrentStep();
    return;
  }
  sendCommand(action);
}

function bindFlowEvents() {
  var container = document.getElementById(FLOW_UI.containerId);
  if (!container) return;

  container.querySelectorAll('[data-action]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      onActionClick(btn.getAttribute('data-action'));
    });
  });

  container.querySelectorAll('[data-field-id]').forEach(function (input) {
    input.addEventListener('change', function () {
      var fieldId = input.getAttribute('data-field-id');
      if (!fieldId) return;
      if (input.getAttribute('data-type') === 'BOOLEAN') {
        FLOW_UI.draft[fieldId] = input.checked;
      } else {
        FLOW_UI.draft[fieldId] = input.value;
      }
    });
  });

  var refetchBtn = container.querySelector('[data-action="REFETCH_STATE"]');
  if (refetchBtn) {
    refetchBtn.addEventListener('click', function () {
      FLOW_UI.loading = true;
      renderFlow();
      refetchState()
        .catch(function () {
          FLOW_UI.error = 'FLOW_STATE_FETCH_FAILED';
        })
        .finally(function () {
          FLOW_UI.loading = false;
          renderFlow();
        });
    });
  }
}

function renderField(field) {
  var spec = field.spec;
  var value = FLOW_UI.draft[spec.fieldId];
  var label = t(spec.labelMessageKey);
  var help = t(spec.helpMessageKey);

  if (spec.fieldType === 'BOOLEAN') {
    return '<div class="form-group">' +
      '<label class="form-label">' + escapeHtml(label) + '</label>' +
      '<div><label><input type="checkbox" data-field-id="' + escapeHtml(spec.fieldId) + '" data-type="BOOLEAN" ' + (value ? 'checked' : '') + ' /> ' + escapeHtml(help) + '</label></div>' +
      '</div>';
  }

  var inputType = spec.fieldType === 'NUMBER' ? 'number' : 'text';
  return '<div class="form-group">' +
    '<label class="form-label" for="field-' + escapeHtml(spec.fieldId) + '">' + escapeHtml(label) + '</label>' +
    '<input class="form-input" id="field-' + escapeHtml(spec.fieldId) + '" type="' + inputType + '" data-field-id="' + escapeHtml(spec.fieldId) + '" data-type="' + escapeHtml(spec.fieldType) + '" value="' + escapeHtml(value == null ? '' : value) + '" />' +
    '<div class="text-muted">' + escapeHtml(help) + '</div>' +
    '</div>';
}

function renderCurrentStepForm() {
  var state = FLOW_UI.state;
  var form = state.currentStepForm;
  if (!form) return '<div class="history-empty">Contrato sem currentStepForm.</div>';

  if (form.mode === 'CONDUCTION_STEP_FORM') {
    var fieldsHtml = (form.fields || []).map(renderField).join('');
    return '<div class="admin-card">' +
      '<h3 class="admin-card-title">' + escapeHtml(t(form.stepTitleMessageKey)) + '</h3>' +
      '<p class="section-desc">' + escapeHtml(t(form.stepInstructionMessageKey)) + '</p>' +
      '<div class="form-grid">' + fieldsHtml + '</div>' +
      '</div>';
  }

  if (form.mode === 'REVIEW_PANEL') {
    var blocks = (form.readOnlyBlocks || []).map(function (b) {
      if (b.blockKind === 'STATIC_SECTION') return '<div class="text-muted">' + escapeHtml(t(b.sectionTitleMessageKey)) + '</div>';
      return '<div><strong>' + escapeHtml(t(b.labelMessageKey)) + ':</strong> ' + escapeHtml((b.valueDisplay && b.valueDisplay.text) || '') + '</div>';
    }).join('');
    return '<div class="admin-card"><h3 class="admin-card-title">' + escapeHtml(t(form.stepTitleMessageKey)) + '</h3><p class="section-desc">' + escapeHtml(t(form.stepInstructionMessageKey)) + '</p>' + blocks + '</div>';
  }

  var outputBlocks = (form.readOnlyBlocks || []).map(function (b) {
    if (b.blockKind === 'STATIC_SECTION') return '<div class="text-muted">' + escapeHtml(t(b.sectionTitleMessageKey)) + '</div>';
    return '<div><strong>' + escapeHtml(t(b.labelMessageKey)) + ':</strong> ' + escapeHtml((b.valueDisplay && b.valueDisplay.text) || '') + '</div>';
  }).join('');
  return '<div class="admin-card"><h3 class="admin-card-title">' + escapeHtml(t(form.stepTitleMessageKey)) + '</h3><p class="section-desc">' + escapeHtml(t(form.stepInstructionMessageKey)) + '</p>' + outputBlocks + '</div>';
}

function renderAllowedActions() {
  var state = FLOW_UI.state;
  var allowed = Array.isArray(state.allowedActions) ? state.allowedActions : [];
  var hardBlock = hasHardBlocking(state);

  if (!allowed.length) return '<div class="text-muted">Sem ações permitidas.</div>';

  return allowed.map(function (action) {
    var disabled = FLOW_UI.loading || hardBlock;
    var label = action;
    if (action === 'SAVE_CURRENT_STEP') label = 'Salvar etapa atual';
    if (action === 'ADVANCE_TO_NEXT_STEP') label = 'Avançar etapa';
    if (action === 'RETURN_TO_PREVIOUS_STEP') label = 'Voltar etapa';
    if (action === 'TRIGGER_REVIEW') label = 'Executar revisão';
    if (action === 'VIEW_OUTPUT') label = 'Visualizar saída';
    if (action === 'EDIT_CURRENT_STEP') label = 'Editar etapa';

    return '<button class="btn-execute" data-action="' + escapeHtml(action) + '" ' + (disabled ? 'disabled' : '') + '>' + escapeHtml(label) + '</button>';
  }).join('');
}

function renderBlockings() {
  var state = FLOW_UI.state;
  var blockings = Array.isArray(state.activeBlockings) ? state.activeBlockings : [];
  if (!blockings.length) return '<div class="text-muted">Sem bloqueios ativos.</div>';

  return '<div class="val-list">' + blockings.map(function (b) {
    return '<div class="val-item ' + (b.severity === 'HARD' ? 'sev-block' : 'sev-warning') + '">' +
      '<div class="val-item-header"><span class="val-code">' + escapeHtml(b.code) + '</span><span class="val-blocking">' + escapeHtml(b.severity) + '</span></div>' +
      '<div class="val-msg">' + escapeHtml(t(b.messageKey)) + '</div>' +
      '<div class="val-action">Ação corretiva: ' + escapeHtml(b.correctionAction || '') + '</div>' +
      '</div>';
  }).join('') + '</div>';
}

function renderFlow() {
  var container = document.getElementById(FLOW_UI.containerId);
  if (!container) return;

  if (FLOW_UI.loading && !FLOW_UI.state) {
    container.innerHTML = '<div class="history-loading">Carregando contrato operacional...</div>';
    return;
  }

  if (!FLOW_UI.state) {
    container.innerHTML = '<div class="history-empty">UI sem contrato operacional ativo.</div>';
    return;
  }

  var state = FLOW_UI.state;
  var hardBlock = hasHardBlocking(state);

  container.innerHTML =
    '<p class="section-title">Condução por Contrato (Incremento D)</p>' +
    '<p class="section-desc">UI renderiza exclusivamente currentStepForm, allowedActions, nextRequiredAction e activeBlockings.</p>' +
    (FLOW_UI.error ? '<div class="guidance-warning">' + escapeHtml(FLOW_UI.error) + '</div>' : '') +
    '<div class="admin-card">' +
      '<div><strong>processId:</strong> <code>' + escapeHtml(FLOW_UI.processId) + '</code></div>' +
      '<div><strong>currentStep:</strong> <code>' + escapeHtml(state.currentStep) + '</code></div>' +
      '<div><strong>revision:</strong> <code>' + escapeHtml(String(state.revision)) + '</code></div>' +
      '<div><strong>renderToken:</strong> <code>' + escapeHtml(state.renderToken) + '</code></div>' +
      '<div><strong>nextRequiredAction:</strong> <code>' + escapeHtml(state.nextRequiredAction) + '</code></div>' +
      (hardBlock ? '<div class="guidance-warning">Bloqueio HARD ativo: interação bloqueada até resolução.</div>' : '') +
    '</div>' +
    renderCurrentStepForm() +
    '<div class="admin-card"><h3 class="admin-card-title">Ações Permitidas</h3><div class="form-actions">' + renderAllowedActions() + '<button class="btn-secondary" data-action="REFETCH_STATE" ' + (FLOW_UI.loading ? 'disabled' : '') + '>Recarregar estado</button></div></div>' +
    '<div class="admin-card"><h3 class="admin-card-title">Bloqueios Ativos</h3>' + renderBlockings() + '</div>';

  bindFlowEvents();
}

function renderFormSection(containerId) {
  FLOW_UI.containerId = containerId;
  FLOW_UI.loading = true;
  renderFlow();

  ensureFlowSession()
    .catch(function (error) {
      FLOW_UI.error = error instanceof Error ? error.message : String(error);
    })
    .finally(function () {
      FLOW_UI.loading = false;
      renderFlow();
    });
}

window.renderFormSection = renderFormSection;
