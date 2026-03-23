/**
 * Tipos do domínio Pricing (Precificação).
 * Payload oficial do módulo Pricing.
 */

export interface PricingPayload {
  pricingSourceDescription: string;
  referenceItemsDescription: string;
  estimatedUnitValue: number;
  estimatedTotalValue: number;
  pricingJustification: string;
  requestingDepartment: string;
  responsibleAnalyst: string;
  referenceDate: string;
  additionalNotes?: string;
}
