/**
 * Tipos do domínio DFD (Demanda de Fornecimento / Documento de Formalização).
 * Payload oficial do módulo DFD.
 */

export interface DfdPayload {
  demandDescription: string;
  hiringJustification: string;
  administrativeObjective: string;
  requestingDepartment: string;
  requesterName: string;
  requestDate: string;
  additionalNotes?: string;
}
