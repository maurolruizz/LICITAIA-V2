import type { ComplianceReport } from './compliance.types';

export async function fetchComplianceReport(params: {
  baseUrl: string;
  processId: string;
  accessToken: string;
}): Promise<ComplianceReport> {
  const response = await fetch(
    `${params.baseUrl}/api/process/${encodeURIComponent(params.processId)}/compliance-report`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
      },
    },
  );

  const payload = (await response.json()) as {
    success?: boolean;
    data?: ComplianceReport;
    error?: { message?: string };
  };

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error?.message ?? 'Falha ao consultar relatório de conformidade.');
  }

  return payload.data;
}
