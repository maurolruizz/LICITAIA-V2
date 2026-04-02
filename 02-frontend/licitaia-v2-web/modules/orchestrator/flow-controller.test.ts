import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { FlowController, FlowStateStaleError } from './flow-controller';

function guardOf(controller: FlowController) {
  const state = controller.getState();
  return {
    expectedRevision: state.revision,
    expectedRenderToken: state.renderToken,
  };
}

describe('FlowController', () => {
  it('blocks stale state commands using renderToken and revision', () => {
    const controller = new FlowController('PROC_STALE');
    assert.throws(
      () => controller.advanceStep({ expectedRevision: 0, expectedRenderToken: 'stale' }),
      (error: unknown) => error instanceof FlowStateStaleError
    );
    const state = controller.getState();
    assert.ok(state.activeBlockings.some((blocking) => blocking.code === 'UI_RENDER_TOKEN_MISMATCH_ON_COMMAND'));
  });

  it('prevents bypass and only advances when current step is ready', () => {
    const controller = new FlowController('PROC_ADVANCE');
    assert.throws(() => controller.advanceStep(guardOf(controller)));

    controller.saveCurrentStep(guardOf(controller), [
      { fieldId: 'INIT_CONFIRM', value: { valueType: 'BOOLEAN', value: true }, isValid: true },
    ]);
    const advanced = controller.advanceStep(guardOf(controller));
    assert.equal(advanced.currentStep, 'CONTEXT');
    assert.equal(advanced.stepStatusMap.INIT, 'COMPLETED');
  });

  it('invalidates downstream when upstream changes and emits blocking', () => {
    const controller = new FlowController('PROC_INVALIDATION');
    controller.saveCurrentStep(guardOf(controller), [
      { fieldId: 'INIT_CONFIRM', value: { valueType: 'BOOLEAN', value: true }, isValid: true },
    ]);
    controller.advanceStep(guardOf(controller));
    controller.saveCurrentStep(guardOf(controller), [
      { fieldId: 'CTX_TENANT_SLUG', value: { valueType: 'STRING', value: 'tenant-x' }, isValid: true },
      { fieldId: 'CTX_OPERATOR_NOTE', value: { valueType: 'STRING', value: 'note' }, isValid: true },
    ]);
    controller.advanceStep(guardOf(controller));
    controller.returnToPreviousStep(guardOf(controller));
    const state = controller.getState();
    assert.equal(state.stepStatusMap.REGIME, 'INVALIDATED');
    assert.ok(state.activeBlockings.some((blocking) => blocking.code === 'FLOW_INVALIDATED_DOWNSTREAM'));
    const invalidationCodes = state.activeBlockings
      .filter((blocking) => blocking.code === 'FLOW_INVALIDATED_DOWNSTREAM')
      .map((blocking) =>
        blocking.details.kind === 'FLOW_INVALIDATED_DOWNSTREAM' ? blocking.details.reasonCode : null
      );
    assert.ok(invalidationCodes.includes('INVALIDATION_EXPLICIT_SEGMENT_RESET'));
  });

  it('uses regime/context reopen reason when invalidating after context mutation', () => {
    const controller = new FlowController('PROC_INVALIDATION_CONTEXT_REOPEN');
    controller.saveCurrentStep(guardOf(controller), [
      { fieldId: 'INIT_CONFIRM', value: { valueType: 'BOOLEAN', value: true }, isValid: true },
    ]);
    controller.advanceStep(guardOf(controller));
    controller.saveCurrentStep(guardOf(controller), [
      { fieldId: 'CTX_TENANT_SLUG', value: { valueType: 'STRING', value: 'tenant-x' }, isValid: true },
      { fieldId: 'CTX_OPERATOR_NOTE', value: { valueType: 'STRING', value: 'note' }, isValid: true },
    ]);
    controller.advanceStep(guardOf(controller));
    controller.saveCurrentStep(guardOf(controller), [
      { fieldId: 'REG_LEGAL_REGIME', value: { valueType: 'STRING', value: 'LICITACAO' }, isValid: true },
      { fieldId: 'REG_PROCUREMENT_STRATEGY', value: { valueType: 'STRING', value: 'PREGAO' }, isValid: true },
    ]);
    controller.advanceStep(guardOf(controller));
    controller.returnToPreviousStep(guardOf(controller));
    controller.returnToPreviousStep(guardOf(controller));
    controller.saveCurrentStep(guardOf(controller), [
      { fieldId: 'CTX_OPERATOR_NOTE', value: { valueType: 'STRING', value: 'note-updated' }, isValid: true },
    ]);
    const state = controller.getState();
    const reasons = state.activeBlockings
      .filter((blocking) => blocking.code === 'FLOW_INVALIDATED_DOWNSTREAM')
      .map((blocking) =>
        blocking.details.kind === 'FLOW_INVALIDATED_DOWNSTREAM' ? blocking.details.reasonCode : null
      );
    assert.ok(reasons.includes('INVALIDATION_REGIME_OR_CONTEXT_REOPEN'));
  });

  it('blocks critical regime mutation after regime consolidation even after returning to REGIME', () => {
    const controller = new FlowController('PROC_REGIME_FREEZE_HARD');
    controller.saveCurrentStep(guardOf(controller), [
      { fieldId: 'INIT_CONFIRM', value: { valueType: 'BOOLEAN', value: true }, isValid: true },
    ]);
    controller.advanceStep(guardOf(controller));
    controller.saveCurrentStep(guardOf(controller), [
      { fieldId: 'CTX_TENANT_SLUG', value: { valueType: 'STRING', value: 'tenant-a' }, isValid: true },
      { fieldId: 'CTX_OPERATOR_NOTE', value: { valueType: 'STRING', value: 'ok' }, isValid: true },
    ]);
    controller.advanceStep(guardOf(controller));
    controller.saveCurrentStep(guardOf(controller), [
      { fieldId: 'REG_LEGAL_REGIME', value: { valueType: 'STRING', value: 'LICITACAO' }, isValid: true },
      { fieldId: 'REG_PROCUREMENT_STRATEGY', value: { valueType: 'STRING', value: 'PREGAO' }, isValid: true },
    ]);
    controller.advanceStep(guardOf(controller));
    controller.returnToPreviousStep(guardOf(controller));
    assert.equal(controller.getState().currentStep, 'REGIME');

    assert.throws(() =>
      controller.saveCurrentStep(guardOf(controller), [
        { fieldId: 'REG_LEGAL_REGIME', value: { valueType: 'STRING', value: 'DISPENSA' }, isValid: true },
      ])
    );

    const state = controller.getState();
    assert.ok(state.activeBlockings.some((blocking) => blocking.code === 'FLOW_REGIME_FROZEN'));
    assert.ok(state.immutableHistory.some((event) => event.type === 'REGIME_FREEZE_VIOLATION'));
  });

  it('keeps output blocked until valid review result', async () => {
    const controller = new FlowController('PROC_REVIEW_OUTPUT');
    controller.saveCurrentStep(guardOf(controller), [
      { fieldId: 'INIT_CONFIRM', value: { valueType: 'BOOLEAN', value: true }, isValid: true },
    ]);
    controller.advanceStep(guardOf(controller));
    controller.saveCurrentStep(guardOf(controller), [
      { fieldId: 'CTX_TENANT_SLUG', value: { valueType: 'STRING', value: 'tenant' }, isValid: true },
      { fieldId: 'CTX_OPERATOR_NOTE', value: { valueType: 'STRING', value: 'ok' }, isValid: true },
    ]);
    controller.advanceStep(guardOf(controller));
    controller.saveCurrentStep(guardOf(controller), [
      { fieldId: 'REG_LEGAL_REGIME', value: { valueType: 'STRING', value: 'LICITACAO' }, isValid: true },
      { fieldId: 'REG_PROCUREMENT_STRATEGY', value: { valueType: 'STRING', value: 'PREGAO' }, isValid: true },
    ]);
    controller.advanceStep(guardOf(controller));
    controller.saveCurrentStep(guardOf(controller), [
      { fieldId: 'DFD_OBJECT_TYPE', value: { valueType: 'STRING', value: 'BEM' }, isValid: true },
      { fieldId: 'DFD_OBJECT_STRUCTURE', value: { valueType: 'STRING', value: 'ITEM_UNICO' }, isValid: true },
    ]);
    controller.advanceStep(guardOf(controller));
    controller.saveCurrentStep(guardOf(controller), [
      { fieldId: 'ETP_STRATEGY_NOTE', value: { valueType: 'STRING', value: 'ok' }, isValid: true },
    ]);
    controller.advanceStep(guardOf(controller));
    controller.saveCurrentStep(guardOf(controller), [
      { fieldId: 'TR_TERMS_NOTE', value: { valueType: 'STRING', value: 'ok' }, isValid: true },
    ]);
    controller.advanceStep(guardOf(controller));
    controller.saveCurrentStep(guardOf(controller), [
      { fieldId: 'PRC_BASE_VALUE', value: { valueType: 'NUMBER', value: 1000 }, isValid: true },
    ]);
    controller.advanceStep(guardOf(controller));
    assert.equal(controller.getState().currentStep, 'REVIEW');

    await controller.triggerReview(guardOf(controller), async () => ({
      finalStatus: 'SUCCESS',
      validations: [],
      executedModules: ['DFD', 'ETP', 'TR', 'PRICING'],
      reviewSnapshotHash: 'hash-review',
    }));
    controller.advanceStep(guardOf(controller));
    const outputState = controller.getState();
    assert.equal(outputState.currentStep, 'OUTPUT');
    assert.ok(outputState.allowedActions.includes('VIEW_OUTPUT'));
  });

  it('maintains append-only immutable history with metadataHash', () => {
    const controller = new FlowController('PROC_HISTORY');
    const before = controller.getState().immutableHistory.length;
    controller.saveCurrentStep(guardOf(controller), [
      { fieldId: 'INIT_CONFIRM', value: { valueType: 'BOOLEAN', value: true }, isValid: true },
    ]);
    const afterState = controller.getState();
    assert.ok(afterState.immutableHistory.length > before);
    assert.ok(afterState.immutableHistory.every((event) => typeof event.metadataHash === 'string' && event.metadataHash.length > 0));
  });

  it('increments revision when returning to previous step', () => {
    const controller = new FlowController('PROC_RETURN_REVISION');
    controller.saveCurrentStep(guardOf(controller), [
      { fieldId: 'INIT_CONFIRM', value: { valueType: 'BOOLEAN', value: true }, isValid: true },
    ]);
    controller.advanceStep(guardOf(controller));
    const before = controller.getState().revision;
    controller.returnToPreviousStep(guardOf(controller));
    const after = controller.getState();
    assert.ok(after.revision > before);
    assert.equal(after.currentStep, 'INIT');
  });

  it('changes renderToken when state basis changes', () => {
    const controller = new FlowController('PROC_RENDER_TOKEN');
    const before = controller.getState().renderToken;
    controller.saveCurrentStep(guardOf(controller), [
      { fieldId: 'INIT_CONFIRM', value: { valueType: 'BOOLEAN', value: true }, isValid: true },
    ]);
    const after = controller.getState().renderToken;
    assert.notEqual(before, after);
  });
});

