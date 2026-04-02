const runtime = require('../../runtime/frontend-core/orchestrator/flow-controller.js') as {
  FlowController: new (processId: string, seedState?: unknown) => {
    getState: () => unknown;
    saveCurrentStep: (
      guard: { expectedRevision: number; expectedRenderToken: string },
      updates: ReadonlyArray<{ fieldId: string; value: unknown; isValid: boolean | null }>
    ) => unknown;
    advanceStep: (guard: { expectedRevision: number; expectedRenderToken: string }) => unknown;
    returnToPreviousStep: (guard: { expectedRevision: number; expectedRenderToken: string }) => unknown;
  };
};
const { FlowController } = runtime;

function fail(message: string): never {
  throw new Error(`[ETAPA_C_FREEZE_FAIL] ${message}`);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function guardFrom(state: Record<string, unknown>) {
  const expectedRevision = state['revision'];
  const expectedRenderToken = state['renderToken'];
  if (typeof expectedRevision !== 'number' || typeof expectedRenderToken !== 'string') {
    fail('Estado invalido para criar guard de comando.');
  }
  return { expectedRevision, expectedRenderToken };
}

function getRegimeFieldValue(state: Record<string, unknown>, fieldId: string): unknown {
  const form = asRecord(state['currentStepForm']);
  const fields = form['fields'];
  if (!Array.isArray(fields)) return undefined;
  const target = fields.find((entry) => {
    const e = asRecord(entry);
    const spec = asRecord(e['spec']);
    return spec['fieldId'] === fieldId;
  });
  const targetRec = asRecord(target);
  const fieldState = asRecord(targetRec['state']);
  const value = asRecord(fieldState['value']);
  return value['value'];
}

function buildEtapaCProcessId(): string {
  return `ETAPA-C-FREEZE-${Date.now()}`;
}

function main(): void {
  const processId = buildEtapaCProcessId();
  const controller = new FlowController(processId);

  // INIT -> CONTEXT
  let state = asRecord(
    controller.saveCurrentStep(guardFrom(asRecord(controller.getState())), [
      { fieldId: 'INIT_CONFIRM', value: { valueType: 'BOOLEAN', value: true }, isValid: true },
    ])
  );
  state = asRecord(controller.advanceStep(guardFrom(state)));

  // CONTEXT -> REGIME
  state = asRecord(
    controller.saveCurrentStep(guardFrom(state), [
      { fieldId: 'CTX_TENANT_SLUG', value: { valueType: 'STRING', value: 'tenant-etapa-c' }, isValid: true },
      { fieldId: 'CTX_OPERATOR_NOTE', value: { valueType: 'STRING', value: 'freeze-check' }, isValid: true },
    ])
  );
  state = asRecord(controller.advanceStep(guardFrom(state)));

  // REGIME -> DFD (consolida regime)
  state = asRecord(
    controller.saveCurrentStep(guardFrom(state), [
      { fieldId: 'REG_LEGAL_REGIME', value: { valueType: 'STRING', value: 'LICITACAO' }, isValid: true },
      { fieldId: 'REG_PROCUREMENT_STRATEGY', value: { valueType: 'STRING', value: 'PREGAO' }, isValid: true },
    ])
  );
  state = asRecord(controller.advanceStep(guardFrom(state)));
  if (state['currentStep'] !== 'DFD') {
    fail('Fluxo nao consolidou regime para etapa posterior.');
  }

  // Retorna para REGIME para simular tentativa hostil de mutacao tardia.
  state = asRecord(controller.returnToPreviousStep(guardFrom(state)));
  if (state['currentStep'] !== 'REGIME') {
    fail('Fluxo nao retornou para REGIME.');
  }

  const beforeAttempt = asRecord(controller.getState());
  const beforeValue = getRegimeFieldValue(beforeAttempt, 'REG_LEGAL_REGIME');
  const beforeRevision = beforeAttempt['revision'];
  const beforeStatusMap = JSON.stringify(beforeAttempt['stepStatusMap']);

  let thrownCode: string | null = null;
  try {
    controller.saveCurrentStep(guardFrom(beforeAttempt), [
      { fieldId: 'REG_LEGAL_REGIME', value: { valueType: 'STRING', value: 'DISPENSA' }, isValid: true },
    ]);
  } catch (err) {
    const e = err as Error;
    thrownCode = e?.message ?? null;
  }

  const afterAttempt = asRecord(controller.getState());
  const afterValue = getRegimeFieldValue(afterAttempt, 'REG_LEGAL_REGIME');
  const afterRevision = afterAttempt['revision'];
  const afterStatusMap = JSON.stringify(afterAttempt['stepStatusMap']);

  if (thrownCode !== 'FLOW_REGIME_FROZEN') {
    fail(`Erro esperado FLOW_REGIME_FROZEN, recebido: ${String(thrownCode)}`);
  }

  const activeBlockings = Array.isArray(afterAttempt['activeBlockings']) ? afterAttempt['activeBlockings'] : [];
  const hasFreezeBlocking = activeBlockings.some((item) => asRecord(item)['code'] === 'FLOW_REGIME_FROZEN');
  if (!hasFreezeBlocking) {
    fail('Blocking FLOW_REGIME_FROZEN nao foi registrado.');
  }

  const immutableHistory = Array.isArray(afterAttempt['immutableHistory']) ? afterAttempt['immutableHistory'] : [];
  const freezeEvent = immutableHistory.find((item) => asRecord(item)['type'] === 'REGIME_FREEZE_VIOLATION');
  if (!freezeEvent) {
    fail('Evento REGIME_FREEZE_VIOLATION nao foi registrado no historico imutavel.');
  }

  if (beforeValue !== 'LICITACAO' || afterValue !== 'LICITACAO') {
    fail('Campo critico REG_LEGAL_REGIME foi alterado indevidamente.');
  }
  if (beforeRevision !== afterRevision) {
    fail('Revision nao deveria mudar em tentativa bloqueada de freeze.');
  }
  if (beforeStatusMap !== afterStatusMap) {
    fail('StepStatusMap nao deveria mudar em tentativa bloqueada de freeze.');
  }

  console.log('[ETAPA_C_FREEZE_OK] freeze de regime bloqueou mutacao tardia no fluxo real.');
  console.log(`[ETAPA_C_FREEZE_EVIDENCE] process_id=${processId}`);
  console.log(`[ETAPA_C_FREEZE_EVIDENCE] event=REGIME_FREEZE_VIOLATION`);
}

void main();
