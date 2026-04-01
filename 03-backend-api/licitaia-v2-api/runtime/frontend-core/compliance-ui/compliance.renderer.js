"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderComplianceReportHtml = renderComplianceReportHtml;
function esc(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function verdictClass(verdict) {
    if (verdict === 'APPROVED')
        return 'approved';
    if (verdict === 'APPROVED_WITH_WARNINGS')
        return 'approved-warning';
    if (verdict === 'NOT_APPROVED')
        return 'not-approved';
    return 'under-review';
}
/**
 * Renderização institucional mínima da Prova de Conformidade para o frontend principal.
 * Não recalcula score/verdict/evidências; apenas materializa o payload canônico do backend.
 */
function renderComplianceReportHtml(report) {
    const factors = report.score.factors
        .map((f) => `<li><strong>${esc(f.name)}</strong> (${f.impact >= 0 ? '+' : ''}${f.impact}) — ${esc(f.description)}</li>`)
        .join('');
    const validations = report.validations.length
        ? report.validations
            .map((v) => `<li><strong>${esc(v.name)}</strong> [${esc(v.status)} / ${esc(v.severity)}] — ${esc(v.description)}</li>`)
            .join('')
        : '<li>Nenhuma validação consolidada.</li>';
    const blockings = report.blockings.length
        ? report.blockings
            .map((b) => `<li><strong>${esc(b.name)}</strong> (${esc(b.blockType)}) — ${esc(b.preventedAction)}. ${esc(b.description)}</li>`)
            .join('')
        : '<li>Nenhum bloqueio registrado.</li>';
    const reactions = report.automaticReactions.length
        ? report.automaticReactions
            .map((r) => `<li><strong>${esc(r.title)}</strong> [${esc(r.reactionType)}] — ${esc(r.summary)}</li>`)
            .join('')
        : '<li>Nenhuma reação automática registrada.</li>';
    const timeline = report.timeline.length
        ? report.timeline
            .map((t) => `<li><strong>${esc(t.timestamp)}</strong> — ${esc(t.actionType)} — ${esc(t.description)}</li>`)
            .join('')
        : '<li>Linha do tempo sem eventos.</li>';
    const documents = report.documents.length
        ? report.documents
            .map((d) => `<li><strong>${esc(d.documentType)}</strong> — ${esc(d.documentId)} (rev ${d.basedOnRevision})</li>`)
            .join('')
        : '<li>Vínculos documentais ainda não integrados nesta etapa.</li>';
    return `
<section class="compliance-proof">
  <header class="compliance-proof-header ${verdictClass(report.verdict)}">
    <h2>Prova de Conformidade</h2>
    <p>Veredito: <strong>${esc(report.verdict)}</strong> · Score geral: <strong>${report.score.overallScore}</strong></p>
    <p>${esc(report.summary)}</p>
    <p>Gerado em: ${esc(report.generatedAt)}</p>
  </header>
  <section>
    <h3>Score</h3>
    <ul>
      <li>flowIntegrity: ${report.score.flowIntegrity}</li>
      <li>structuralConsistency: ${report.score.structuralConsistency}</li>
      <li>interModuleCoherence: ${report.score.interModuleCoherence}</li>
      <li>traceability: ${report.score.traceability}</li>
      <li>criticalIssues: ${report.score.criticalIssues}</li>
      <li>warnings: ${report.score.warnings}</li>
    </ul>
    <p>${esc(report.score.explanation)}</p>
    <ul>${factors}</ul>
  </section>
  <section><h3>Validações</h3><ul>${validations}</ul></section>
  <section><h3>Bloqueios</h3><ul>${blockings}</ul></section>
  <section><h3>Reações automáticas</h3><ul>${reactions}</ul></section>
  <section><h3>Timeline</h3><ul>${timeline}</ul></section>
  <section><h3>Suporte documental</h3><ul>${documents}</ul></section>
</section>`;
}
