/**
 * Tipos do domínio ETP (Estudo Técnico Preliminar).
 * Payload oficial do módulo ETP.
 */

export interface EtpPayload {
  needDescription: string;
  expectedResults: string;
  solutionSummary: string;
  technicalJustification: string;
  requestingDepartment: string;
  responsibleAnalyst: string;
  analysisDate: string;
  additionalNotes?: string;
}
