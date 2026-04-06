/**
 * Envelopes HTTP alinhados ao backend Express (success/data/meta e error).
 * Leitura defensiva — não assume campos além do que o contrato oficial expõe.
 */

export type ApiSuccessEnvelope<T> = {
  success: true;
  data: T;
  meta?: unknown;
};

export type ApiErrorEnvelope = {
  success: false;
  error: { code: string; message: string };
  meta?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isApiSuccessEnvelope(body: unknown): body is ApiSuccessEnvelope<unknown> {
  return isRecord(body) && body.success === true && "data" in body;
}

export function isApiErrorBody(body: unknown): body is ApiErrorEnvelope {
  if (!isRecord(body) || body.success !== false) return false;
  const err = body.error;
  if (!isRecord(err)) return false;
  return typeof err.message === "string";
}
