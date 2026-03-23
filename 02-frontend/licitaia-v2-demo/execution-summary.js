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

'use strict';

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
