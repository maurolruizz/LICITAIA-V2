"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOCUMENT_STRUCTURE_RULES = void 0;
function alwaysRequired() {
    return 'required';
}
function requiredWithCalculation(ctx) {
    return ctx.hasCalculationData ? 'required' : 'not_applicable';
}
function requiredWithPricing(ctx) {
    return ctx.hasPricingData ? 'required' : 'not_applicable';
}
function calculationRequiredOrProhibitedInSingleExecution(ctx) {
    if (ctx.hasCalculationData)
        return 'required';
    if (ctx.executionForm === 'ENTREGA_UNICA')
        return 'prohibited';
    return 'not_applicable';
}
function pricingRequiredOrProhibited(ctx) {
    return ctx.hasPricingData ? 'required' : 'prohibited';
}
const SHARED_CLASSIFICATION_PATHS = [
    'legalRegime',
    'objectType',
    'objectStructure',
    'executionForm',
];
exports.DOCUMENT_STRUCTURE_RULES = {
    'DFD': {
        IDENTIFICATION: {
            blockId: 'DFD_IDENTIFICACAO_PROCESSUAL',
            sectionType: 'IDENTIFICATION',
            title: 'DFD_IDENTIFICACAO_PROCESSUAL',
            sourceOfTruth: ['PROCESS_SNAPSHOT', 'DECISION_TRACE'],
            sourcePaths: ['requestingDepartment', 'requesterName', 'requestDate', ...SHARED_CLASSIFICATION_PATHS],
            coherenceChecks: ['DFD_ETP_CLASSIFICATION_ALIGNMENT'],
            getApplicability: alwaysRequired,
        },
        NEED: {
            blockId: 'DFD_DEMANDA_FORMALIZADA',
            sectionType: 'NEED',
            title: 'DFD_DEMANDA_FORMALIZADA',
            sourceOfTruth: ['PROCESS_SNAPSHOT', 'DECISION_EXPLANATION'],
            sourcePaths: ['demandDescription', 'administrativeObjective'],
            coherenceChecks: ['DFD_ETP_NEED_ALIGNMENT'],
            getApplicability: alwaysRequired,
        },
        STRUCTURE: {
            blockId: 'DFD_ENQUADRAMENTO_ESTRUTURAL',
            sectionType: 'STRUCTURE',
            title: 'DFD_ENQUADRAMENTO_ESTRUTURAL',
            sourceOfTruth: ['PROCESS_SNAPSHOT', 'DERIVED'],
            sourcePaths: ['objectStructure', 'structureType', 'items', 'lots'],
            coherenceChecks: ['STRUCTURE_CLASSIFICATION_CONSISTENCY'],
            getApplicability: alwaysRequired,
        },
        CALCULATION: {
            blockId: 'DFD_MEMORIA_CALCULO_REFERENCIAL',
            sectionType: 'CALCULATION',
            title: 'DFD_MEMORIA_CALCULO_REFERENCIAL',
            sourceOfTruth: ['CALCULATION_MEMORY', 'PROCESS_SNAPSHOT'],
            sourcePaths: ['calculationMemory', 'calculationMemories'],
            coherenceChecks: ['CALCULATION_NEED_CONSISTENCY'],
            getApplicability: calculationRequiredOrProhibitedInSingleExecution,
        },
        JUSTIFICATION: {
            blockId: 'DFD_JUSTIFICATIVA_CONTRATACAO',
            sectionType: 'JUSTIFICATION',
            title: 'DFD_JUSTIFICATIVA_CONTRATACAO',
            sourceOfTruth: ['PROCESS_SNAPSHOT', 'DECISION_EXPLANATION'],
            sourcePaths: ['hiringJustification', 'administrativeJustification', 'administrativeJustifications'],
            coherenceChecks: ['JUSTIFICATION_NEED_CONSISTENCY', 'LEGAL_BASIS_COMPLIANCE_WHEN_DIRECT'],
            getApplicability: alwaysRequired,
        },
        STRATEGY: {
            blockId: 'DFD_ESTRATEGIA_CONTRATACAO',
            sectionType: 'STRATEGY',
            title: 'DFD_ESTRATEGIA_CONTRATACAO',
            sourceOfTruth: ['PROCESS_SNAPSHOT', 'DECISION_EXPLANATION'],
            sourcePaths: ['procurementStrategy', 'procurementStrategies', 'legalRegime'],
            coherenceChecks: ['STRATEGY_STRUCTURE_CONSISTENCY'],
            getApplicability: alwaysRequired,
        },
        COHERENCE: {
            blockId: 'DFD_COERENCIA_RASTREAVEL',
            sectionType: 'COHERENCE',
            title: 'DFD_COERENCIA_RASTREAVEL',
            sourceOfTruth: ['DECISION_TRACE', 'VALIDATION_RESULT'],
            sourcePaths: ['trace.hasInconsistency', 'trace.isComplete', 'validations'],
            coherenceChecks: ['TRACE_EXPLANATION_DOCUMENT_ALIGNMENT'],
            getApplicability: alwaysRequired,
        },
    },
    'ETP': {
        IDENTIFICATION: {
            blockId: 'ETP_IDENTIFICACAO_ESTUDO',
            sectionType: 'IDENTIFICATION',
            title: 'ETP_IDENTIFICACAO_ESTUDO',
            sourceOfTruth: ['PROCESS_SNAPSHOT', 'DECISION_TRACE'],
            sourcePaths: ['requestingDepartment', 'responsibleAnalyst', 'analysisDate', ...SHARED_CLASSIFICATION_PATHS],
            coherenceChecks: ['DFD_ETP_CLASSIFICATION_ALIGNMENT'],
            getApplicability: alwaysRequired,
        },
        NEED: {
            blockId: 'ETP_NECESSIDADE_E_RESULTADOS',
            sectionType: 'NEED',
            title: 'ETP_NECESSIDADE_E_RESULTADOS',
            sourceOfTruth: ['PROCESS_SNAPSHOT', 'DECISION_EXPLANATION'],
            sourcePaths: ['needDescription', 'expectedResults'],
            coherenceChecks: ['DFD_ETP_NEED_ALIGNMENT', 'ETP_TR_OBJECT_ALIGNMENT'],
            getApplicability: alwaysRequired,
        },
        STRUCTURE: {
            blockId: 'ETP_ENQUADRAMENTO_ESTRUTURAL',
            sectionType: 'STRUCTURE',
            title: 'ETP_ENQUADRAMENTO_ESTRUTURAL',
            sourceOfTruth: ['PROCESS_SNAPSHOT', 'DERIVED'],
            sourcePaths: ['objectStructure', 'structureType', 'items', 'lots'],
            coherenceChecks: ['STRUCTURE_CLASSIFICATION_CONSISTENCY'],
            getApplicability: alwaysRequired,
        },
        CALCULATION: {
            blockId: 'ETP_MEMORIA_CALCULO',
            sectionType: 'CALCULATION',
            title: 'ETP_MEMORIA_CALCULO',
            sourceOfTruth: ['CALCULATION_MEMORY', 'PROCESS_SNAPSHOT'],
            sourcePaths: ['calculationMemory', 'calculationMemories'],
            coherenceChecks: ['CALCULATION_NEED_CONSISTENCY'],
            getApplicability: calculationRequiredOrProhibitedInSingleExecution,
        },
        JUSTIFICATION: {
            blockId: 'ETP_SOLUCAO_E_JUSTIFICATIVA_TECNICA',
            sectionType: 'JUSTIFICATION',
            title: 'ETP_SOLUCAO_E_JUSTIFICATIVA_TECNICA',
            sourceOfTruth: ['PROCESS_SNAPSHOT', 'DECISION_EXPLANATION'],
            sourcePaths: ['solutionSummary', 'technicalJustification'],
            coherenceChecks: ['JUSTIFICATION_NEED_CONSISTENCY', 'LEGAL_BASIS_COMPLIANCE_WHEN_DIRECT'],
            getApplicability: alwaysRequired,
        },
        STRATEGY: {
            blockId: 'ETP_ESTRATEGIA_CONTRATACAO',
            sectionType: 'STRATEGY',
            title: 'ETP_ESTRATEGIA_CONTRATACAO',
            sourceOfTruth: ['PROCESS_SNAPSHOT', 'DECISION_EXPLANATION'],
            sourcePaths: ['procurementStrategy', 'procurementStrategies'],
            coherenceChecks: ['STRATEGY_NEED_CONSISTENCY'],
            getApplicability: alwaysRequired,
        },
        COHERENCE: {
            blockId: 'ETP_COERENCIA_RASTREAVEL',
            sectionType: 'COHERENCE',
            title: 'ETP_COERENCIA_RASTREAVEL',
            sourceOfTruth: ['DECISION_TRACE', 'VALIDATION_RESULT'],
            sourcePaths: ['trace.hasInconsistency', 'trace.isComplete', 'validations'],
            coherenceChecks: ['TRACE_EXPLANATION_DOCUMENT_ALIGNMENT', 'DFD_ETP_TR_COHERENCE'],
            getApplicability: alwaysRequired,
        },
    },
    'TR': {
        IDENTIFICATION: {
            blockId: 'TR_IDENTIFICACAO_TERMO',
            sectionType: 'IDENTIFICATION',
            title: 'TR_IDENTIFICACAO_TERMO',
            sourceOfTruth: ['PROCESS_SNAPSHOT', 'DECISION_TRACE'],
            sourcePaths: ['requestingDepartment', 'responsibleAuthor', 'referenceDate', ...SHARED_CLASSIFICATION_PATHS],
            coherenceChecks: ['ETP_TR_OBJECT_ALIGNMENT'],
            getApplicability: alwaysRequired,
        },
        NEED: {
            blockId: 'TR_OBJETO_E_FINALIDADE',
            sectionType: 'NEED',
            title: 'TR_OBJETO_E_FINALIDADE',
            sourceOfTruth: ['PROCESS_SNAPSHOT', 'DECISION_EXPLANATION'],
            sourcePaths: ['objectDescription', 'contractingPurpose'],
            coherenceChecks: ['DFD_ETP_TR_NEED_OBJECT_ALIGNMENT'],
            getApplicability: alwaysRequired,
        },
        STRUCTURE: {
            blockId: 'TR_ENQUADRAMENTO_ESTRUTURAL',
            sectionType: 'STRUCTURE',
            title: 'TR_ENQUADRAMENTO_ESTRUTURAL',
            sourceOfTruth: ['PROCESS_SNAPSHOT', 'DERIVED'],
            sourcePaths: ['objectStructure', 'structureType', 'items', 'lots'],
            coherenceChecks: ['STRUCTURE_CLASSIFICATION_CONSISTENCY'],
            getApplicability: alwaysRequired,
        },
        CALCULATION: {
            blockId: 'TR_ESTIMATIVA_E_MEMORIA_CALCULO',
            sectionType: 'CALCULATION',
            title: 'TR_ESTIMATIVA_E_MEMORIA_CALCULO',
            sourceOfTruth: ['CALCULATION_MEMORY', 'PROCESS_SNAPSHOT'],
            sourcePaths: [
                'estimatedUnitValue',
                'estimatedTotalValue',
                'pricingJustification',
                'pricingSourceDescription',
                'calculationMemory',
                'calculationMemories',
            ],
            coherenceChecks: ['TR_PRICING_ALIGNMENT'],
            getApplicability: pricingRequiredOrProhibited,
        },
        JUSTIFICATION: {
            blockId: 'TR_REQUISITOS_E_EXECUCAO',
            sectionType: 'JUSTIFICATION',
            title: 'TR_REQUISITOS_E_EXECUCAO',
            sourceOfTruth: ['PROCESS_SNAPSHOT', 'DECISION_EXPLANATION'],
            sourcePaths: ['technicalRequirements', 'executionConditions', 'acceptanceCriteria'],
            coherenceChecks: ['ETP_TR_TECHNICAL_ALIGNMENT'],
            getApplicability: alwaysRequired,
        },
        STRATEGY: {
            blockId: 'TR_ESTRATEGIA_CONTRATACAO',
            sectionType: 'STRATEGY',
            title: 'TR_ESTRATEGIA_CONTRATACAO',
            sourceOfTruth: ['PROCESS_SNAPSHOT', 'DECISION_EXPLANATION'],
            sourcePaths: ['procurementStrategy', 'procurementStrategies'],
            coherenceChecks: ['TR_PRICING_ALIGNMENT', 'STRATEGY_STRUCTURE_CONSISTENCY'],
            getApplicability: alwaysRequired,
        },
        COHERENCE: {
            blockId: 'TR_COERENCIA_RASTREAVEL',
            sectionType: 'COHERENCE',
            title: 'TR_COERENCIA_RASTREAVEL',
            sourceOfTruth: ['DECISION_TRACE', 'VALIDATION_RESULT'],
            sourcePaths: ['trace.hasInconsistency', 'trace.isComplete', 'validations'],
            coherenceChecks: ['TRACE_EXPLANATION_DOCUMENT_ALIGNMENT', 'DFD_ETP_TR_COHERENCE', 'TR_PRICING_ALIGNMENT'],
            getApplicability: alwaysRequired,
        },
    },
    'PRICING': {
        IDENTIFICATION: {
            blockId: 'PRICING_IDENTIFICATION',
            sectionType: 'IDENTIFICATION',
            title: 'PRICING_IDENTIFICATION',
            sourceOfTruth: ['PROCESS_SNAPSHOT'],
            sourcePaths: ['requestingDepartmentForPricing', ...SHARED_CLASSIFICATION_PATHS],
            coherenceChecks: ['TR_PRICING_ALIGNMENT'],
            getApplicability: alwaysRequired,
        },
        NEED: {
            blockId: 'PRICING_NEED',
            sectionType: 'NEED',
            title: 'PRICING_NEED',
            sourceOfTruth: ['PROCESS_SNAPSHOT'],
            sourcePaths: ['referenceItemsDescription'],
            coherenceChecks: ['TR_PRICING_ALIGNMENT'],
            getApplicability: alwaysRequired,
        },
        STRUCTURE: {
            blockId: 'PRICING_STRUCTURE',
            sectionType: 'STRUCTURE',
            title: 'PRICING_STRUCTURE',
            sourceOfTruth: ['PROCESS_SNAPSHOT'],
            sourcePaths: ['objectStructure', 'items', 'lots'],
            coherenceChecks: ['TR_PRICING_ALIGNMENT'],
            getApplicability: alwaysRequired,
        },
        CALCULATION: {
            blockId: 'PRICING_CALCULATION',
            sectionType: 'CALCULATION',
            title: 'PRICING_CALCULATION',
            sourceOfTruth: ['PROCESS_SNAPSHOT'],
            sourcePaths: ['estimatedUnitValue', 'estimatedTotalValue', 'pricingJustification'],
            coherenceChecks: ['TR_PRICING_ALIGNMENT'],
            getApplicability: requiredWithPricing,
        },
        JUSTIFICATION: {
            blockId: 'PRICING_JUSTIFICATION',
            sectionType: 'JUSTIFICATION',
            title: 'PRICING_JUSTIFICATION',
            sourceOfTruth: ['PROCESS_SNAPSHOT'],
            sourcePaths: ['pricingJustification'],
            coherenceChecks: ['TR_PRICING_ALIGNMENT'],
            getApplicability: alwaysRequired,
        },
        STRATEGY: {
            blockId: 'PRICING_STRATEGY',
            sectionType: 'STRATEGY',
            title: 'PRICING_STRATEGY',
            sourceOfTruth: ['PROCESS_SNAPSHOT'],
            sourcePaths: ['pricingSourceDescription'],
            coherenceChecks: ['TR_PRICING_ALIGNMENT'],
            getApplicability: alwaysRequired,
        },
        COHERENCE: {
            blockId: 'PRICING_COHERENCE',
            sectionType: 'COHERENCE',
            title: 'PRICING_COHERENCE',
            sourceOfTruth: ['DECISION_TRACE'],
            sourcePaths: ['trace.hasInconsistency', 'trace.isComplete'],
            coherenceChecks: ['TR_PRICING_ALIGNMENT'],
            getApplicability: alwaysRequired,
        },
    },
};
