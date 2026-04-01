"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowController = exports.FlowStateStaleError = void 0;
const flow_controller_types_1 = require("./flow-controller.types");
const flow_state_factory_1 = require("./flow-state.factory");
const flow_step_definitions_1 = require("./flow-step-definitions");
function clone(value) {
    return JSON.parse(JSON.stringify(value));
}
function nowIso() {
    return new Date().toISOString();
}
class FlowStateStaleError extends Error {
    constructor(message) {
        super(message);
        this.name = 'FlowStateStaleError';
    }
}
exports.FlowStateStaleError = FlowStateStaleError;
class FlowController {
    constructor(processId, seedState) {
        if (seedState) {
            this.state = clone(seedState);
            this.stepFieldsByStep = this.extractPersistedStepFields(this.state);
        }
        else {
            this.state = (0, flow_state_factory_1.createInitialOperationalState)(processId);
            this.stepFieldsByStep = this.createInitialStepFields();
            this.syncInternalStateFields();
        }
        this.recomputeDerivedState();
    }
    getState() {
        return clone(this.state);
    }
    saveCurrentStep(guard, updates) {
        this.assertSynchronized(guard);
        const targetStep = this.state.currentStep;
        this.assertRegimeFreezeViolation(targetStep, updates.map((u) => u.fieldId));
        const fields = this.stepFieldsByStep[targetStep];
        const changed = this.applyFieldUpdates(fields, updates);
        if (!changed)
            return this.getState();
        const invalidated = this.invalidateDownstream(targetStep, 'INVALIDATION_EXPLICIT_SEGMENT_RESET');
        this.bumpRevisionAndHistory('STEP_SAVED', targetStep, {
            targetStep,
            changedFields: updates.map((u) => u.fieldId),
            invalidatedSteps: invalidated,
        });
        this.recomputeDerivedState();
        return this.getState();
    }
    advanceStep(guard) {
        this.assertSynchronized(guard);
        this.clearFlowTransitionBlockings();
        const from = this.state.currentStep;
        const to = (0, flow_step_definitions_1.getNextStep)(from);
        if (!to) {
            this.pushFlowInvalidTransition(from, from);
            this.recomputeDerivedState();
            throw new Error('FLOW_INVALID_TRANSITION');
        }
        if (!this.isStepReadyToAdvance(from)) {
            const blocking = this.createFlowBlocking('FLOW_INVALID_TRANSITION', from, {
                kind: 'FLOW_INVALID_TRANSITION',
                fromStep: from,
                toStep: to,
            });
            this.state.activeBlockings.push(blocking);
            this.recomputeDerivedState();
            throw new Error('FLOW_INVALID_TRANSITION');
        }
        this.state.currentStep = to;
        this.state.stepStatusMap[from] = 'COMPLETED';
        this.state.stepStatusMap[to] = 'IN_PROGRESS';
        this.bumpRevisionAndHistory('STEP_ADVANCED', to, { fromStep: from, toStep: to });
        this.recomputeDerivedState();
        return this.getState();
    }
    returnToPreviousStep(guard) {
        this.assertSynchronized(guard);
        this.clearFlowTransitionBlockings();
        const from = this.state.currentStep;
        const to = (0, flow_step_definitions_1.getPreviousStep)(from);
        if (!to) {
            this.pushFlowInvalidTransition(from, from);
            this.recomputeDerivedState();
            throw new Error('FLOW_INVALID_TRANSITION');
        }
        this.state.currentStep = to;
        this.state.stepStatusMap[to] = 'IN_PROGRESS';
        const invalidated = this.invalidateDownstream(to, 'INVALIDATION_EXPLICIT_SEGMENT_RESET');
        this.state.reviewResult = { phase: 'PRE_REVIEW' };
        this.bumpRevisionAndHistory('STEP_RETURNED', to, { fromStep: from, toStep: to, invalidatedSteps: invalidated });
        this.recomputeDerivedState();
        return this.getState();
    }
    triggerReview(guard, executeReview) {
        this.assertSynchronized(guard);
        if (this.state.currentStep !== 'REVIEW') {
            this.state.activeBlockings.push(this.createFlowBlocking('FLOW_REVIEW_NOT_AVAILABLE', this.state.currentStep, {
                kind: 'FLOW_REVIEW_NOT_AVAILABLE',
                currentStep: this.state.currentStep,
            }));
            this.recomputeDerivedState();
            return Promise.reject(new Error('FLOW_REVIEW_NOT_AVAILABLE'));
        }
        return executeReview().then((result) => {
            this.state.reviewResult = {
                phase: 'POST_REVIEW',
                finalStatus: result.finalStatus,
                haltedDetail: result.haltedDetail ?? null,
                validations: result.validations,
                executedModules: result.executedModules,
                reviewSnapshotHash: result.reviewSnapshotHash,
            };
            this.attachReviewMotorBlockings(result);
            this.bumpRevisionAndHistory('REVIEW_EXECUTED', 'REVIEW', { finalStatus: result.finalStatus });
            this.recomputeDerivedState();
            return this.getState();
        });
    }
    exposeOutput(guard) {
        this.assertSynchronized(guard);
        if (this.state.currentStep !== 'OUTPUT') {
            this.state.activeBlockings.push(this.createFlowBlocking('FLOW_OUTPUT_NOT_AVAILABLE', this.state.currentStep, {
                kind: 'FLOW_OUTPUT_NOT_AVAILABLE',
                currentStep: this.state.currentStep,
            }));
            this.recomputeDerivedState();
            throw new Error('FLOW_OUTPUT_NOT_AVAILABLE');
        }
        this.bumpRevisionAndHistory('OUTPUT_EXPOSED', 'OUTPUT', { status: 'EXPOSED' });
        this.recomputeDerivedState();
        return this.getState();
    }
    assertSynchronized(guard) {
        const revisionMismatch = guard.expectedRevision !== this.state.revision;
        const renderTokenMismatch = guard.expectedRenderToken !== this.state.renderToken;
        if (!revisionMismatch && !renderTokenMismatch)
            return;
        const code = renderTokenMismatch ? 'UI_RENDER_TOKEN_MISMATCH_ON_COMMAND' : 'UI_STATE_STALE';
        this.state.activeBlockings.push({
            code,
            severity: 'HARD',
            step: this.state.currentStep,
            origin: 'UI',
            messageKey: code === 'UI_RENDER_TOKEN_MISMATCH_ON_COMMAND'
                ? 'BLOCKING_UI_RENDER_TOKEN_MISMATCH'
                : 'BLOCKING_UI_STATE_STALE',
            correctionAction: 'RELOAD_STATE_FROM_SERVER',
            details: code === 'UI_RENDER_TOKEN_MISMATCH_ON_COMMAND'
                ? {
                    kind: 'RENDER_TOKEN_MISMATCH_ON_COMMAND',
                    expectedRenderToken: guard.expectedRenderToken,
                    currentRenderToken: this.state.renderToken,
                    serverRevision: this.state.revision,
                }
                : {
                    kind: 'STATE_STALE',
                    expectedRenderToken: guard.expectedRenderToken,
                    currentRenderToken: this.state.renderToken,
                    serverRevision: this.state.revision,
                },
        });
        this.recomputeDerivedState();
        throw new FlowStateStaleError('STATE_STALE');
    }
    assertRegimeFreezeViolation(step, fieldIds) {
        const regimeFields = new Set(['REG_LEGAL_REGIME', 'REG_PROCUREMENT_STRATEGY']);
        const regimeFrozen = (0, flow_step_definitions_1.getStepIndex)(this.state.currentStep) > (0, flow_step_definitions_1.getStepIndex)('REGIME');
        if (!regimeFrozen || step !== 'REGIME')
            return;
        const attempted = fieldIds.find((id) => regimeFields.has(id));
        if (!attempted)
            return;
        this.state.activeBlockings.push(this.createFlowBlocking('FLOW_REGIME_FROZEN', 'REGIME', {
            kind: 'FLOW_REGIME_FROZEN',
            frozenAfterStep: this.state.currentStep,
            attemptedField: attempted,
        }));
        throw new Error('FLOW_REGIME_FROZEN');
    }
    applyFieldUpdates(fields, updates) {
        let changed = false;
        for (const update of updates) {
            const field = fields.find((current) => current.fieldId === update.fieldId);
            if (!field)
                continue;
            const before = (0, flow_state_factory_1.createSha256)(field);
            field.value = update.value;
            field.isValid = update.isValid;
            const after = (0, flow_state_factory_1.createSha256)(field);
            if (before !== after)
                changed = true;
        }
        return changed;
    }
    invalidateDownstream(sourceStep, reasonCode) {
        const downstream = (0, flow_step_definitions_1.getDownstreamSteps)(sourceStep);
        const invalidated = [];
        for (const step of downstream) {
            if (this.state.stepStatusMap[step] === 'LOCKED')
                continue;
            this.state.stepStatusMap[step] = 'INVALIDATED';
            invalidated.push(step);
            this.appendHistory('STEP_INVALIDATED', step, {
                sourceStep,
                invalidatedStep: step,
                reasonCode,
            });
        }
        if (invalidated.length > 0) {
            this.state.activeBlockings.push(this.createFlowBlocking('FLOW_INVALIDATED_DOWNSTREAM', invalidated[0], {
                kind: 'FLOW_INVALIDATED_DOWNSTREAM',
                invalidatedSteps: invalidated,
                reasonCode,
            }));
            this.state.reviewResult = { phase: 'PRE_REVIEW' };
        }
        return invalidated;
    }
    clearFlowTransitionBlockings() {
        this.state.activeBlockings = this.state.activeBlockings.filter((blocking) => blocking.code !== 'FLOW_INVALID_TRANSITION');
    }
    pushFlowInvalidTransition(fromStep, toStep) {
        this.state.activeBlockings.push(this.createFlowBlocking('FLOW_INVALID_TRANSITION', fromStep, {
            kind: 'FLOW_INVALID_TRANSITION',
            fromStep,
            toStep,
        }));
    }
    isStepReadyToAdvance(step) {
        if (step === 'REVIEW') {
            return this.state.reviewResult.phase === 'POST_REVIEW';
        }
        const required = (0, flow_step_definitions_1.getRequiredFieldsForStep)(step);
        if (required.length === 0)
            return true;
        const fields = this.stepFieldsByStep[step];
        return required.every((fieldId) => {
            const field = fields.find((entry) => entry.fieldId === fieldId);
            return !!field && field.value !== null && field.isValid !== false;
        });
    }
    createFlowBlocking(code, step, details) {
        const base = {
            severity: 'HARD',
            step,
            origin: 'FLUXO',
            details,
        };
        switch (code) {
            case 'FLOW_INVALID_TRANSITION':
                return { ...base, code, messageKey: 'BLOCKING_STATE_INVALID_TRANSITION', correctionAction: 'RETURN_TO_PREVIOUS_STEP' };
            case 'FLOW_REVIEW_NOT_AVAILABLE':
                return { ...base, code, messageKey: 'BLOCKING_STATE_REVIEW_NOT_AVAILABLE', correctionAction: 'FILL_REQUIRED_FIELDS' };
            case 'FLOW_OUTPUT_NOT_AVAILABLE': {
                const canTriggerReview = this.state.currentStep === 'REVIEW' &&
                    this.state.reviewResult.phase === 'PRE_REVIEW' &&
                    this.state.allowedActions.includes('TRIGGER_REVIEW');
                return {
                    ...base,
                    code,
                    messageKey: 'BLOCKING_STATE_OUTPUT_NOT_AVAILABLE',
                    correctionAction: canTriggerReview ? 'TRIGGER_REVIEW' : 'FILL_REQUIRED_FIELDS',
                };
            }
            case 'FLOW_REGIME_FROZEN':
                return { ...base, code, messageKey: 'BLOCKING_STATE_REGIME_FROZEN', correctionAction: 'RETURN_TO_PREVIOUS_STEP' };
            case 'FLOW_INVALIDATED_DOWNSTREAM':
                return { ...base, code, messageKey: 'BLOCKING_STATE_INVALIDATED_DOWNSTREAM', correctionAction: 'RETURN_TO_PREVIOUS_STEP' };
            default:
                return { ...base, code: 'FLOW_INVALID_TRANSITION', messageKey: 'BLOCKING_STATE_INVALID_TRANSITION', correctionAction: 'RETURN_TO_PREVIOUS_STEP' };
        }
    }
    attachReviewMotorBlockings(result) {
        this.state.activeBlockings = this.state.activeBlockings.filter((blocking) => blocking.origin !== 'MOTOR');
        if (result.finalStatus === 'SUCCESS')
            return;
        const map = {
            HALTED_BY_VALIDATION: ['MOTOR_HALTED_BY_VALIDATION', 'BLOCKING_MOTOR_HALTED_BY_VALIDATION'],
            HALTED_BY_DEPENDENCY: ['MOTOR_HALTED_BY_DEPENDENCY', 'BLOCKING_MOTOR_HALTED_BY_DEPENDENCY'],
            HALTED_BY_MODULE: ['MOTOR_HALTED_BY_MODULE', 'BLOCKING_MOTOR_HALTED_BY_MODULE'],
        };
        const [code, messageKey] = map[result.finalStatus];
        if (!code || !messageKey)
            return;
        const haltedSegments = result.haltedDetail?.motorOpaqueSegments ?? [];
        const haltedToken = result.haltedDetail?.haltedByModuleToken ?? null;
        const detailsByCode = {
            MOTOR_HALTED_BY_VALIDATION: {
                kind: 'MOTOR_HALTED_BY_VALIDATION',
                motorOpaqueHaltSegments: haltedSegments,
                haltedByModuleToken: haltedToken,
            },
            MOTOR_HALTED_BY_DEPENDENCY: {
                kind: 'MOTOR_HALTED_BY_DEPENDENCY',
                motorOpaqueHaltSegments: haltedSegments,
                haltedByModuleToken: haltedToken,
                dependencySegments: haltedSegments,
            },
            MOTOR_HALTED_BY_MODULE: {
                kind: 'MOTOR_HALTED_BY_MODULE',
                motorOpaqueHaltSegments: haltedSegments,
                haltedByModuleToken: haltedToken,
            },
        };
        this.state.activeBlockings.push({
            code,
            severity: 'HARD',
            step: 'REVIEW',
            origin: 'MOTOR',
            messageKey,
            correctionAction: 'FILL_REQUIRED_FIELDS',
            details: detailsByCode[code],
        });
        if (result.haltedDetail?.origin === 'CLASSIFICATION_PREFLIGHT') {
            this.state.activeBlockings.push({
                code: 'MOTOR_CLASSIFICATION_PREFLIGHT',
                severity: 'HARD',
                step: 'REVIEW',
                origin: 'MOTOR',
                messageKey: 'BLOCKING_MOTOR_CLASSIFICATION_PREFLIGHT',
                correctionAction: 'FILL_REQUIRED_FIELDS',
                details: {
                    kind: 'MOTOR_CLASSIFICATION_PREFLIGHT',
                    preflightSegments: result.haltedDetail.motorOpaqueSegments,
                },
            });
        }
    }
    bumpRevisionAndHistory(type, step, metadata) {
        this.state.revision += 1;
        this.appendHistory(type, step, metadata);
        this.state.generatedAt = nowIso();
    }
    appendHistory(type, step, metadata) {
        const baseEvent = {
            revision: this.state.revision,
            type,
            step,
            timestamp: nowIso(),
            metadata,
        };
        const historyEvent = {
            revision: baseEvent.revision,
            type: baseEvent.type,
            step: baseEvent.step,
            timestamp: baseEvent.timestamp,
            metadataHash: (0, flow_state_factory_1.createMetadataHash)({
                revision: baseEvent.revision,
                type: baseEvent.type,
                step: baseEvent.step,
                timestamp: baseEvent.timestamp,
            }),
        };
        this.state.immutableHistory = [...this.state.immutableHistory, historyEvent];
    }
    recomputeDerivedState() {
        this.syncInternalStateFields();
        this.enforceConsistencyRules();
        this.state.allowedActions = this.deriveAllowedActions();
        this.state.nextRequiredAction = this.deriveNextRequiredAction(this.state.allowedActions);
        this.state.currentStepForm = this.deriveCurrentStepForm();
        this.state.renderToken = (0, flow_state_factory_1.createRenderToken)(this.state);
    }
    extractPersistedStepFields(state) {
        const raw = state['_stepFieldsByStep'];
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
            throw new Error('FLOW_SNAPSHOT_INVALID_STEP_FIELDS');
        }
        return clone(raw);
    }
    syncInternalStateFields() {
        const stateAsRecord = this.state;
        stateAsRecord['_schemaVersion'] =
            typeof stateAsRecord['_schemaVersion'] === 'string' ? stateAsRecord['_schemaVersion'] : '1.0';
        stateAsRecord['_stepFieldsByStep'] = clone(this.stepFieldsByStep);
    }
    enforceConsistencyRules() {
        // 1) Nenhum COMPLETED com blocker HARD.
        const hardByStep = new Map();
        for (const blocking of this.state.activeBlockings) {
            if (blocking.severity !== 'HARD')
                continue;
            hardByStep.set(blocking.step, (hardByStep.get(blocking.step) ?? 0) + 1);
        }
        for (const step of flow_controller_types_1.FLOW_STEP_ORDER) {
            if (this.state.stepStatusMap[step] === 'COMPLETED' && (hardByStep.get(step) ?? 0) > 0) {
                this.state.stepStatusMap[step] = 'IN_PROGRESS';
            }
        }
        // 2) Nenhum REVIEW com upstream inválido.
        const reviewIdx = (0, flow_step_definitions_1.getStepIndex)('REVIEW');
        const upstreamInvalid = flow_controller_types_1.FLOW_STEP_ORDER.slice(0, reviewIdx).some((step) => this.state.stepStatusMap[step] === 'INVALIDATED');
        if (upstreamInvalid && this.state.stepStatusMap.REVIEW === 'COMPLETED') {
            this.state.stepStatusMap.REVIEW = 'INVALIDATED';
            this.state.reviewResult = { phase: 'PRE_REVIEW' };
            if (this.state.currentStep === 'REVIEW') {
                this.state.currentStep = 'PRICING';
                this.state.stepStatusMap.PRICING = 'IN_PROGRESS';
            }
        }
        // 3) Nenhum OUTPUT sem REVIEW válido.
        const reviewValid = this.state.reviewResult.phase === 'POST_REVIEW' && this.state.reviewResult.finalStatus === 'SUCCESS';
        if (!reviewValid) {
            this.state.stepStatusMap.OUTPUT = this.state.stepStatusMap.OUTPUT === 'LOCKED' ? 'LOCKED' : 'INVALIDATED';
            if (this.state.currentStep === 'OUTPUT') {
                this.state.currentStep = 'REVIEW';
                this.state.stepStatusMap.REVIEW = 'IN_PROGRESS';
            }
        }
        else if (this.state.stepStatusMap.OUTPUT === 'LOCKED') {
            this.state.stepStatusMap.OUTPUT = 'AVAILABLE';
        }
    }
    deriveAllowedActions() {
        const actions = ['EDIT_CURRENT_STEP', 'SAVE_CURRENT_STEP'];
        const hasHardBlocking = this.state.activeBlockings.some((blocking) => blocking.severity === 'HARD');
        const prev = (0, flow_step_definitions_1.getPreviousStep)(this.state.currentStep);
        const next = (0, flow_step_definitions_1.getNextStep)(this.state.currentStep);
        if (prev)
            actions.push('RETURN_TO_PREVIOUS_STEP');
        if (!hasHardBlocking && next && this.isStepReadyToAdvance(this.state.currentStep)) {
            actions.push('ADVANCE_TO_NEXT_STEP');
        }
        if (this.state.currentStep === 'REVIEW' &&
            this.state.reviewResult.phase === 'PRE_REVIEW' &&
            !hasHardBlocking) {
            actions.push('TRIGGER_REVIEW');
        }
        if (this.state.currentStep === 'OUTPUT' &&
            this.state.reviewResult.phase === 'POST_REVIEW' &&
            this.state.reviewResult.finalStatus === 'SUCCESS' &&
            !hasHardBlocking) {
            actions.push('VIEW_OUTPUT');
        }
        return [...new Set(actions)];
    }
    deriveNextRequiredAction(allowedActions) {
        const hasBlockingRequiringResolution = this.state.activeBlockings.some((blocking) => blocking.severity === 'HARD' && blocking.correctionAction !== 'RELOAD_STATE_FROM_SERVER');
        if (hasBlockingRequiringResolution)
            return 'RESOLVE_BLOCKINGS';
        if (this.state.currentStep === 'REVIEW' &&
            this.state.reviewResult.phase === 'PRE_REVIEW' &&
            allowedActions.includes('TRIGGER_REVIEW')) {
            return 'RUN_REVIEW';
        }
        if (this.state.currentStep === 'OUTPUT' &&
            this.state.reviewResult.phase === 'POST_REVIEW' &&
            this.state.reviewResult.finalStatus === 'SUCCESS' &&
            allowedActions.includes('VIEW_OUTPUT')) {
            return 'VIEW_RESULT';
        }
        return 'FILL_REQUIRED_FIELDS';
    }
    createInitialStepFields() {
        return Object.fromEntries(flow_controller_types_1.FLOW_STEP_ORDER.map((step) => [
            step,
            (0, flow_step_definitions_1.getRequiredFieldsForStep)(step).map((fieldId) => ({
                fieldId,
                value: null,
                isValid: null,
                validationTrace: null,
            })),
        ]));
    }
    deriveInstructionMessageKey() {
        if (this.state.nextRequiredAction === 'RESOLVE_BLOCKINGS')
            return 'CONDUCAO_INSTRUCTION_RESOLVE_BLOCKINGS';
        if (this.state.nextRequiredAction === 'RUN_REVIEW')
            return 'CONDUCAO_INSTRUCTION_RUN_REVIEW';
        if (this.state.nextRequiredAction === 'VIEW_RESULT')
            return 'CONDUCAO_INSTRUCTION_VIEW_RESULT';
        return 'CONDUCAO_INSTRUCTION_FILL_REQUIRED_FIELDS';
    }
    deriveCurrentStepForm() {
        const step = this.state.currentStep;
        if (step === 'REVIEW') {
            const outcome = this.state.reviewResult.phase === 'POST_REVIEW' ? this.state.reviewResult.finalStatus : 'PRE_REVIEW';
            const modules = this.state.reviewResult.phase === 'POST_REVIEW' ? this.state.reviewResult.executedModules.join(', ') : '-';
            return {
                mode: 'REVIEW_PANEL',
                step: 'REVIEW',
                formId: 'FORM_REVIEW_PANEL_V1',
                stepTitleMessageKey: 'REVIEW_PANEL_TITLE',
                stepInstructionMessageKey: this.state.reviewResult.phase === 'PRE_REVIEW'
                    ? 'REVIEW_PANEL_INSTRUCTION_PRE_EXEC'
                    : 'REVIEW_PANEL_INSTRUCTION_POST_EXEC',
                reviewExecutionPhase: this.state.reviewResult.phase,
                readOnlyBlocks: [
                    { blockKind: 'STATIC_SECTION', sectionTitleMessageKey: 'REVIEW_BLOCK_STATIC_SUMMARY' },
                    {
                        blockKind: 'KEY_VALUE',
                        rowId: 'REVIEW_ROW_OUTCOME',
                        labelMessageKey: 'REVIEW_BLOCK_OUTCOME_LINE',
                        valueDisplay: { kind: 'OPAQUE_TEXT', text: outcome },
                    },
                    {
                        blockKind: 'KEY_VALUE',
                        rowId: 'REVIEW_ROW_MODULES',
                        labelMessageKey: 'REVIEW_BLOCK_MODULES_LINE',
                        valueDisplay: { kind: 'OPAQUE_TEXT', text: modules },
                    },
                ],
                reviewTriggerControl: {
                    visible: true,
                    disabled: !this.state.allowedActions.includes('TRIGGER_REVIEW'),
                    labelMessageKey: 'REVIEW_TRIGGER_PRIMARY_LABEL',
                },
            };
        }
        if (step === 'OUTPUT') {
            const summary = this.state.reviewResult.phase === 'POST_REVIEW'
                ? `${this.state.reviewResult.finalStatus}:${this.state.reviewResult.reviewSnapshotHash}`
                : 'PRE_REVIEW';
            return {
                mode: 'OUTPUT_PANEL',
                step: 'OUTPUT',
                formId: 'FORM_OUTPUT_PANEL_V1',
                stepTitleMessageKey: 'OUTPUT_PANEL_TITLE',
                stepInstructionMessageKey: 'OUTPUT_PANEL_INSTRUCTION_VIEW',
                readOnlyBlocks: [
                    { blockKind: 'STATIC_SECTION', sectionTitleMessageKey: 'OUTPUT_BLOCK_RESULT_SUMMARY' },
                    {
                        blockKind: 'KEY_VALUE',
                        rowId: 'OUTPUT_ROW_SUMMARY',
                        labelMessageKey: 'OUTPUT_BLOCK_RESULT_SUMMARY',
                        valueDisplay: { kind: 'OPAQUE_TEXT', text: summary },
                    },
                ],
            };
        }
        return {
            mode: 'CONDUCTION_STEP_FORM',
            step,
            formId: (0, flow_step_definitions_1.getConductionFormIdForStep)(step),
            stepTitleMessageKey: (0, flow_step_definitions_1.getStepTitleMessageKey)(step),
            stepInstructionMessageKey: this.deriveInstructionMessageKey(),
            fields: this.stepFieldsByStep[step].map((fieldState) => ({
                spec: (0, flow_step_definitions_1.getStepFieldSpec)(fieldState.fieldId),
                state: clone(fieldState),
            })),
        };
    }
}
exports.FlowController = FlowController;
