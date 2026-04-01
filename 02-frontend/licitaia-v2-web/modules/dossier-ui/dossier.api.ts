import type { ComplianceDossier } from './dossier.types';

export async function fetchComplianceDossier(params: {
  baseUrl: string;
  processId: string;
  accessToken: string;
}): Promise<ComplianceDossier> {
  const response = await fetch(
    `${params.baseUrl}/api/process/${encodeURIComponent(params.processId)}/compliance-dossier`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
      },
    },
  );

  const payload = (await response.json()) as {
    success?: boolean;
    data?: ComplianceDossier;
    error?: { message?: string };
  };

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error?.message ?? 'Falha ao consultar dossiê de conformidade.');
  }

  return payload.data;
}
