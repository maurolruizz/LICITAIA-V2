"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchComplianceDossier = fetchComplianceDossier;
async function fetchComplianceDossier(params) {
    const response = await fetch(`${params.baseUrl}/api/process/${encodeURIComponent(params.processId)}/compliance-dossier`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${params.accessToken}`,
        },
    });
    const payload = (await response.json());
    if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? 'Falha ao consultar dossiê de conformidade.');
    }
    return payload.data;
}
