'use strict';

function escDossier(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderDossierHtml(dossier) {
  var valHtml = (dossier.keyValidations || []).map(function(item) {
    return '<li><strong>' + escDossier(item.name) + '</strong> [' + escDossier(item.status) + '] — ' + escDossier(item.description) + '</li>';
  }).join('') || '<li>Sem validações principais registradas.</li>';

  var blockHtml = (dossier.keyBlockings || []).map(function(item) {
    return '<li><strong>' + escDossier(item.name) + '</strong> (' + escDossier(item.blockType) + ') — ' + escDossier(item.description) + '</li>';
  }).join('') || '<li>Sem bloqueios principais registrados.</li>';

  var reactionHtml = (dossier.keyAutomaticReactions || []).map(function(item) {
    return '<li><strong>' + escDossier(item.title) + '</strong> [' + escDossier(item.reactionType) + '] — ' + escDossier(item.summary) + '</li>';
  }).join('') || '<li>Sem reações automáticas principais registradas.</li>';

  var timelineHtml = (dossier.timelineHighlights || []).map(function(item) {
    return '<li><strong>' + escDossier(item.timestamp) + '</strong> — ' + escDossier(item.actionType) + ' — ' + escDossier(item.description) + '</li>';
  }).join('') || '<li>Sem eventos cronológicos resumidos.</li>';

  var docsHtml = (dossier.documents || []).map(function(item) {
    return '<li><strong>' + escDossier(item.documentType) + '</strong> — ' + escDossier(item.documentId) + '</li>';
  }).join('');
  if (!docsHtml) {
    docsHtml = '<li>' + escDossier(dossier.documentSupportNote || 'Vínculos documentais ainda não integrados nesta etapa.') + '</li>';
  }

  var evidHtml = (dossier.evidenceReferences || []).slice(0, 30).map(function(item) {
    return '<li><strong>' + escDossier(item.type) + '</strong> — ' + escDossier(item.title) + ' · refs: ' + escDossier((item.sourceRefs || []).join(', ')) + '</li>';
  }).join('') || '<li>Sem referências de evidência disponíveis.</li>';

  return (
    '<article class="admin-card dossier-print-area">' +
      '<h2 class="section-title">Dossiê Exportável de Conformidade</h2>' +
      '<p><strong>Processo:</strong> ' + escDossier(dossier.processId || '-') + '</p>' +
      '<p><strong>Tenant:</strong> ' + escDossier(dossier.tenantId || '-') + '</p>' +
      '<p><strong>Gerado em:</strong> ' + escDossier(dossier.generatedAt || '-') + '</p>' +
      '<p><strong>Veredito:</strong> ' + escDossier(dossier.verdict || '-') + '</p>' +
      '<p><strong>Resumo:</strong> ' + escDossier(dossier.summary || '-') + '</p>' +
      '<hr />' +
      '<h3>Score Explicável</h3>' +
      '<p><strong>Score geral:</strong> ' + Number(dossier.score && dossier.score.overallScore || 0) + '</p>' +
      '<p>' + escDossier(dossier.score && dossier.score.breakdown && dossier.score.breakdown.explanation || '-') + '</p>' +
      '<h3>Validações Principais</h3><ul>' + valHtml + '</ul>' +
      '<h3>Bloqueios Principais</h3><ul>' + blockHtml + '</ul>' +
      '<h3>Reações Automáticas</h3><ul>' + reactionHtml + '</ul>' +
      '<h3>Timeline Resumida</h3><ul>' + timelineHtml + '</ul>' +
      '<h3>Documentos</h3><ul>' + docsHtml + '</ul>' +
      '<h3>Base de Evidência</h3><ul>' + evidHtml + '</ul>' +
    '</article>'
  );
}

window.DossierUI = {
  renderDossierHtml: renderDossierHtml,
};
