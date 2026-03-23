import { AI_ASSISTIVE_PROVIDER_ID } from './ai-assistive.config';

export interface AiAssistiveProviderAdapter {
  providerId: string;
  refineText(input: string): string;
}

function normalizeControlledText(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

export const internalControlledRefinerAdapter: AiAssistiveProviderAdapter = {
  providerId: AI_ASSISTIVE_PROVIDER_ID,
  refineText(input: string): string {
    return normalizeControlledText(input);
  },
};
