"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchComplianceReport = fetchComplianceReport;
async function fetchComplianceReport(params) {
    const response = await fetch(`${params.baseUrl}/api/process/${encodeURIComponent(params.processId)}/compliance-report`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${params.accessToken}`,
        },
    });
    const payload = (await response.json());
    if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? 'Falha ao consultar relatório de conformidade.');
    }
    return payload.data;
}
