export interface FlowSessionRecord {
  id: string;
  tenantId: string;
  processId: string;
  snapshot: Record<string, unknown>;
  revision: number;
  renderToken: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FlowSessionRevisionRecord {
  id: string;
  tenantId: string;
  flowSessionId: string;
  processId: string;
  revision: number;
  renderToken: string;
  snapshot: Record<string, unknown>;
  action: string;
  actorUserId: string | null;
  createdAt: string;
}

export interface FlowCommandGuardInput {
  expectedRevision: number;
  expectedRenderToken: string;
}

export type FlowFieldValue =
  | { valueType: 'STRING'; value: string }
  | { valueType: 'NUMBER'; value: number }
  | { valueType: 'BOOLEAN'; value: boolean };

export interface FlowFieldUpdate {
  fieldId: string;
  value: FlowFieldValue;
  isValid: boolean | null;
}
