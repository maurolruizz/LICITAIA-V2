"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderComplianceDossierHtml = renderComplianceDossierHtml;
function esc(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
/**
 * Renderização institucional do dossiê (imprimível em HTML).
 * Não cria lógica nova de conformidade; apenas apresenta o DTO pronto do backend.
 */
function renderComplianceDossierHtml(dossier) {
    const val = dossier.keyValidations.length
        ? dossier.keyValidations.map((item) => `<li><strong>${esc(item.name)}</strong> [${esc(item.status)}] — ${esc(item.description)}</li>`).join('')
        : '<li>Sem validações principais registradas.</li>';
    const blocking = dossier.keyBlockings.length
        ? dossier.keyBlockings.map((item) => `<li><strong>${esc(item.name)}</strong> (${esc(item.blockType)}) — ${esc(item.description)}</li>`).join('')
        : '<li>Sem bloqueios principais registrados.</li>';
    const reaction = dossier.keyAutomaticReactions.length
        ? dossier.keyAutomaticReactions.map((item) => `<li><strong>${esc(item.title)}</strong> [${esc(item.reactionType)}] — ${esc(item.summary)}</li>`).join('')
        : '<li>Sem reações automáticas principais registradas.</li>';
    const timeline = dossier.timelineHighlights.length
        ? dossier.timelineHighlights.map((item) => `<li><strong>${esc(item.timestamp)}</strong> — ${esc(item.actionType)} — ${esc(item.description)}</li>`).join('')
        : '<li>Sem timeline resumida disponível.</li>';
    const docs = dossier.documents.length
        ? dossier.documents.map((item) => `<li><strong>${esc(item.documentType)}</strong> — ${esc(item.documentId)}</li>`).join('')
        : `<li>${esc(dossier.documentSupportNote ?? 'Vínculos documentais ainda não integrados nesta etapa.')}</li>`;
    return `
<section class="compliance-dossier">
  <h2>Dossiê Institucional de Conformidade</h2>
  <p><strong>Processo:</strong> ${esc(dossier.processId)}</p>
  <p><strong>Tenant:</strong> ${esc(dossier.tenantId)}</p>
  <p><strong>Gerado em:</strong> ${esc(dossier.generatedAt)}</p>
  <p><strong>Veredito:</strong> ${esc(dossier.verdict)}</p>
  <p><strong>Resumo:</strong> ${esc(dossier.summary)}</p>
  <h3>Score Explicável</h3>
  <p><strong>Geral:</strong> ${dossier.score.overallScore}</p>
  <p>${esc(dossier.score.breakdown.explanation)}</p>
  <h3>Validações principais</h3><ul>${val}</ul>
  <h3>Bloqueios principais</h3><ul>${blocking}</ul>
  <h3>Reações automáticas</h3><ul>${reaction}</ul>
  <h3>Timeline resumida</h3><ul>${timeline}</ul>
  <h3>Documentos</h3><ul>${docs}</ul>
</section>`;
}
