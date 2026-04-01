'use strict';

function escapeComplianceHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function badgeClassForVerdict(verdict) {
  if (verdict === 'APPROVED') return 'compliance-badge-approved';
  if (verdict === 'APPROVED_WITH_WARNINGS') return 'compliance-badge-warning';
  if (verdict === 'NOT_APPROVED') return 'compliance-badge-not-approved';
  return 'compliance-badge-under-review';
}

function badgeClassForStatus(status) {
  if (status === 'PASSED') return 'compliance-chip-passed';
  if (status === 'FAILED') return 'compliance-chip-failed';
  if (status === 'BLOCKED') return 'compliance-chip-blocked';
  if (status === 'WARNING') return 'compliance-chip-warning';
  return 'compliance-chip-info';
}

function numberGuard(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function ComplianceHeader(report) {
  return (
    '<section class="compliance-panel">' +
      '<div class="compliance-header-top">' +
        '<span class="compliance-verdict ' + badgeClassForVerdict(report.verdict) + '">' +
          escapeComplianceHtml(report.verdict) +
        '</span>' +
        '<span class="compliance-overall-score">Score Geral: ' + numberGuard(report.score.overallScore) + '</span>' +
      '</div>' +
      '<div class="compliance-summary">' + escapeComplianceHtml(report.summary || '') + '</div>' +
      '<div class="compliance-meta">Gerado em: ' + escapeComplianceHtml(report.generatedAt || '-') + '</div>' +
    '</section>'
  );
}

function ComplianceScoreCard(report) {
  var score = report.score || {};
  var factors = Array.isArray(score.factors) ? score.factors : [];
  var factorsHtml = factors.length
    ? factors.map(function(factor) {
      var impact = numberGuard(factor.impact);
      var signalClass = impact >= 0 ? 'compliance-factor-positive' : 'compliance-factor-negative';
      var signalText = impact >= 0 ? '+' + impact : String(impact);
      return (
        '<li class="compliance-factor-item">' +
          '<div class="compliance-factor-title">' + escapeComplianceHtml(factor.name || '') + '</div>' +
          '<div class="compliance-factor-impact ' + signalClass + '">' + escapeComplianceHtml(signalText) + '</div>' +
          '<div class="compliance-factor-description">' + escapeComplianceHtml(factor.description || '') + '</div>' +
        '</li>'
      );
    }).join('')
    : '<li class="compliance-empty-line">Sem fatores informados no relatório.</li>';

  return (
    '<section class="compliance-panel">' +
      '<h3 class="admin-card-title">ComplianceScoreCard</h3>' +
      '<div class="compliance-score-grid">' +
        '<div><strong>overallScore</strong><span>' + numberGuard(score.overallScore) + '</span></div>' +
        '<div><strong>flowIntegrity</strong><span>' + numberGuard(score.flowIntegrity) + '</span></div>' +
        '<div><strong>structuralConsistency</strong><span>' + numberGuard(score.structuralConsistency) + '</span></div>' +
        '<div><strong>interModuleCoherence</strong><span>' + numberGuard(score.interModuleCoherence) + '</span></div>' +
        '<div><strong>traceability</strong><span>' + numberGuard(score.traceability) + '</span></div>' +
        '<div><strong>criticalIssues</strong><span>' + numberGuard(score.criticalIssues) + '</span></div>' +
        '<div><strong>warnings</strong><span>' + numberGuard(score.warnings) + '</span></div>' +
      '</div>' +
      '<p class="compliance-explanation">' + escapeComplianceHtml(score.explanation || '') + '</p>' +
      '<ul class="compliance-factor-list">' + factorsHtml + '</ul>' +
    '</section>'
  );
}

function ComplianceValidationList(report) {
  var validations = Array.isArray(report.validations) ? report.validations : [];
  var items = validations.length
    ? validations.map(function(item) {
      return (
        '<li class="compliance-list-item">' +
          '<div class="compliance-list-title">' + escapeComplianceHtml(item.name || '') + '</div>' +
          '<div class="compliance-list-row">' +
            '<span class="compliance-chip ' + badgeClassForStatus(item.status) + '">' + escapeComplianceHtml(item.status || 'INFO') + '</span>' +
            '<span class="compliance-chip ' + badgeClassForStatus(item.severity) + '">' + escapeComplianceHtml(item.severity || 'INFO') + '</span>' +
          '</div>' +
          '<div class="compliance-list-description">' + escapeComplianceHtml(item.description || '') + '</div>' +
        '</li>'
      );
    }).join('')
    : '<li class="compliance-empty-line">Nenhuma validação consolidada no relatório.</li>';

  return (
    '<section class="compliance-panel">' +
      '<h3 class="admin-card-title">ComplianceValidationList</h3>' +
      '<ul class="compliance-list">' + items + '</ul>' +
    '</section>'
  );
}

function ComplianceBlockingList(report) {
  var blockings = Array.isArray(report.blockings) ? report.blockings : [];
  var items = blockings.length
    ? blockings.map(function(item) {
      return (
        '<li class="compliance-list-item">' +
          '<div class="compliance-list-title">' + escapeComplianceHtml(item.name || '') + '</div>' +
          '<div class="compliance-list-row">' +
            '<span class="compliance-chip compliance-chip-blocked">' + escapeComplianceHtml(item.blockType || '-') + '</span>' +
            '<span class="compliance-chip compliance-chip-info">' + escapeComplianceHtml(item.preventedAction || '-') + '</span>' +
          '</div>' +
          '<div class="compliance-list-description">' + escapeComplianceHtml(item.description || '') + '</div>' +
        '</li>'
      );
    }).join('')
    : '<li class="compliance-empty-line">Nenhum bloqueio registrado no relatório.</li>';

  return (
    '<section class="compliance-panel">' +
      '<h3 class="admin-card-title">ComplianceBlockingList</h3>' +
      '<ul class="compliance-list">' + items + '</ul>' +
    '</section>'
  );
}

function ComplianceReactionList(report) {
  var reactions = Array.isArray(report.automaticReactions) ? report.automaticReactions : [];

  var items = reactions.length
    ? reactions.map(function(item) {
      return (
        '<li class="compliance-list-item">' +
          '<div class="compliance-list-title">' + escapeComplianceHtml(item.title || 'Reação automática') + '</div>' +
          '<div class="compliance-list-row">' +
            '<span class="compliance-chip compliance-chip-warning">' + escapeComplianceHtml(item.reactionType || '-') + '</span>' +
          '</div>' +
          '<div class="compliance-list-description">' + escapeComplianceHtml(item.summary || '') + '</div>' +
          '<div class="compliance-meta">Referência: ' + escapeComplianceHtml(item.id || '-') + '</div>' +
        '</li>'
      );
    }).join('')
    : '<li class="compliance-empty-line">Nenhuma reação automática registrada no relatório deste processo.</li>';

  return (
    '<section class="compliance-panel">' +
      '<h3 class="admin-card-title">ComplianceReactionList</h3>' +
      '<ul class="compliance-list">' + items + '</ul>' +
    '</section>'
  );
}

function ComplianceTimeline(report) {
  var timeline = Array.isArray(report.timeline) ? report.timeline : [];
  var items = timeline.length
    ? timeline.map(function(item) {
      return (
        '<li class="compliance-timeline-item">' +
          '<div class="compliance-timeline-head">' +
            '<span class="compliance-chip compliance-chip-info">' + escapeComplianceHtml(item.actionType || '-') + '</span>' +
            '<span class="compliance-meta">' + escapeComplianceHtml(item.timestamp || '-') + '</span>' +
          '</div>' +
          '<div class="compliance-list-description">' + escapeComplianceHtml(item.description || '') + '</div>' +
          '<div class="compliance-meta">' +
            'módulo: ' + escapeComplianceHtml(item.module || '-') +
            ' · etapa: ' + escapeComplianceHtml(item.step || '-') +
            ' · rev antes: ' + escapeComplianceHtml(item.revisionBefore == null ? '-' : String(item.revisionBefore)) +
            ' · rev depois: ' + escapeComplianceHtml(item.revisionAfter == null ? '-' : String(item.revisionAfter)) +
          '</div>' +
        '</li>'
      );
    }).join('')
    : '<li class="compliance-empty-line">Linha do tempo sem eventos para o processo informado.</li>';

  return (
    '<section class="compliance-panel">' +
      '<h3 class="admin-card-title">ComplianceTimeline</h3>' +
      '<ul class="compliance-timeline">' + items + '</ul>' +
    '</section>'
  );
}

function ComplianceDocumentsPanel(report) {
  var docs = Array.isArray(report.documents) ? report.documents : [];
  if (docs.length === 0) {
    return (
      '<section class="compliance-panel">' +
        '<h3 class="admin-card-title">ComplianceDocumentsPanel</h3>' +
        '<p class="compliance-empty-line">Vínculos documentais ainda não integrados nesta etapa.</p>' +
      '</section>'
    );
  }

  var items = docs.map(function(doc) {
    return (
      '<li class="compliance-list-item">' +
        '<div class="compliance-list-title">' + escapeComplianceHtml(doc.documentType || '-') + ' · ' + escapeComplianceHtml(doc.documentId || '-') + '</div>' +
        '<div class="compliance-meta">gerado em ' + escapeComplianceHtml(doc.generatedAt || '-') + ' · revisão base ' + escapeComplianceHtml(String(doc.basedOnRevision || '-')) + '</div>' +
      '</li>'
    );
  }).join('');

  return (
    '<section class="compliance-panel">' +
      '<h3 class="admin-card-title">ComplianceDocumentsPanel</h3>' +
      '<ul class="compliance-list">' + items + '</ul>' +
    '</section>'
  );
}

function renderComplianceReport(report) {
  return (
    ComplianceHeader(report) +
    ComplianceScoreCard(report) +
    ComplianceValidationList(report) +
    ComplianceBlockingList(report) +
    ComplianceReactionList(report) +
    ComplianceTimeline(report) +
    ComplianceDocumentsPanel(report)
  );
}

window.ComplianceUI = {
  renderComplianceReport: renderComplianceReport,
};
