/**
 * Tipos do domínio TR (Termo de Referência).
 * Payload oficial do módulo TR.
 */

export interface TrPayload {
  objectDescription: string;
  contractingPurpose: string;
  technicalRequirements: string;
  executionConditions: string;
  acceptanceCriteria: string;
  requestingDepartment: string;
  responsibleAuthor: string;
  referenceDate: string;
  additionalNotes?: string;
}
