/**
 * ETAPA F — Helper de renderização semântica de itens de validação.
 *
 * buildValidationItemHtml(v)
 *   Constrói HTML de um cartão semântico para um ValidationItemContract.
 *   Consome os campos já entregues pelo backend: code, message, severity, details.moduleId.
 *   Não inventa semântica nova. Não duplica lógica do motor.
 *
 * buildValidationListHtml(items)
 *   Encapsula múltiplos cartões em uma lista.
 *
 * buildSuccessWithWarningsBanner(count)
 *   Framing explícito para SUCCESS com apontamentos não bloqueantes.
 */

'use strict';

var VALIDATION_SEVERITY_MAP = {
  INFO:    { cls: 'sev-info',    icon: 'i',   label: 'INFO',     blocking: false },
  WARNING: { cls: 'sev-warning', icon: '\u26a0', label: 'WARNING',  blocking: false },
  ERROR:   { cls: 'sev-error',   icon: '\u2715', label: 'ERROR',    blocking: true  },
  BLOCK:   { cls: 'sev-block',   icon: '\u26d4', label: 'BLOQUEIO', blocking: true  },
};

var VALIDATION_ACTION_MAP = {
  INFO:    'Informa\u00e7\u00e3o registrada \u2014 nenhuma a\u00e7\u00e3o imediata necess\u00e1ria.',
  WARNING: 'Apontamento n\u00e3o bloqueante \u2014 revisar e fortalecer o campo indicado antes do avan\u00e7o.',
  ERROR:   'Erro registrado \u2014 revisar e corrigir antes de prosseguir.',
  BLOCK:   'Bloqueio \u2014 corre\u00e7\u00e3o obrigat\u00f3ria antes de continuar o fluxo.',
};

/**
 * @param {Object} v  ValidationItemContract: { code, message, severity, field?, details? }
 * @returns {string}  HTML do cartão semântico
 */
function buildValidationItemHtml(v) {
  if (!v || typeof v !== 'object') return '';

  var rawSeverity = typeof v.severity === 'string' ? v.severity.toUpperCase() : 'INFO';
  var sev    = VALIDATION_SEVERITY_MAP[rawSeverity] || VALIDATION_SEVERITY_MAP['INFO'];
  var action = VALIDATION_ACTION_MAP[rawSeverity] || VALIDATION_ACTION_MAP['INFO'];

  var moduleId = (v.details && typeof v.details.moduleId === 'string' && v.details.moduleId)
    ? v.details.moduleId : null;

  var blockingLabel = sev.blocking ? 'bloqueia' : 'n\u00e3o bloqueia';

  var codeStr    = typeof v.code    === 'string' ? v.code    : '';
  var messageStr = typeof v.message === 'string' ? v.message : '';

  function _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  return (
    '<div class="val-item ' + sev.cls + '">' +
      '<div class="val-item-header">' +
        '<span class="val-sev-badge ' + sev.cls + '">' + sev.icon + ' ' + sev.label + '</span>' +
        '<span class="val-code">' + _esc(codeStr) + '</span>' +
        (moduleId ? '<span class="val-module">m\u00f3dulo: ' + _esc(moduleId) + '</span>' : '') +
        '<span class="val-blocking">' + blockingLabel + '</span>' +
      '</div>' +
      (messageStr ? '<div class="val-msg">' + _esc(messageStr) + '</div>' : '') +
      '<div class="val-action">' + _esc(action) + '</div>' +
    '</div>'
  );
}

/**
 * @param {Array} items  Array de ValidationItemContract
 * @returns {string}     HTML da lista
 */
function buildValidationListHtml(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return '<span style="font-size:0.8125rem;color:var(--gray-400)">nenhum c\u00f3digo emitido</span>';
  }
  return '<div class="val-list">' + items.map(buildValidationItemHtml).join('') + '</div>';
}

/**
 * @param {number} count  Quantidade de warnings não bloqueantes
 * @returns {string}      HTML do banner de enquadramento
 */
function buildSuccessWithWarningsBanner(count) {
  return (
    '<div class="success-warn-banner">' +
      '<div class="success-warn-icon">\u26a0\ufe0f</div>' +
      '<div class="success-warn-text">' +
        '<div class="success-warn-title">Resultado: sucesso com apontamentos n\u00e3o bloqueantes (' + count + ')</div>' +
        '<div class="success-warn-detail">' +
          'O pipeline foi conclu\u00eddo com sucesso. O motor registrou apontamentos que <strong>n\u00e3o impedem a continuidade</strong>, ' +
          'mas devem ser revisados e fortalecidos antes da formaliza\u00e7\u00e3o do processo.' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

/**
 * FASE 41 — Helper de resumo operacional de execução.
 *
 * Produz leitura humana do resultado de uma execução a partir
 * EXCLUSIVAMENTE de: finalStatus, halted, haltedBy, validationCodes,
 * modulesExecuted.
 *
 * Regra crítica:
 *   - Nenhuma lógica do motor.
 *   - Nenhuma reinterpretação de regras.
 *   - Apenas leitura defensiva de dados persistidos.
 *   - Se os dados forem insuficientes para classificar, usa categoria genérica.
 */

/**
 * @param {Object} execution  Objeto com finalStatus, halted, haltedBy?,
 *                            validationCodes[], modulesExecuted[]
 * @returns {{ label: string, detail: string, type: string, icon: string }}
 */
function buildExecutionSummary(execution) {
  var halted   = Boolean(execution && execution.halted);
  var haltedBy = (execution && typeof execution.haltedBy === 'string' && execution.haltedBy)
    ? execution.haltedBy : null;
  var codes    = (execution && Array.isArray(execution.validationCodes))
    ? execution.validationCodes : [];

  if (halted) {
    var hasMismatch = haltedBy
      ? (haltedBy.indexOf('MISMATCH') !== -1 || haltedBy.indexOf('CROSS') !== -1)
      : codes.some(function(c) {
          return typeof c === 'string' && c.indexOf('MISMATCH') !== -1;
        });

    var hasStructuralBlock = haltedBy
      ? (haltedBy.indexOf('BLOCK') !== -1 || haltedBy.indexOf('STRUCTURAL') !== -1)
      : codes.some(function(c) {
          return typeof c === 'string' &&
            (c.indexOf('BLOCK') !== -1 || c.indexOf('STRUCTURAL') !== -1);
        });

    if (hasMismatch) {
      return {
        label:  'Execução interrompida por validação cruzada',
        detail: 'O motor detectou inconsistência entre elementos do processo ' +
                'e interrompeu a execução preventivamente.',
        type:   'halted-cross',
        icon:   '⛔',
      };
    }

    if (hasStructuralBlock) {
      return {
        label:  'Execução interrompida por bloqueio estrutural',
        detail: 'Um ou mais elementos estruturais obrigatórios estão ' +
                'ausentes, inválidos ou incompatíveis com o regime jurídico.',
        type:   'halted-block',
        icon:   '🚫',
      };
    }

    return {
      label:  'Execução interrompida por validação impeditiva',
      detail: 'O motor detectou condição impeditiva e interrompeu o ' +
              'pipeline antes da conclusão.',
      type:   'halted',
      icon:   '⛔',
    };
  }

  var hasWarning = codes.some(function(c) {
    return typeof c === 'string' &&
      (c.indexOf('WARN') !== -1 || c.indexOf('ALERT') !== -1 || c.indexOf('NOTICE') !== -1);
  });

  if (hasWarning) {
    return {
      label:  'Execução concluída com alertas não bloqueantes',
      detail: 'O processo foi concluído com sucesso. O motor registrou alertas ' +
              'que podem requerer atenção, mas não são impeditivos.',
      type:   'success-warning',
      icon:   '⚠️',
    };
  }

  if (codes.length > 0) {
    return {
      label:  'Execução concluída com observações registradas',
      detail: 'O processo foi concluído com sucesso. O motor registrou ' +
              'códigos de validação não impeditivos.',
      type:   'success-codes',
      icon:   '✅',
    };
  }

  return {
    label:  'Execução concluída com sucesso',
    detail: 'O processo foi validado integralmente pelo motor DECYON e o ' +
            'pipeline foi concluído sem impedimentos.',
    type:   'success',
    icon:   '✅',
  };
}
